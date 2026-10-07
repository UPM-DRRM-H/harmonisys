'use server';
import { normalizeEmail, WorkflowError } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { enqueueEmail, deliverEmail } from '@/lib/mail/outbox';
import { randomUUID } from 'node:crypto';
export async function sendMail({
    email,
    text,
}: {
    email: string;
    text: string;
}) {
    email = normalizeEmail(email);
    if (typeof text !== 'string' || !text.trim() || text.length > 10000)
        throw new WorkflowError('Enter a message of 1–10,000 characters.');
    const delivery = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${email}))`;
        const recent = await tx.emailDelivery.count({
            where: {
                kind: 'CONTACT',
                createdAt: { gt: new Date(Date.now() - 3600000) },
                payload: { path: ['email'], equals: email },
            },
        });
        if (recent >= 5)
            throw new WorkflowError(
                'Too many inquiries. Please try again later.',
                429
            );
        const delivery = await enqueueEmail(
            tx,
            'contact:' + randomUUID(),
            'CONTACT',
            { email, text: text.trim() }
        );
        const admins = await tx.user.findMany({
            where: { role: 'ADMIN', active: true },
            select: { id: true },
        });
        if (admins.length)
            await tx.notification.createMany({
                data: admins.map(({ id }) => ({
                    userId: id,
                    type: 'GENERAL',
                    title: 'New contact inquiry',
                    message: 'An inquiry was received from ' + email + '.',
                    link: '/contact',
                    refId: delivery.id,
                    refType: 'EmailDelivery',
                })),
            });
        return delivery;
    });
    return { success: true, delivered: await deliverEmail(delivery.id) };
}
