import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { IRSdb } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { auth } from '@/lib/auth';
import { UserType } from '@prisma/client';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Unauthorized',
                    data: null,
                },
                { status: 401 }
            );
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        if (!currentUser) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'User not found',
                    data: null,
                },
                { status: 404 }
            );
        }

        const isAdmin = currentUser.role === UserType.ADMIN;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const userAliases = [
            currentUser.name?.trim(),
            currentUser.email?.trim(),
        ].filter(Boolean) as string[];

        const incidentUserWhere = isAdmin
            ? {}
            : {
                  OR: userAliases.map((alias) => ({
                      reporter: {
                          equals: alias,
                          mode: 'insensitive' as const,
                      },
                  })),
              };

        const recentIncidentUserWhere = isAdmin
            ? { createdAt: { gte: thirtyDaysAgo } }
            : {
                  AND: [
                      { createdAt: { gte: thirtyDaysAgo } },
                      {
                          OR: userAliases.map((alias) => ({
                              reporter: {
                                  equals: alias,
                                  mode: 'insensitive' as const,
                              },
                          })),
                      },
                  ],
              };

        const unahonWhere = isAdmin ? {} : { userId: currentUser.id };
        const recentUnahonWhere = isAdmin
            ? { date: { gte: thirtyDaysAgo } }
            : {
                  userId: currentUser.id,
                  date: { gte: thirtyDaysAgo },
              };

        const submissionWhere = isAdmin
            ? {}
            : ({ userId: currentUser.id } as any);
        const recentSubmissionWhere = isAdmin
            ? { createdAt: { gte: thirtyDaysAgo } }
            : ({
                  userId: currentUser.id,
                  createdAt: { gte: thirtyDaysAgo },
              } as any);

        // Admin-only global sources
        const [
            userStats,
            incidentStats,
            unahonStats,
            questionnaireStats,
            irsEvents,
            redasStats,
        ] = await Promise.allSettled([
            isAdmin
                ? prisma.user.groupBy({ by: ['role'], _count: { role: true } })
                : Promise.resolve([]),

            isAdmin
                ? prisma.incident.groupBy({
                      by: ['category'],
                      _count: { category: true },
                  })
                : Promise.resolve([]),

            isAdmin
                ? prisma.unahon.groupBy({
                      by: ['assessmentType'],
                      _count: { assessmentType: true },
                  })
                : Promise.resolve([]),

            isAdmin
                ? prisma.submission.count()
                : prisma.submission
                      .count({ where: submissionWhere })
                      .catch(() => 0),

            isAdmin
                ? getDocs(collection(IRSdb, 'events'))
                : Promise.resolve(null),

            isAdmin
                ? fetch(
                      `${process.env.NEXT_PUBLIC_BASE_URL}/api/redas?sheetName=Trainings&label=PROVINCES&count=true`
                  )
                      .then((res) => res.json())
                      .catch(() => ({ count: 0 }))
                : Promise.resolve({ count: 0 }),
        ]);

        const totalUsers =
            isAdmin && userStats.status === 'fulfilled'
                ? userStats.value.reduce(
                      (sum, item) => sum + item._count.role,
                      0
                  )
                : 0;

        const usersByRole =
            isAdmin && userStats.status === 'fulfilled'
                ? userStats.value.reduce(
                      (acc, item) => {
                          acc[item.role] = item._count.role;
                          return acc;
                      },
                      {} as Record<string, number>
                  )
                : {};

        const incidentsByCategory =
            isAdmin && incidentStats.status === 'fulfilled'
                ? incidentStats.value.reduce(
                      (acc, item) => {
                          acc[item.category] = item._count.category;
                          return acc;
                      },
                      {} as Record<string, number>
                  )
                : {};

        const unahonByType =
            isAdmin && unahonStats.status === 'fulfilled'
                ? unahonStats.value.reduce(
                      (acc, item) => {
                          acc[item.assessmentType] = item._count.assessmentType;
                          return acc;
                      },
                      {} as Record<string, number>
                  )
                : {};

        const totalIRSEvents =
            isAdmin &&
            irsEvents.status === 'fulfilled' &&
            irsEvents.value &&
            !irsEvents.value.empty
                ? irsEvents.value.size
                : 0;

        const redasTrainingSessions =
            isAdmin &&
            redasStats.status === 'fulfilled' &&
            redasStats.value.count
                ? redasStats.value.count
                : 0;

        // Role-based totals
        const [totalIncidents, totalUnahonAssessments] = await Promise.all([
            prisma.incident.count({
                where: incidentUserWhere,
            }),
            prisma.unahon.count({
                where: unahonWhere,
            }),
        ]);

        const totalQuestionnaires =
            questionnaireStats.status === 'fulfilled'
                ? questionnaireStats.value
                : 0;

        // Recent counts (last 30 days, role-aware)
        const [
            recentIncidentsCount,
            recentUnahonCount,
            recentSubmissionsCount,
        ] = await Promise.all([
            prisma.incident.count({
                where: recentIncidentUserWhere,
            }),
            prisma.unahon.count({
                where: recentUnahonWhere,
            }),
            prisma.submission
                .count({
                    where: recentSubmissionWhere,
                } as any)
                .catch(() => 0),
        ]);

        // Recent activities: for admin = all recent incidents, for others = only their incidents
        const recentIncidents = await prisma.incident.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            where: incidentUserWhere,
            select: {
                id: true,
                location: true,
                summary: true,
                category: true,
                createdAt: true,
                reporter: true,
                otherCategoryDetail: true,
            },
        });

        // Top responders only makes sense for admin/global dashboard
        let topRespondersWithNames: { name: string; count: number }[] = [];

        if (isAdmin) {
            const topResponders = await prisma.unahon.groupBy({
                by: ['userId'],
                _count: { userId: true },
                orderBy: { _count: { userId: 'desc' } },
                take: 5,
            });

            topRespondersWithNames = await Promise.all(
                topResponders.map(async (responder) => {
                    const user = await prisma.user.findUnique({
                        where: { id: responder.userId },
                        select: { name: true },
                    });

                    return {
                        name: user?.name || 'Unknown',
                        count: responder._count.userId,
                    };
                })
            );
        }

        const dashboardStats = {
            overview: {
                totalUsers,
                totalIncidents,
                totalUnahonAssessments,
                totalQuestionnaires,
                totalIRSEvents,
                redasTrainingSessions,
            },
            recent: {
                recentIncidents: recentIncidentsCount,
                recentUnahonAssessments: recentUnahonCount,
                recentSubmissions: recentSubmissionsCount,
            },
            breakdown: {
                usersByRole,
                incidentsByCategory,

                unahonByType,
            },
            topResponders: topRespondersWithNames,
            recentActivities: recentIncidents.map((incident) => ({
                tool: 'IRS',
                action:
                    incident.category.toLowerCase() === 'other' &&
                    `New ${incident.otherCategoryDetail?.toLowerCase() || 'incident'} in ${incident.location}`,

                timestamp: incident.createdAt.toISOString(),
                user: incident.reporter || 'Anonymous',
            })),
            system: {
                lastUpdated: new Date().toISOString(),
                status: 'operational',
            },
        };

        const response = NextResponse.json({
            success: true,
            data: dashboardStats,
            message: 'Dashboard statistics retrieved successfully',
        });

        response.headers.set('Cache-Control', 'private, max-age=60');
        return response;
    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch dashboard statistics',
                data: null,
            },
            { status: 500 }
        );
    }
}
