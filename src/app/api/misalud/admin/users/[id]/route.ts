import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(req: Request, context: Params) {
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

        const updatedTeam = await prisma.miSaludTeam.update({
            where: { id: membership.teamId },
            data: { name: teamName.trim() },
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

export async function DELETE(_req: Request, context: Params) {
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

        await prisma.$transaction([
            prisma.questionResponse.deleteMany({
                where: {
                    submission: {
                        userId: membership.userId,
                    },
                },
            }),

            prisma.submission.deleteMany({
                where: {
                    userId: membership.userId,
                },
            }),

            prisma.miSaludMembership.delete({
                where: { id },
            }),
        ]);

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
