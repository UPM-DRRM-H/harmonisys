import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/access';
import { reviewMiSaludRequest } from '@/lib/misaludRequests';
import { WorkflowError } from '@/lib/validation';
export async function PATCH(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireUser(['ADMIN', 'RESPONDER']);
        const body = await req.json();
        const action =
            body.action ||
            (body.status === 'APPROVED'
                ? 'APPROVE'
                : body.status === 'REJECTED'
                  ? 'REJECT'
                  : null);
        if (
            !['APPROVE', 'REJECT'].includes(action) ||
            (body.rejectionReason !== undefined &&
                typeof body.rejectionReason !== 'string')
        )
            throw new WorkflowError('Choose APPROVE or REJECT.');
        return NextResponse.json(
            await reviewMiSaludRequest(
                (await context.params).id,
                user.id,
                action,
                body.rejectionReason
            )
        );
    } catch (e) {
        return NextResponse.json(
            {
                error:
                    e instanceof WorkflowError ? e.message : 'Review failed.',
            },
            { status: e instanceof WorkflowError ? e.status : 500 }
        );
    }
}
