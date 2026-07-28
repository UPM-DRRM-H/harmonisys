import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

type RouteContext = {
    params: Promise<{ membershipId: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { membershipId } = await context.params;

        // Verify requester is the team leader
        const leaderMembership = await prisma.miSaludMembership.findFirst({
            where: {
                userId: session.user.id,
                role: 'TEAM_LEADER',
                status: 'APPROVED',
            },
        });

        if (!leaderMembership) {
            return NextResponse.json({ error: 'Not authorized as Team Leader' }, { status: 403 });
        }

        // Verify target membership belongs to the same team
        const targetMembership = await prisma.miSaludMembership.findUnique({
            where: { id: membershipId },
        });

        if (!targetMembership) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        if (targetMembership.teamId !== leaderMembership.teamId) {
            return NextResponse.json({ error: 'Member is not on your team' }, { status: 403 });
        }

        if (targetMembership.role === 'TEAM_LEADER') {
            return NextResponse.json({ error: 'Cannot remove the team leader' }, { status: 400 });
        }

        await prisma.miSaludMembership.delete({ where: { id: membershipId } });

        return NextResponse.json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing member:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
