// app/api/misalud/requests/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// ── Notification helpers ───────────────────────────────────────────────────

async function notifyMemberApproved(
    userId: string,
    teamName: string,
    requestId: string
) {
    await prisma.notification.create({
        data: {
            userId,
            type: 'MISALUD_TEAM_APPROVED',
            title: 'MiSalud Request Approved',
            message: `Your request to join ${teamName} as a Team Member has been approved.`,
            read: false,
            refId: requestId,
            refType: 'MISALUD_REQUEST',
            link: '/misalud/membership',
        },
    });
}

async function notifyMemberRejected(
    userId: string,
    teamName: string,
    requestId: string,
    reason?: string
) {
    await prisma.notification.create({
        data: {
            userId,
            type: 'MISALUD_TEAM_REJECTED',
            title: 'MiSalud Request Rejected',
            message: reason
                ? `Your request to join ${teamName} as a Team Member was rejected. Reason: ${reason}`
                : `Your request to join ${teamName} as a Team Member has been rejected.`,
            read: false,
            refId: requestId,
            refType: 'MISALUD_REQUEST',
            link: '/misalud/membership',
        },
    });
}

async function notifyTeamApproved(
    userId: string,
    teamName: string,
    requestId: string
) {
    await prisma.notification.create({
        data: {
            userId,
            type: 'MISALUD_TEAM_APPROVED',
            title: 'Team Registration Approved',
            message: `Your team "${teamName}" has been approved. You are now an active Team Leader.`,
            read: false,
            refId: requestId,
            refType: 'MISALUD_REQUEST',
            link: '/misalud/team',
        },
    });
}

async function notifyTeamRejected(
    userId: string,
    teamName: string,
    requestId: string,
    reason?: string
) {
    await prisma.notification.create({
        data: {
            userId,
            type: 'MISALUD_TEAM_REJECTED',
            title: 'Team Registration Rejected',
            message: reason
                ? `Your team registration for "${teamName}" was rejected. Reason: ${reason}`
                : `Your team registration for "${teamName}" has been rejected.`,
            read: false,
            refId: requestId,
            refType: 'MISALUD_REQUEST',
            link: '/misalud/team',
        },
    });
}

// ── PATCH — approve or reject a request ───────────────────────────────────

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(
    req: Request,
    context: RouteContext
) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as {
        status: 'APPROVED' | 'REJECTED';
        rejectionReason?: string;
    };

    const { id } = await context.params;

    const request = await prisma.miSaludRequest.findUnique({
        where: { id },
        include: { user: true, team: true },
    });

    if (!request) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // ── 1. Persist the status change ────────────────────────────────────────
    const updated = await prisma.miSaludRequest.update({
        where: { id },
        data: {
            status: body.status,
            rejectionReason: body.rejectionReason ?? null,
            reviewedAt: new Date(),
            reviewedById: session.user.id,
        },
    });

    // ── 2. If approved → also upsert the membership row ─────────────────────
    if (body.status === 'APPROVED' && request.teamId) {
        await prisma.miSaludMembership.upsert({
            where: {
                userId_teamId: {
                    userId: request.userId,
                    teamId: request.teamId,
                },
            },
            create: {
                userId: request.userId,
                teamId: request.teamId,
                role: request.requestedRole,
                status: 'APPROVED',
                approvedAt: new Date(),
            },
            update: {
                status: 'APPROVED',
                approvedAt: new Date(),
            },
        });
    }

    // ── 3. Fire notifications ────────────────────────────────────────────────
    const teamName = request.team?.name ?? request.teamName;
    const isTeamLeaderRequest = request.requestedRole === 'TEAM_LEADER';

    if (body.status === 'APPROVED') {
        if (isTeamLeaderRequest) {
            await notifyTeamApproved(request.userId, teamName, request.id);
        } else {
            await notifyMemberApproved(request.userId, teamName, request.id);
        }
    } else {
        if (isTeamLeaderRequest) {
            await notifyTeamRejected(
                request.userId,
                teamName,
                request.id,
                body.rejectionReason
            );
        } else {
            await notifyMemberRejected(
                request.userId,
                teamName,
                request.id,
                body.rejectionReason
            );
        }
    }

    return NextResponse.json({ request: updated });
}
