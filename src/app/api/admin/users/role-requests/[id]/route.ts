import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/access';
import { reviewRoleRequest } from '@/lib/roleRequests';
import { deliverEmail } from '@/lib/mail/outbox';
import { WorkflowError } from '@/lib/validation';
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const reviewer = await requireUser(['ADMIN']);
        const { id } = await context.params;
        const { action, reason } = await req.json();
        if (
            !['APPROVE', 'REJECT'].includes(action) ||
            (reason !== undefined && typeof reason !== 'string')
        )
            throw new WorkflowError(
                'Choose APPROVE or REJECT with a valid reason.'
            );
        const result = await reviewRoleRequest(id, reviewer.id, action, reason);
        return NextResponse.json({
            success: true,
            emailSent: await deliverEmail(result.deliveryId),
        });
    } catch (e) {
        return NextResponse.json(
            {
                success: false,
                message:
                    e instanceof WorkflowError
                        ? e.message
                        : 'Failed to review request.',
            },
            { status: e instanceof WorkflowError ? e.status : 500 }
        );
    }
}
