import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserType } from '@prisma/client';
import { WorkflowError } from '@/lib/validation';
export async function requireUser(roles?: UserType[]) {
    const session = await auth();
    if (!session?.user?.id) throw new WorkflowError('Unauthorized', 401);
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            mhpssLevel: true,
        },
    });
    if (!user || !user.active) throw new WorkflowError('Unauthorized', 401);
    if (roles && !roles.includes(user.role))
        throw new WorkflowError('Forbidden', 403);
    return user;
}
