import {
    reportingMonths,
    reportingMonthKey,
    reportingStart,
} from '@/lib/chartData';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { UserType } from '@prisma/client';

interface MonthData {
    month: string;
    label: string;
    incidents: number;
    unahon: number;
    submissions: number;
}

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized', data: null },
                { status: 401 }
            );
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, name: true, email: true, role: true },
        });

        if (!currentUser) {
            return NextResponse.json(
                { success: false, error: 'User not found', data: null },
                { status: 404 }
            );
        }

        if (currentUser.role === UserType.STANDARD)
            return NextResponse.json(
                {
                    success: false,
                    error: 'Analytics require approved Responder or Admin access.',
                    data: null,
                },
                { status: 403 }
            );
        const isAdmin = currentUser.role === UserType.ADMIN;

        const twelveMonthsAgo = reportingStart();

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const incidentWhere = {
            createdAt: { gte: twelveMonthsAgo },
            ...(isAdmin ? {} : { userId: currentUser.id }),
        };
        const incidentRecentWhere = {
            createdAt: { gte: sevenDaysAgo },
            ...(isAdmin ? {} : { userId: currentUser.id }),
        };

        const unahonWhere = isAdmin
            ? { date: { gte: twelveMonthsAgo } }
            : { userId: currentUser.id, date: { gte: twelveMonthsAgo } };

        const unahonRecentWhere = isAdmin
            ? { date: { gte: sevenDaysAgo } }
            : { userId: currentUser.id, date: { gte: sevenDaysAgo } };

        const submissionWhere = isAdmin
            ? { createdAt: { gte: twelveMonthsAgo } }
            : ({
                  userId: currentUser.id,
                  createdAt: { gte: twelveMonthsAgo },
              } as any);

        const submissionRecentWhere = isAdmin
            ? { createdAt: { gte: sevenDaysAgo } }
            : ({
                  userId: currentUser.id,
                  createdAt: { gte: sevenDaysAgo },
              } as any);

        // ── Monthly raw records ──────────────────────────────────────────────

        const monthlyIncidents = await prisma.incident.findMany({
            where: incidentWhere,
            select: { createdAt: true },
        });

        const monthlyUnahon = await prisma.unahon.findMany({
            where: unahonWhere,
            select: { date: true },
        });

        const monthlySubmissions = await prisma.submission
            .findMany({
                where: submissionWhere,
                select: { createdAt: true },
            } as any)
            .catch(() => []);

        // ── Build last 12 month slots ────────────────────────────────────────

        const months: MonthData[] = reportingMonths().map((month) => ({
            ...month,
            incidents: 0,
            unahon: 0,
            submissions: 0,
        }));

        monthlyIncidents.forEach((item) => {
            const monthKey = reportingMonthKey(item.createdAt);
            const idx = months.findIndex((m) => m.month === monthKey);
            if (idx !== -1) months[idx].incidents += 1;
        });

        monthlyUnahon.forEach((item) => {
            const monthKey = reportingMonthKey(item.date);
            const idx = months.findIndex((m) => m.month === monthKey);
            if (idx !== -1) months[idx].unahon += 1;
        });

        monthlySubmissions.forEach((item: { createdAt: Date }) => {
            const monthKey = item.createdAt.toISOString().slice(0, 7);
            const idx = months.findIndex((m) => m.month === monthKey);
            if (idx !== -1) months[idx].submissions += 1;
        });

        // ── Distributions ────────────────────────────────────────────────────

        const incidentFilterWhere = isAdmin
            ? undefined
            : { userId: currentUser.id };

        const categoryDistribution = await prisma.incident.groupBy({
            by: ['category'],
            _count: { category: true },
            where: incidentFilterWhere,
        });

        const assessmentTypeDistribution = await prisma.unahon.groupBy({
            by: ['assessmentType'],
            _count: { assessmentType: true },
            where: isAdmin ? undefined : { userId: currentUser.id },
        });

        const userRoleDistribution = isAdmin
            ? await prisma.user.groupBy({
                  by: ['role'],
                  where: { active: true },
                  _count: { role: true },
              })
            : [];

        const topLocations = await prisma.incident.groupBy({
            by: ['location'],
            _count: { location: true },
            where: incidentFilterWhere,
            orderBy: { _count: { location: 'desc' } },
            take: 10,
        });

        // ── Recent activity (last 7 days) ────────────────────────────────────

        const recentIncidents = await prisma.incident.findMany({
            where: incidentRecentWhere,
            select: {
                id: true,
                location: true,
                category: true,
                createdAt: true,
                summary: true,
                reporter: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const recentUnahon = await prisma.unahon.findMany({
            where: unahonRecentWhere,
            select: {
                id: true,
                client: true,
                assessmentType: true,
                date: true,
                responder: { select: { name: true } },
            },
            orderBy: { date: 'desc' },
        });

        const recentSubmissions = await prisma.submission
            .findMany({
                where: submissionRecentWhere,
                select: { id: true, name: true, team: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
            } as any)
            .catch(() => []);

        const recentActivities = [
            ...recentIncidents.map((incident) => ({
                id: incident.id,
                type: 'incident',
                title: `${incident.category} incident in ${incident.location}`,
                description: incident.summary,
                timestamp: incident.createdAt,
                tool: 'IRS',
            })),
            ...recentUnahon.map((unahon) => ({
                id: unahon.id,
                type: 'assessment',
                title: `${unahon.assessmentType} assessment for ${unahon.client}`,
                description: `Conducted by ${unahon.responder.name || 'Unknown'}`,
                timestamp: unahon.date,
                tool: 'Unahon',
            })),
            ...recentSubmissions.map((submission: any) => ({
                id: submission.id,
                type: 'questionnaire',
                title: `Questionnaire submitted by ${submission.name}`,
                description: `Team: ${submission.team}`,
                timestamp: submission.createdAt,
                tool: 'MiSalud',
            })),
        ]
            .sort(
                (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime()
            )
            .slice(0, 20);

        // ── Response ─────────────────────────────────────────────────────────

        const chartsData = {
            monthlyTrends: {
                labels: months.map((m) => m.label),
                datasets: [
                    {
                        label: 'Incidents',
                        data: months.map((m) => m.incidents),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    },
                    {
                        label: 'Unahon Assessments',
                        data: months.map((m) => m.unahon),
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    },
                    {
                        label: 'Questionnaires',
                        data: months.map((m) => m.submissions),
                        borderColor: '#ec4899',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    },
                ],
            },
            distributions: {
                severity: [],
                category: categoryDistribution.map((item) => ({
                    name: item.category,
                    value: item._count.category,
                })),
                assessmentType: assessmentTypeDistribution.map((item) => ({
                    name: item.assessmentType,
                    value: item._count.assessmentType,
                })),
                userRole: userRoleDistribution.map((item) => ({
                    name: item.role,
                    value: item._count.role,
                })),
            },
            topLocations: topLocations.map((item) => ({
                name: item.location,
                value: item._count.location,
            })),
            recentActivity: recentActivities,
        };

        return NextResponse.json({
            success: true,
            data: chartsData,
            message: 'Dashboard charts data retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching dashboard charts data:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch dashboard charts data',
                data: null,
            },
            { status: 500 }
        );
    }
}
