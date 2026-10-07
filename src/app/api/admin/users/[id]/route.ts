import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/access';
import { prisma } from '@/lib/prisma';
import { WorkflowError } from '@/lib/validation';
export async function DELETE(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireUser(['ADMIN']);
        const { id } = await context.params;
        if (id === admin.id)
            throw new WorkflowError('You cannot deactivate your own account.');
        await prisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('admin-role-changes'))`;
            const user = await tx.user.findUnique({ where: { id } });
            if (!user) throw new WorkflowError('User not found.', 404);
            if (
                user.role === 'ADMIN' &&
                (await tx.user.count({
                    where: { role: 'ADMIN', active: true },
                })) <= 1
            )
                throw new WorkflowError(
                    'Cannot deactivate the last admin.',
                    409
                );
            const ledTeams = await tx.miSaludTeam.count({
                where: {
                    leaderUserId: id,
                    status: 'APPROVED',
                    memberships: {
                        some: { userId: { not: id }, status: 'APPROVED' },
                    },
                },
            });
            if (ledTeams)
                throw new WorkflowError(
                    'Transfer team leadership before deactivating this account.',
                    409
                );
            await tx.user.update({ where: { id }, data: { active: false } });
            await tx.session.deleteMany({ where: { userId: id } });
            await tx.miSaludMembership.updateMany({
                where: { userId: id },
                data: { status: 'REJECTED' },
            });
            await tx.roleChangeRequest.updateMany({
                where: { userId: id, status: 'PENDING' },
                data: {
                    status: 'CANCELLED',
                    reviewedAt: new Date(),
                    reviewedById: admin.id,
                },
            });
        });
        return NextResponse.json({
            success: true,
            message: 'Account deactivated. Records and history were preserved.',
        });
    } catch (e) {
        return NextResponse.json(
            {
                success: false,
                message:
                    e instanceof WorkflowError
                        ? e.message
                        : 'Failed to deactivate account.',
            },
            { status: e instanceof WorkflowError ? e.status : 500 }
        );
    }
}
