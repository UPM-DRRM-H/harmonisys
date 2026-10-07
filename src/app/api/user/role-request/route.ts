import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/access';
import { prisma } from '@/lib/prisma';
import { submitRoleRequest, emailPendingRoleRequest } from '@/lib/roleRequests';
import { WorkflowError } from '@/lib/validation';
export async function GET() {
    try {
        const user = await requireUser();
        const request = await prisma.roleChangeRequest.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ success: true, data: request });
    } catch (e) {
        return NextResponse.json(
            {
                success: false,
                message:
                    e instanceof WorkflowError
                        ? e.message
                        : 'Failed to load request.',
            },
            { status: e instanceof WorkflowError ? e.status : 500 }
        );
    }
}
export async function POST(req: NextRequest) {
    try {
        const user = await requireUser();
        const body = await req.json();
        const request = await submitRoleRequest(user.id, body);
        return NextResponse.json(
            {
                success: true,
                data: request,
                emailSent: await emailPendingRoleRequest(request),
            },
            { status: 201 }
        );
    } catch (e) {
        return NextResponse.json(
            {
                success: false,
                message:
                    e instanceof WorkflowError
                        ? e.message
                        : 'Failed to save request.',
            },
            { status: e instanceof WorkflowError ? e.status : 500 }
        );
    }
}
