import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/registration';
import { emailPendingRoleRequest } from '@/lib/roleRequests';
import { WorkflowError } from '@/lib/validation';
export async function POST(req: Request) {
    try {
        const result = await registerUser(await req.formData());
        return NextResponse.json(
            {
                success: true,
                user: result.user,
                emailSent: result.request
                    ? await emailPendingRoleRequest(result.request)
                    : null,
                message: result.request
                    ? 'Registration successful. Your requested role is pending admin approval.'
                    : 'Registration successful.',
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
                        : 'Registration could not be completed. Please try again.',
            },
            { status: e instanceof WorkflowError ? e.status : 500 }
        );
    }
}
