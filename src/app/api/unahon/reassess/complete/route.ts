import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/access';
import { prisma } from '@/lib/prisma';
import { WorkflowError } from '@/lib/validation';
export async function PATCH() {
    try {
        const user = await requireUser(['ADMIN', 'RESPONDER']);
        const pending = await prisma.unahonReassessmentRequest.findFirst({
            where: { userId: user.id, status: 'PENDING' },
        });
        if (pending)
            return NextResponse.json(
                {
                    error: 'Save the matching reassessment first. Completion is recorded with the assessment.',
                },
                { status: 409 }
            );
        const completed = await prisma.unahonReassessmentRequest.findFirst({
            where: { userId: user.id, status: 'COMPLETED' },
            orderBy: { completedAt: 'desc' },
        });
        return NextResponse.json(
            { success: !!completed, request: completed },
            { status: completed ? 200 : 404 }
        );
    } catch (e) {
        return NextResponse.json(
            { error: 'Access denied' },
            { status: e instanceof WorkflowError ? e.status : 500 }
        );
    }
}
