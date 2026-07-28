import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/misalud/member/screenings
// Returns screening schedules for the member's team, with the member's submission status
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const membership = await prisma.miSaludMembership.findFirst({
            where: {
                userId: session.user.id,
                role: 'TEAM_MEMBER',
                status: 'APPROVED',
            },
            include: { team: true },
            orderBy: { updatedAt: 'desc' },
        });

        if (!membership) {
            return NextResponse.json({ error: 'No approved Team Member membership found' }, { status: 403 });
        }

        const schedules = await prisma.miSaludScreeningSchedule.findMany({
            where: { teamId: membership.teamId },
            orderBy: { createdAt: 'desc' },
        });

        const now = new Date();

        // For each schedule check if this member has already submitted within the window
        const enriched = await Promise.all(
            schedules.map(async (s) => {
                const submission = await prisma.submission.findFirst({
                    where: {
                        userId: session.user.id,
                        team: membership.team.name,
                        createdAt: { gte: s.validDate, lte: s.dueDate },
                    },
                    orderBy: { createdAt: 'desc' },
                });

                const windowStatus =
                    now < s.validDate
                        ? 'pending'
                        : now <= s.dueDate
                          ? 'active'
                          : 'past';

                return {
                    id: s.id,
                    screeningType: s.screeningType,
                    validDate: s.validDate.toISOString(),
                    dueDate: s.dueDate.toISOString(),
                    status: s.status,
                    createdAt: s.createdAt.toISOString(),
                    windowStatus,
                    hasSubmitted: !!submission,
                    submittedAt: submission?.createdAt.toISOString() ?? null,
                };
            })
        );

        return NextResponse.json({ schedules: enriched });
    } catch (error) {
        console.error('GET /api/misalud/member/screenings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
