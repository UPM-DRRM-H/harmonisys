'use server';
import { requireUser } from '@/lib/access';
import { prisma } from '@/lib/prisma';
import { enqueueEmail, deliverEmail } from '@/lib/mail/outbox';
import type { AdminActionEmailPayload } from '@/lib/mail/sendActionEmail';
import { randomUUID } from 'node:crypto';
export async function notifyAdminAction(
    payload: AdminActionEmailPayload
): Promise<void> {
    await requireUser(['ADMIN']);
    const delivery = await prisma.$transaction((tx) =>
        enqueueEmail(
            tx,
            'admin-action:' + randomUUID(),
            'ADMIN_ACTION',
            payload
        )
    );
    await deliverEmail(delivery.id);
}
