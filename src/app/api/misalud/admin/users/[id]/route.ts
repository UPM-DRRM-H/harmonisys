import { withAccess } from '@/lib/apiAccess';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = {
    params: Promise<{
        id: string;
    }>;
};

async function handlePATCH(req: Request, context: Params) {
    try {
        const { id } = await context.params;
        const { teamName } = await req.json();

        if (!teamName?.trim()) {
            return NextResponse.json(
                { error: 'Team name is required' },
                { status: 400 }
            );
        }

        const membership = await prisma.miSaludMembership.findUnique({
            where: { id },
            include: { team: true },
        });

        if (!membership) {
            return NextResponse.json(
                { error: 'Mi Salud user not found' },
                { status: 404 }
            );
        }

        const updatedTeam = await prisma.$transaction(async (tx) => {
            const updated = await tx.miSaludTeam.update({
                where: { id: membership.teamId },
                data: { name: teamName.trim() },
            });
            await tx.submission.updateMany({
                where: { teamId: membership.teamId },
                data: { team: updated.name },
            });
            return updated;
        });

        return NextResponse.json({
            success: true,
            team: updatedTeam,
        });
    } catch (error) {
        console.error('Update Mi Salud team name error:', error);

        return NextResponse.json(
            { error: 'Failed to update team name' },
            { status: 500 }
        );
    }
}

async function handleDELETE(_req: Request, context: Params) {
    try {
        const { id } = await context.params;

        const membership = await prisma.miSaludMembership.findUnique({
            where: { id },
        });

        if (!membership) {
            return NextResponse.json(
                { error: 'Mi Salud membership not found' },
                { status: 404 }
            );
        }

        if (membership.role === 'TEAM_LEADER')
            return NextResponse.json(
                {
                    error: 'Assign another team leader before removing this membership.',
                },
                { status: 409 }
            );
        // Preserve health history when removing access to a team.
        await prisma.miSaludMembership.update({
            where: { id },
            data: { status: 'REJECTED' },
        });

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error('Delete Mi Salud user error:', error);

        return NextResponse.json(
            { error: 'Failed to delete Mi Salud user' },
            { status: 500 }
        );
    }
}

export const PATCH = withAccess(handlePATCH, ['ADMIN']);

export const DELETE = withAccess(handleDELETE, ['ADMIN']);
