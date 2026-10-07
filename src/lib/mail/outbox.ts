import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
    sendRoleRequestToAdmin,
    sendRoleApprovedEmail,
    sendRoleRejectedEmail,
} from '@/lib/email';
import { sendCheckedMail, mailFrom } from '@/lib/mail/transport';
import { sendAdminActionEmail } from '@/lib/mail/sendActionEmail';
import { ADMIN_INBOX, escapeEmailHtml } from '@/lib/mail/adminInbox';
export async function enqueueEmail(
    tx: Prisma.TransactionClient,
    key: string,
    kind: string,
    payload: unknown
) {
    return tx.emailDelivery.create({
        data: { key, kind, payload: JSON.parse(JSON.stringify(payload)) },
    });
}
export async function deliverEmail(id: string) {
    const now = new Date();
    const claimed = await prisma.emailDelivery.updateMany({
        where: {
            id,
            OR: [
                { status: 'PENDING', nextAttemptAt: { lte: now } },
                { status: 'SENDING', leaseUntil: { lt: now } },
            ],
        },
        data: {
            status: 'SENDING',
            leaseUntil: new Date(now.getTime() + 120000),
            attempts: { increment: 1 },
        },
    });
    if (!claimed.count)
        return (
            (
                await prisma.emailDelivery.findUnique({
                    where: { id },
                    select: { status: true },
                })
            )?.status === 'SENT'
        );
    const event = await prisma.emailDelivery.findUniqueOrThrow({
        where: { id },
    });
    const payload = event.payload as any;
    try {
        switch (event.kind) {
            case 'ROLE_REQUEST':
                await sendRoleRequestToAdmin(payload);
                break;
            case 'ROLE_APPROVED':
                await sendRoleApprovedEmail(payload);
                break;
            case 'ROLE_REJECTED':
                await sendRoleRejectedEmail(payload);
                break;
            case 'ADMIN_ACTION':
                await sendAdminActionEmail(payload);
                break;
            case 'CONTACT':
                await sendCheckedMail({
                    from: mailFrom(),
                    to: ADMIN_INBOX,
                    replyTo: payload.email,
                    subject: 'Harmonisys user inquiry',
                    text: payload.text + '\n\nFROM: ' + payload.email,
                    html:
                        '<p>' +
                        escapeEmailHtml(payload.text).replace(/\n/g, '<br>') +
                        '</p><p>FROM: ' +
                        escapeEmailHtml(payload.email) +
                        '</p>',
                });
                break;
            case 'CONTACT_RECEIPT': {
                const parent = await prisma.emailDelivery.findUnique({
                    where: { id: payload.contactDeliveryId },
                    select: { status: true, kind: true, payload: true },
                });
                if (parent?.kind !== 'CONTACT' || parent.status !== 'SENT' ||
                    (parent.payload as any)?.email !== payload.email)
                    throw new Error('The inquiry has not been delivered yet.');
                await sendCheckedMail({
                    from: mailFrom(), to: payload.email, replyTo: ADMIN_INBOX,
                    subject: 'Your Harmonisys inquiry receipt',
                    text: 'Your inquiry was sent to ' + ADMIN_INBOX +
                        '. Reply to this email to follow up.\n\nYour message:\n' + payload.text,
                    html: '<p>Your inquiry was sent to ' + ADMIN_INBOX +
                        '. Reply to this email to follow up.</p><p><strong>Your message:</strong></p><p>' +
                        escapeEmailHtml(payload.text).replace(/\n/g, '<br>') + '</p>',
                });
                break;
            }
            default:
                throw new Error('Unknown email delivery kind.');
        }
        await prisma.emailDelivery.update({
            where: { id },
            data: { status: 'SENT', sentAt: new Date(), leaseUntil: null },
        });
        return true;
    } catch {
        await prisma.emailDelivery.update({
            where: { id },
            data: {
                status: 'PENDING',
                leaseUntil: null,
                nextAttemptAt: new Date(
                    Date.now() +
                        Math.min(
                            3600000,
                            60000 * 2 ** Math.min(event.attempts - 1, 6)
                        )
                ),
            },
        });
        return false;
    }
}
export async function retryPendingEmails(limit = 10) {
    const events = await prisma.emailDelivery.findMany({
        where: {
            OR: [
                { status: 'PENDING', nextAttemptAt: { lte: new Date() } },
                { status: 'SENDING', leaseUntil: { lt: new Date() } },
            ],
        },
        orderBy: { createdAt: 'asc' },
        take: Math.min(limit, 20),
        select: { id: true },
    });
    let sent = 0;
    for (const event of events) if (await deliverEmail(event.id)) sent++;
    return {
        attempted: events.length,
        sent,
        pending: await prisma.emailDelivery.count({
            where: { status: { not: 'SENT' } },
        }),
    };
}
