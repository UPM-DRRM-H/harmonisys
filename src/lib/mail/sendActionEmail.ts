// lib/mail/sendAdminActionEmail.ts
import { sendCheckedMail, mailFrom } from '@/lib/mail/transport';
import { escapeEmailHtml } from '@/lib/mail/adminInbox';

export type AdminActionType =
    | 'ROLE_CHANGED'
    | 'MHPSS_CHANGED'
    | 'ACCOUNT_DELETED';

export interface AdminActionEmailPayload {
    to: string;
    userName: string | null;
    actionType: AdminActionType;
    /** Role change */
    oldRole?: string;
    newRole?: string;
    /** MHPSS change */
    oldMhpss?: string | null;
    newMhpss?: string | null;
}

const actionLabel: Record<AdminActionType, string> = {
    ROLE_CHANGED: 'Role Updated',
    MHPSS_CHANGED: 'MHPSS Level Updated',
    ACCOUNT_DELETED: 'Account Deactivated',
};

function buildBody(payload: AdminActionEmailPayload): string {
    const { userName, actionType, oldRole, newRole, oldMhpss, newMhpss } =
        payload;

    const displayName = escapeEmailHtml(userName ?? 'User');
    const timestamp = new Date().toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        dateStyle: 'long',
        timeStyle: 'short',
    });

    const accentColor = '#7B122F';
    const badgeStyle = `
        display:inline-block;
        padding:4px 14px;
        border-radius:999px;
        font-weight:700;
        font-size:0.85rem;
        background:#f3e2e7;
        color:${accentColor};
        border:1px solid #e8c8d2;
    `;

    let detailsHtml = '';

    if (actionType === 'ROLE_CHANGED') {
        detailsHtml = `
            <p style="color:#374151;margin:0 0 8px">
                The account role for <strong>${displayName}</strong> has been updated by an administrator.
            </p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0">
                <tr>
                    <td style="padding:10px 16px;background:#f9f3f5;border-radius:8px 0 0 8px;color:#6b7280;font-size:0.85rem;white-space:nowrap">Previous Role</td>
                    <td style="padding:10px 16px;background:#f9f3f5;border-radius:0 8px 8px 0">
                        <span style="${badgeStyle}">${oldRole ?? '—'}</span>
                    </td>
                </tr>
                <tr><td colspan="2" style="padding:4px"></td></tr>
                <tr>
                    <td style="padding:10px 16px;background:#fdf0f3;border-radius:8px 0 0 8px;color:#6b7280;font-size:0.85rem;white-space:nowrap">New Role</td>
                    <td style="padding:10px 16px;background:#fdf0f3;border-radius:0 8px 8px 0">
                        <span style="${badgeStyle};background:#fdf0f3;border-color:#e8c8d2">${newRole ?? '—'}</span>
                    </td>
                </tr>
            </table>
        `;
    } else if (actionType === 'MHPSS_CHANGED') {
        const formatLevel = (v: string | null | undefined) =>
            v ? v.replace('LEVEL_', 'Level ') : 'Not Assessed';

        detailsHtml = `
            <p style="color:#374151;margin:0 0 8px">
                The MHPSS competency level for <strong>${displayName}</strong> has been updated by an administrator.
            </p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0">
                <tr>
                    <td style="padding:10px 16px;background:#f9f3f5;border-radius:8px 0 0 8px;color:#6b7280;font-size:0.85rem;white-space:nowrap">Previous Level</td>
                    <td style="padding:10px 16px;background:#f9f3f5;border-radius:0 8px 8px 0">
                        <span style="${badgeStyle}">${formatLevel(oldMhpss)}</span>
                    </td>
                </tr>
                <tr><td colspan="2" style="padding:4px"></td></tr>
                <tr>
                    <td style="padding:10px 16px;background:#fdf0f3;border-radius:8px 0 0 8px;color:#6b7280;font-size:0.85rem;white-space:nowrap">New Level</td>
                    <td style="padding:10px 16px;background:#fdf0f3;border-radius:0 8px 8px 0">
                        <span style="${badgeStyle};background:#fdf0f3;border-color:#e8c8d2">${formatLevel(newMhpss)}</span>
                    </td>
                </tr>
            </table>
        `;
    } else if (actionType === 'ACCOUNT_DELETED') {
        detailsHtml = `
            <p style="color:#374151;margin:0 0 8px">
                The account for <strong>${displayName}</strong> has been permanently deactivated by an administrator.
                All associated data has been removed from the system.
            </p>
            <div style="
                margin:16px 0;
                padding:14px 18px;
                background:#fef2f2;
                border:1px solid #fecaca;
                border-radius:12px;
                color:#991b1b;
                font-size:0.9rem;
            ">
                ⚠️ This action is <strong>reversible by an administrator</strong>. If this was a mistake, please contact your system administrator.
            </div>
        `;
    }

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f6f6f6;font-family:'Segoe UI',Arial,sans-serif">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;padding:32px 0">
                <tr>
                    <td align="center">
                        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

                            <!-- Header -->
                            <tr>
                                <td style="background:linear-gradient(135deg,#4A0707,#7B122F,#B91C1C);padding:28px 36px">
                                    <p style="margin:0;color:rgba(255,255,255,0.75);font-size:0.8rem;letter-spacing:0.08em;text-transform:uppercase">System Notification</p>
                                    <h1 style="margin:6px 0 0;color:#ffffff;font-size:1.5rem;font-weight:800">
                                        ${actionLabel[actionType]}
                                    </h1>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding:32px 36px">
                                    ${detailsHtml}

                                    <p style="color:#6b7280;font-size:0.8rem;margin:24px 0 0;border-top:1px solid #f3f4f6;padding-top:16px">
                                        This notification was sent automatically on <strong>${timestamp}</strong> (Philippine Time).<br>
                                        If you believe this was done in error, please contact your system administrator immediately.
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background:#f9f3f5;padding:16px 36px;text-align:center">
                                    <p style="margin:0;color:#9ca3af;font-size:0.75rem">
                                        Harmony IRS · Automated Admin Notification
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
}

export async function sendAdminActionEmail(
    payload: AdminActionEmailPayload
): Promise<void> {
    const subject: Record<AdminActionType, string> = {
        ROLE_CHANGED: `Your account role has been updated`,
        MHPSS_CHANGED: `Your MHPSS level has been updated`,
        ACCOUNT_DELETED: `Your account has been deactivated`,
    };

    await sendCheckedMail({
        from: mailFrom(),
        to: payload.to,
        subject: subject[payload.actionType],
        html: buildBody(payload),
    });
}
