// lib/notifications.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server-side helper — call this anywhere you approve/reject a request so a
// Notification row is created automatically.
// ─────────────────────────────────────────────────────────────────────────────
import { prisma } from '@/lib/prisma'; // adjust path as needed

export type NotifType =
    | 'MISALUD_REQUEST_APPROVED'
    | 'MISALUD_REQUEST_REJECTED'
    | 'MISALUD_TEAM_APPROVED'
    | 'MISALUD_TEAM_REJECTED'
    | 'MISALUD_NEW_REQUEST'
    | 'GENERAL';

interface CreateNotifOptions {
    userId: string;
    type: NotifType;
    title: string;
    message: string;
    link?: string;
    refId?: string;
    refType?: string;
}

export async function createNotification(opts: CreateNotifOptions) {
    return prisma.notification.create({
        data: {
            userId: opts.userId,
            type: opts.type,
            title: opts.title,
            message: opts.message,
            link: opts.link,
            refId: opts.refId,
            refType: opts.refType,
        },
    });
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

/** Notify a member that their join request was approved */
export async function notifyMemberApproved(
    userId: string,
    teamName: string,
    requestId: string
) {
    return createNotification({
        userId,
        type: 'MISALUD_REQUEST_APPROVED',
        title: "You've been accepted! 🎉",
        message: `Your request to join the Mi Salud team "${teamName}" has been approved.`,
        link: '/overview/misalud',
        refId: requestId,
        refType: 'MiSaludRequest',
    });
}

/** Notify a member that their join request was rejected */
export async function notifyMemberRejected(
    userId: string,
    teamName: string,
    requestId: string,
    reason?: string
) {
    return createNotification({
        userId,
        type: 'MISALUD_REQUEST_REJECTED',
        title: 'Request not approved',
        message:
            `Your request to join "${teamName}" was not approved.` +
            (reason ? ` Reason: ${reason}` : ''),
        link: '/overview/misalud',
        refId: requestId,
        refType: 'MiSaludRequest',
    });
}

/** Notify a team leader that their new team was approved by admin */
export async function notifyTeamApproved(
    userId: string,
    teamName: string,
    requestId: string
) {
    return createNotification({
        userId,
        type: 'MISALUD_TEAM_APPROVED',
        title: 'Your team is live! ✅',
        message: `Admin approved your Mi Salud team "${teamName}". You can now manage members.`,
        link: '/misalud/team-requests',
        refId: requestId,
        refType: 'MiSaludRequest',
    });
}

/** Notify a team leader that their new team was rejected */
export async function notifyTeamRejected(
    userId: string,
    teamName: string,
    requestId: string,
    reason?: string
) {
    return createNotification({
        userId,
        type: 'MISALUD_TEAM_REJECTED',
        title: 'Team registration not approved',
        message:
            `Your Mi Salud team "${teamName}" was not approved.` +
            (reason ? ` Reason: ${reason}` : ''),
        link: '/overview/misalud',
        refId: requestId,
        refType: 'MiSaludRequest',
    });
}

/**
 * Notify all admins (or a specific team leader) that a new request is pending.
 * Pass `userIds` as an array to fan-out to multiple recipients.
 */
export async function notifyNewPendingRequest(
    userIds: string[],
    requestType: 'team' | 'member',
    requesterName: string,
    teamName: string,
    requestId: string
) {
    const title =
        requestType === 'team'
            ? 'New team registration request'
            : 'New team join request';

    const message =
        requestType === 'team'
            ? `${requesterName} has requested to register a new team "${teamName}".`
            : `${requesterName} wants to join your team "${teamName}".`;

    return prisma.notification.createMany({
        data: userIds.map((uid) => ({
            userId: uid,
            type: 'MISALUD_NEW_REQUEST' as const,
            title,
            message,
            link: requestType === 'team' ? '/misalud/manage' : '/misalud/team-requests',
            refId: requestId,
            refType: 'MiSaludRequest',
        })),
    });
}
