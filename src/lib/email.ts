/**
 * lib/email.ts
 *
 * Thin wrapper around Nodemailer.
 * Configure via environment variables:
 *
 *   SMTP_HOST       — SMTP host       e.g. smtp.gmail.com
 *   SMTP_PORT       — SMTP port       e.g. 587
 *   SMTP_SECURE     — "true" for 465, "false" for STARTTLS
 *   SMTP_USER       — SMTP username / sender address
 *   SMTP_PASS       — SMTP password / app-password
 *   EMAIL_FROM      — "Display Name <address>" (falls back to SMTP_USER)
 *   DRRM_H_EMAIL    — destination admin inbox (e.g. drrm-h@yourdomain.ph)
 *   NEXT_PUBLIC_APP_URL — base URL for deep-links in emails
 */

import { sendCheckedMail, mailFrom } from '@/lib/mail/transport';
import { ADMIN_INBOX, escapeEmailHtml } from '@/lib/mail/adminInbox';

// ─── Transporter (lazy singleton) ───────────────────────────────────────────
// NOT created at module load time — env vars must be read inside a function
// so Next.js has fully populated process.env before we access them.

// ─── Helpers (lazy — read env vars at call time, not module load time) ───────

function getFrom() {
    return mailFrom();
}

function getAdminEmail() {
    return ADMIN_INBOX;
}

function getAppUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? 'https://harmonisys.ph';
}

// ─── Shared HTML wrapper ─────────────────────────────────────────────────────

function htmlWrapper(body: string) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>HARMONISYS.PH</title>
  <style>
    body { margin:0; padding:0; background:#F3E2E7; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width:580px; margin:32px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(42,6,13,0.12); }
    .header { background:linear-gradient(135deg,#4A0707,#6B0F0F,#A11B1B); padding:28px 32px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:22px; font-weight:900; letter-spacing:0.5px; }
    .header p  { margin:4px 0 0; color:rgba(255,255,255,0.8); font-size:13px; }
    .body  { padding:28px 32px; color:#1e293b; font-size:14px; line-height:1.7; }
    .badge { display:inline-block; padding:4px 14px; border-radius:99px; font-size:12px; font-weight:700; }
    .badge-pending  { background:#fef3c7; color:#92400e; border:1px solid #fde68a; }
    .badge-approved { background:#d1fae5; color:#065f46; border:1px solid #6ee7b7; }
    .badge-rejected { background:#fee2e2; color:#7f1d1d; border:1px solid #fca5a5; }
    .info-box { background:#F9F3F5; border:1px solid #e5d3da; border-radius:10px; padding:14px 18px; margin:18px 0; }
    .info-box p { margin:4px 0; font-size:13px; }
    .info-box strong { color:#4A0707; }
    .cta { display:block; margin:22px auto 0; text-align:center; }
    .cta a { background:linear-gradient(135deg,#4A0707,#A11B1B); color:#fff!important; text-decoration:none; padding:12px 28px; border-radius:10px; font-weight:700; font-size:14px; display:inline-block; }
    .footer { background:#F9F3F5; padding:16px 32px; text-align:center; color:#94a3b8; font-size:12px; border-top:1px solid #f1dde4; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>HARMONISYS.PH</h1>
      <p>DRRM Platform · Role Management</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">© ${new Date().getFullYear()} HARMONISYS.PH · This is an automated message.</div>
  </div>
</body>
</html>`;
}

// ─── 1. Email TO ADMIN when user submits a role request ─────────────────────

export async function sendRoleRequestToAdmin(payload: {
    userName: string | null;
    userEmail: string;
    toRole: string;
    requestedMhpssLevel?: string | null;
    requestedOrganization?: string | null;
    requestedCertUrl?: string | null;
    requestId: string;
}) {
    const {
        userName,
        userEmail,
        toRole,
        requestedMhpssLevel,
        requestedOrganization,
        requestedCertUrl,
        requestId,
    } = payload;

    const adminUrl = `${getAppUrl()}/users`;

    const html = htmlWrapper(`
    <p>Hello, DRRM-H Admin,</p>
    <p>
      A <strong>Standard User</strong> has submitted a request to upgrade
      their role to <strong>${toRole}</strong>.
    </p>

    <div class="info-box">
      <p><strong>Name:</strong> ${escapeEmailHtml(userName ?? 'N/A')}</p>
      <p><strong>Email:</strong> ${escapeEmailHtml(userEmail)}</p>
      <p><strong>Requested Role:</strong> ${toRole}</p>
      ${requestedOrganization ? `<p><strong>Organization:</strong> ${escapeEmailHtml(requestedOrganization)}</p>` : ''}
      ${requestedMhpssLevel ? `<p><strong>MHPSS Level:</strong> ${requestedMhpssLevel.replace('LEVEL_', 'Level ')}</p>` : ''}
      ${requestedCertUrl ? `<p><strong>Certificate:</strong> <a href="${escapeEmailHtml(requestedCertUrl)}" style="color:#A11B1B">View Certificate</a></p>` : ''}
      <p><strong>Request ID:</strong> <code>${requestId}</code></p>
    </div>

    <p>Please review and act on this request in the admin panel.</p>

    <div class="cta">
      <a href="${adminUrl}">Open Admin Panel →</a>
    </div>
  `);

    const delivery = await sendCheckedMail({
        from: getFrom(),
        to: getAdminEmail(),
        subject: `[HARMONISYS] Role Upgrade Request — ${userName ?? userEmail}`,
        html,
    });
    if (!delivery.accepted?.length || delivery.rejected?.length) {
        throw new Error(
            'The mail server did not accept the role notification.'
        );
    }
}

// ─── 2. Email TO USER when admin approves ───────────────────────────────────

export async function sendRoleApprovedEmail(payload: {
    userName: string | null;
    userEmail: string;
    newRole: string;
}) {
    const { userName, userEmail, newRole } = payload;

    const html = htmlWrapper(`
    <p>Hello ${escapeEmailHtml(userName ?? 'there')},</p>
    <p>
      Great news! Your request to upgrade to
      <strong>${newRole}</strong> on HARMONISYS.PH has been
      <span class="badge badge-approved">✓ Approved</span>.
    </p>

    <div class="info-box">
      <p>Your account now has <strong>${newRole}</strong> privileges.</p>
      <p>You can log in and explore your new capabilities from the dashboard.</p>
    </div>

    <div class="cta">
      <a href="${getAppUrl()}/dashboard">Go to Dashboard →</a>
    </div>

    <p style="margin-top:20px;font-size:13px;color:#64748b;">
      If you have any questions, please contact the DRRM-H team.
    </p>
  `);

    await sendCheckedMail({
        from: getFrom(),
        to: userEmail,
        subject: `[HARMONISYS] Your Role Upgrade Request Was Approved 🎉`,
        html,
    });
}

// ─── 3. Email TO USER when admin rejects ────────────────────────────────────

export async function sendRoleRejectedEmail(payload: {
    userName: string | null;
    userEmail: string;
    toRole: string;
    reason?: string | null;
}) {
    const { userName, userEmail, toRole, reason } = payload;

    const html = htmlWrapper(`
    <p>Hello ${userName ?? 'there'},</p>
    <p>
      We have reviewed your request to upgrade to <strong>${toRole}</strong>.
      Unfortunately, your request has been
      <span class="badge badge-rejected">✕ Rejected</span>.
    </p>

    ${
        reason
            ? `<div class="info-box"><p><strong>Reason:</strong> ${escapeEmailHtml(reason)}</p></div>`
            : ''
    }

    <p>
      You may submit a new request at any time from your account menu.
      If you believe this is an error, please contact the DRRM-H admin team.
    </p>

    <div class="cta">
      <a href="${getAppUrl()}">Back to HARMONISYS.PH →</a>
    </div>
  `);

    await sendCheckedMail({
        from: getFrom(),
        to: userEmail,
        subject: `[HARMONISYS] Your Role Upgrade Request Was Not Approved`,
        html,
    });
}
