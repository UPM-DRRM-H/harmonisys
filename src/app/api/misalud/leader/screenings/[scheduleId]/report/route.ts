import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { WELLNESS_DOMAINS } from '@/constants';
import {
    getMemberOverallStatus,
    getUrgencyFromSelectedOption,
} from '@/lib/action/misalud';
import type { WellnessDomainStatus } from '@/types';

async function getLeaderTeam(userId: string) {
    return prisma.miSaludMembership.findFirst({
        where: { userId, role: 'TEAM_LEADER', status: 'APPROVED' },
        include: { team: true },
        orderBy: { updatedAt: 'desc' },
    });
}

type RouteContext = { params: Promise<{ scheduleId: string }> };

// GET /api/misalud/leader/screenings/[scheduleId]/report
export async function GET(_req: Request, context: RouteContext) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const membership = await getLeaderTeam(session.user.id);
        if (!membership) {
            return NextResponse.json(
                { error: 'No approved Team Leader membership found' },
                { status: 403 }
            );
        }

        const { scheduleId } = await context.params;

        const schedule = await prisma.miSaludScreeningSchedule.findFirst({
            where: {
                id: scheduleId,
                teamId: membership.teamId,
            },
        });

        if (!schedule) {
            return NextResponse.json({ error: 'Screening schedule not found' }, { status: 404 });
        }

        const teamMembers = await prisma.miSaludMembership.findMany({
            where: {
                teamId: membership.teamId,
                status: 'APPROVED',
                role: 'TEAM_MEMBER',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
            orderBy: { approvedAt: 'asc' },
        });

        const submissions = await prisma.submission.findMany({
            where: {
                team: membership.team.name,
                createdAt: {
                    gte: schedule.validDate,
                    lte: schedule.dueDate,
                },
            },
            include: { responses: true },
            orderBy: { createdAt: 'desc' },
        });

        const submissionByUser = new Map<string, (typeof submissions)[number]>();
        for (const submission of submissions) {
            if (!submissionByUser.has(submission.userId)) {
                submissionByUser.set(submission.userId, submission);
            }
        }

        const members = teamMembers.map((member) => {
            const submission = submissionByUser.get(member.userId);
            const responseMap = new Map(
                submission?.responses.map((response) => [
                    response.questionId,
                    response.selectedOption,
                ]) ?? []
            );

            const domains = WELLNESS_DOMAINS.map((domain) => {
                const selectedOption = responseMap.get(domain.id);
                let status: WellnessDomainStatus = 'pending';

                if (selectedOption) {
                    status = getUrgencyFromSelectedOption(domain.id, selectedOption);
                }

                return {
                    questionId: domain.id,
                    key: domain.key,
                    label: domain.label,
                    status,
                    selectedOption: selectedOption ?? null,
                };
            });

            const domainStatuses = domains.map((domain) => domain.status);
            const overallStatus = submission
                ? getMemberOverallStatus(domainStatuses)
                : 'pending';

            return {
                userId: member.userId,
                name: member.user.name,
                email: member.user.email,
                image: member.user.image,
                hasSubmitted: !!submission,
                submissionId: submission?.id ?? null,
                submittedAt: submission?.createdAt.toISOString() ?? null,
                overallStatus,
                domains,
            };
        });

        const respondedCount = members.filter((member) => member.hasSubmitted).length;
        const readyCount = members.filter((member) => member.overallStatus === 'ready').length;
        const actionRecommendedCount = members.filter(
            (member) => member.overallStatus === 'action'
        ).length;
        const urgentCount = members.filter((member) => member.overallStatus === 'urgent').length;

        return NextResponse.json({
            schedule: {
                id: schedule.id,
                screeningType: schedule.screeningType,
                validDate: schedule.validDate.toISOString(),
                dueDate: schedule.dueDate.toISOString(),
                status: schedule.status,
                createdAt: schedule.createdAt.toISOString(),
            },
            team: {
                id: membership.team.id,
                name: membership.team.name,
            },
            summary: {
                totalMembers: members.length,
                respondedCount,
                pendingCount: members.length - respondedCount,
                readyCount,
                actionRecommendedCount,
                urgentCount,
            },
            members,
        });
    } catch (error) {
        console.error('GET /api/misalud/leader/screenings/[scheduleId]/report error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
