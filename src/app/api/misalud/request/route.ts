import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/access';
import { createMiSaludRequest } from '@/lib/misaludRequests';
import { WorkflowError } from '@/lib/validation';
export async function POST(req: Request) {
    try {
        const user = await requireUser(['ADMIN', 'RESPONDER']);
        const result = await createMiSaludRequest(user.id, await req.json());
        return NextResponse.json(
            { success: true, request: result },
            { status: 201 }
        );
    } catch (e) {
        return NextResponse.json(
            {
                error:
                    e instanceof WorkflowError
                        ? e.message
                        : 'Failed to save request.',
            },
            { status: e instanceof WorkflowError ? e.status : 500 }
        );
    }
}
