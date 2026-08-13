/**
 * app/api/admin/users/role-requests/[id]/route.ts
 *
 * PATCH — Admin approves or rejects a pending role request.
 *         Sends an email notification to the requesting user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // Import auth from your main auth config
import { prisma } from '@/lib/prisma';
import { sendRoleApprovedEmail, sendRoleRejectedEmail } from '@/lib/email';
import { UserType } from '@prisma/client';

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(
    req: NextRequest,
    context: RouteContext
) {
    // Auth guard (admin only)
    const session = await auth();
    if (!session?.user?.id || session.user.role !== UserType.ADMIN) {
        return NextResponse.json(
            { success: false, message: 'Forbidden.' },
            { status: 403 }
        );
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { action, reason } = body as {
        action: 'APPROVE' | 'REJECT';
        reason?: string;
    };

    if (action !== 'APPROVE' && action !== 'REJECT') {
        return NextResponse.json(
            { success: false, message: 'action must be APPROVE or REJECT.' },
            { status: 400 }
        );
    }

    // Fetch the request + the requesting user's info
    // Schema relation name is "RoleChangeUser" → Prisma accessor is `user`
    const roleRequest = await prisma.roleChangeRequest.findUnique({
        where: { id },
        include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!roleRequest) {
        return NextResponse.json(
            { success: false, message: 'Request not found.' },
            { status: 404 }
        );
    }

    if (roleRequest.status !== 'PENDING') {
        return NextResponse.json(
            {
                success: false,
                message: 'This request has already been actioned.',
            },
            { status: 409 }
        );
    }

    // Resolve inside a transaction
    await prisma.$transaction(async (tx) => {
        // Update request status + stamp reviewer
        await tx.roleChangeRequest.update({
            where: { id },
            data: {
                status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                reviewedAt: new Date(),
                reviewedById: session.user.id,
            },
        });

        // If approved — upgrade user's role, MHPSS level, org, and certificate
        if (action === 'APPROVE') {
            await tx.user.update({
                where: { id: roleRequest.userId },
                data: {
                    role: roleRequest.toRole as UserType,
                    // requestedMhpssLevel is already typed as MhpssLevel? in schema — no cast needed
                    ...(roleRequest.requestedMhpssLevel
                        ? { mhpssLevel: roleRequest.requestedMhpssLevel }
                        : {}),
                    ...(roleRequest.requestedResponderOrganization
                        ? {
                              responderOrganization:
                                  roleRequest.requestedResponderOrganization,
                          }
                        : {}),
                    ...(roleRequest.requestedMhpssCertificateFileUrl
                        ? {
                              mhpssCertificateFileUrl:
                                  roleRequest.requestedMhpssCertificateFileUrl,
                          }
                        : {}),
                },
            });
        }
    });

    // Send notification email to the requesting user (fire-and-forget)
    const { name, email } = roleRequest.user;

    if (action === 'APPROVE') {
        sendRoleApprovedEmail({
            userName: name,
            userEmail: email,
            newRole: roleRequest.toRole,
        }).catch((err) =>
            console.error('[email] sendRoleApprovedEmail failed:', err)
        );
    } else {
        sendRoleRejectedEmail({
            userName: name,
            userEmail: email,
            toRole: roleRequest.toRole,
            reason: reason ?? null,
        }).catch((err) =>
            console.error('[email] sendRoleRejectedEmail failed:', err)
        );
    }

    return NextResponse.json({ success: true });
}
