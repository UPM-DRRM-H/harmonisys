import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// DELETE /api/misalud/member/leave
// Removes the current user's TEAM_MEMBER membership
export async function DELETE() {
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
        });

        if (!membership) {
            return NextResponse.json({ error: 'No active team membership found' }, { status: 404 });
        }

        await prisma.miSaludMembership.delete({ where: { id: membership.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/misalud/member/leave error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
