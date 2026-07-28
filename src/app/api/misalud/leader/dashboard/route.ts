import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const leaderMembership = await prisma.miSaludMembership.findFirst({
            where: {
                userId: session.user.id,
                role: 'TEAM_LEADER',
                status: 'APPROVED',
            },
            include: { team: true },
            orderBy: { updatedAt: 'desc' },
        });

        if (!leaderMembership) {
            return NextResponse.json(
                { error: 'No approved Team Leader membership found' },
                { status: 403 }
            );
        }

        const team = leaderMembership.team;
        const teamCode = team.id.slice(0, 6).toUpperCase();

        // Get all approved members of the team (excluding the leader)
        const memberships = await prisma.miSaludMembership.findMany({
            where: {
                teamId: team.id,
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

        // Get pending join requests for this team
        const pendingRequests = await prisma.miSaludRequest.findMany({
            where: {
                teamId: team.id,
                requestedRole: 'TEAM_MEMBER',
                reviewLevel: 'TEAM_LEADER',
                status: 'PENDING',
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            team: {
                id: team.id,
                name: team.name,
                code: teamCode,
                createdAt: team.createdAt,
            },
            members: memberships.map((m) => ({
                membershipId: m.id,
                userId: m.userId,
                name: m.user.name,
                email: m.user.email,
                image: m.user.image,
                approvedAt: m.approvedAt,
            })),
            pendingRequests,
        });
    } catch (error) {
        console.error('Error fetching TL dashboard:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
