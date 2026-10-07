import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/access';
import { prisma } from '@/lib/prisma';
import { WorkflowError } from '@/lib/validation';
export async function POST(req: Request) {
    try {
        const admin = await requireUser(['ADMIN']);
        const { userId, client, affiliation } = await req.json();
        if (
            typeof userId !== 'string' ||
            typeof client !== 'string' ||
            !client.trim()
        )
            throw new WorkflowError('Choose a responder and existing patient.');
        const request = await prisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'reassess:' + userId}))`;
            const user = await tx.user.findFirst({
                where: {
                    id: userId,
                    active: true,
                    role: { in: ['ADMIN', 'RESPONDER'] },
                    mhpssLevel: { not: null },
                },
            });
            if (!user)
                throw new WorkflowError(
                    'Choose an active responder with MHPSS competency.'
                );
            if (!(await tx.unahon.findFirst({ where: { client } })))
                throw new WorkflowError('Patient has no initial assessment.');
            const pending = await tx.unahonReassessmentRequest.findFirst({
                where: { userId, status: 'PENDING' },
            });
            if (pending)
                throw new WorkflowError(
                    'Responder already has a pending reassessment.',
                    409
                );
            const request = await tx.unahonReassessmentRequest.create({
                data: {
                    userId,
                    client,
                    affiliation:
                        typeof affiliation === 'string' ? affiliation : null,
                    requestedById: admin.id,
                },
            });
            await tx.notification.create({
                data: {
                    userId,
                    type: 'GENERAL',
                    title: 'Reassessment requested',
                    message:
                        'An admin assigned a reassessment for ' + client + '.',
                    link: '/unahon',
                    refId: request.id,
                    refType: 'UnahonReassessmentRequest',
                },
            });
            return request;
        });
        return NextResponse.json({ success: true, request });
    } catch (e) {
        return NextResponse.json(
            {
                error:
                    e instanceof WorkflowError ? e.message : 'Request failed.',
            },
            { status: e instanceof WorkflowError ? e.status : 500 }
        );
    }
}
