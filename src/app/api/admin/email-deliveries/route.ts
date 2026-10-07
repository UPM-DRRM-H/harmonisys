import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/access';
import { prisma } from '@/lib/prisma';
import { retryPendingEmails } from '@/lib/mail/outbox';
import { WorkflowError } from '@/lib/validation';
export async function GET() {
    try {
        await requireUser(['ADMIN']);
        return NextResponse.json({
            deliveries: await prisma.emailDelivery.findMany({
                orderBy: { createdAt: 'desc' },
                take: 100,
                select: {
                    id: true,
                    kind: true,
                    status: true,
                    attempts: true,
                    sentAt: true,
                    nextAttemptAt: true,
                },
            }),
        });
    } catch (e) {
        return NextResponse.json(
            { error: 'Access denied' },
            { status: e instanceof WorkflowError ? e.status : 500 }
        );
    }
}
export async function POST() {
    try {
        await requireUser(['ADMIN']);
        return NextResponse.json(await retryPendingEmails());
    } catch (e) {
        return NextResponse.json(
            { error: 'Access denied' },
            { status: e instanceof WorkflowError ? e.status : 500 }
        );
    }
}
