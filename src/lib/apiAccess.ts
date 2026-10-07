import { NextResponse } from 'next/server';
import { UserType } from '@prisma/client';
import { requireUser } from '@/lib/access';
import { WorkflowError } from '@/lib/validation';
export function withAccess<T extends (...args: any[]) => Promise<Response>>(
    handler: T,
    roles?: UserType[]
) {
    return async (...args: Parameters<T>): Promise<Response> => {
        try {
            await requireUser(roles);
            return await handler(...args);
        } catch (e) {
            return NextResponse.json(
                {
                    error:
                        e instanceof WorkflowError
                            ? e.message
                            : 'Request failed.',
                },
                { status: e instanceof WorkflowError ? e.status : 500 }
            );
        }
    };
}
