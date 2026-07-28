import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/misalud/member/dashboard
// Returns the current member's team, teammates, and notification-relevant info
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

        const team = membership.team;

        // Teammates (all approved members of the same team, excluding self)
        const teammates = await prisma.miSaludMembership.findMany({
            where: {
                teamId: team.id,
                status: 'APPROVED',
                NOT: { userId: session.user.id },
            },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
            orderBy: { approvedAt: 'asc' },
        });

        // Team leader info
        const leaderMembership = await prisma.miSaludMembership.findFirst({
            where: { teamId: team.id, role: 'TEAM_LEADER', status: 'APPROVED' },
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
        });

        return NextResponse.json({
            membership: {
                id: membership.id,
                teamId: team.id,
                teamName: team.name,
                approvedAt: membership.approvedAt,
            },
            leader: leaderMembership
                ? {
                      userId: leaderMembership.user.id,
                      name: leaderMembership.user.name,
                      email: leaderMembership.user.email,
                      image: leaderMembership.user.image,
                  }
                : null,
            teammates: teammates.map((m) => ({
                userId: m.user.id,
                name: m.user.name,
                email: m.user.email,
                image: m.user.image,
                approvedAt: m.approvedAt,
            })),
        });
    } catch (error) {
        console.error('GET /api/misalud/member/dashboard error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
