import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserType } from '@prisma/client';

export async function DELETE(
    _req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await props.params;

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (session.user.role !== UserType.ADMIN) {
            return NextResponse.json(
                { success: false, message: 'Forbidden' },
                { status: 403 }
            );
        }

        const userId = id;

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User id is required.' },
                { status: 400 }
            );
        }

        if (session.user.id === userId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'You cannot delete your own account.',
                },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!existingUser) {
            return NextResponse.json(
                { success: false, message: 'User not found.' },
                { status: 404 }
            );
        }

        await prisma.$transaction(async (tx) => {
            await tx.incident.deleteMany({
                where: { userId },
            });

            await tx.questionResponse.deleteMany({
                where: {
                    submission: { userId },
                },
            });

            await tx.submission.deleteMany({
                where: { userId },
            });

            await tx.roleChangeRequest.updateMany({
                where: { reviewedById: userId },
                data: { reviewedById: null },
            });

            await tx.roleChangeRequest.deleteMany({
                where: { userId },
            });

            await tx.account.deleteMany({
                where: { userId },
            });

            await tx.session.deleteMany({
                where: { userId },
            });

            await tx.authenticator.deleteMany({
                where: { userId },
            });

            await tx.unahonReassessmentRequest.deleteMany({
                where: {
                    OR: [{ userId }, { requestedById: userId }],
                },
            });

            await tx.unahon.deleteMany({
                where: { userId },
            });

            await tx.user.delete({
                where: { id: userId },
            });
        });

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully.',
        });
    } catch (error) {
        console.error('DELETE /api/admin/users/[id] error:', error);

        return NextResponse.json(
            { success: false, message: 'Failed to delete user.' },
            { status: 500 }
        );
    }
}
