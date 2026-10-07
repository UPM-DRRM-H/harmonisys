'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/access';
import { WorkflowError } from '@/lib/validation';
import { signIn, signOut } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { MhpssLevel, UserType } from '@prisma/client';

export const handleGoogleLogin = async () => {
    await signIn('google', { redirectTo: '/' });
    revalidatePath('/');
};

export const handleCredentialsLogin = async (
    email: string,
    password: string
) => {
    try {
        await signIn('credentials', {
            email,
            password,
            redirect: false,
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return {
                        success: false,
                        message: 'Invalid email or password.',
                    };
                default:
                    return {
                        success: false,
                        message: 'Something went wrong during login.',
                    };
            }
        }

        return {
            success: false,
            message: 'Something went wrong during login.',
        };
    }
};

export const handleSignOut = async () => {
    await signOut({ redirectTo: '/' });
};

export const getAllUsers = async (page = 1, limit = 10) => {
    try {
        await requireUser(['ADMIN']);
        page = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
        limit = Number.isFinite(limit)
            ? Math.min(100, Math.max(1, Math.floor(limit)))
            : 10;
        const skip = (page - 1) * limit;

        const users = await prisma.user.findMany({
            where: { active: true },
            skip,
            take: limit,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                mhpssLevel: true,
                responderOrganization: true,
                mhpssCertificateFileUrl: true,
                gender: true,
                region: true,
                createdAt: true,

                roleChangeRequests: {
                    where: { status: 'PENDING' },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        fromRole: true,
                        toRole: true,
                        requestedMhpssLevel: true,
                        requestedResponderOrganization: true,
                        requestedMhpssCertificateFileUrl: true,
                        status: true,
                        createdAt: true,
                    },
                },

                updatedAt: false,
                image: false,
                password: false,
            },
            orderBy: {
                name: 'asc',
            },
        });

        const results = users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            mhpssLevel: u.mhpssLevel,
            responderOrganization: u.responderOrganization,
            mhpssCertificateFileUrl: u.mhpssCertificateFileUrl,
            gender: u.gender,
            region: u.region,
            createdAt: u.createdAt,
            pendingRoleRequest: u.roleChangeRequests?.[0] ?? null,
        }));

        const totalUsers = await prisma.user.count({ where: { active: true } });

        return {
            count: totalUsers,
            results,
        };
    } catch (err) {
        console.error('Error fetching users:', err);
        return { error: 'Failed to fetch users' };
    }
};

export async function updateUserRole(userId: string, role: UserType) {
    try {
        await requireUser(['ADMIN']);
        if (!Object.values(UserType).includes(role))
            throw new WorkflowError('Invalid role.');
        const admin = await requireUser(['ADMIN']);
        await prisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('admin-role-changes'))`;
            const target = await tx.user.findUniqueOrThrow({
                where: { id: userId },
            });
            if (
                target.role === 'ADMIN' &&
                role !== 'ADMIN' &&
                (admin.id === userId ||
                    (await tx.user.count({
                        where: { role: 'ADMIN', active: true },
                    })) <= 1)
            )
                throw new WorkflowError(
                    'Cannot demote yourself or the last admin.'
                );
            if (role === 'STANDARD') {
                if (await tx.miSaludTeam.count({ where: { leaderUserId:userId,status:'APPROVED',memberships:{some:{userId:{not:userId},status:'APPROVED'}} } })) throw new WorkflowError('Transfer team leadership before removing Responder access.');
                await tx.miSaludMembership.updateMany({where:{userId},data:{status:'REJECTED'}});
            }
            await tx.user.update({ where: { id: userId }, data: { role } });
            await tx.roleChangeRequest.updateMany({
                where: { userId, status: 'PENDING' },
                data: {
                    status: 'CANCELLED',
                    reviewedAt: new Date(),
                    reviewedById: admin.id,
                },
            });
            await tx.notification.create({
                data: {
                    userId,
                    type: 'GENERAL',
                    title: 'Account role updated',
                    message:
                        'An admin changed your account role to ' + role + '.',
                    link: '/dashboard',
                },
            });
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating user role:', error);
        return { success: false, error: 'Failed to update user role' };
    }
}

export async function updateUserMhpssLevel(
    userId: string,
    mhpssLevel: MhpssLevel | null
) {
    try {
        await requireUser(['ADMIN']);
        await prisma.user.update({
            where: { id: userId },
            data: { mhpssLevel },
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating user MHPSS level:', error);
        return { success: false, error: 'Failed to update user MHPSS level' };
    }
}

export async function updateUserResponderOrganization(
    userId: string,
    responderOrganization: string | null
) {
    try {
        await requireUser(['ADMIN']);
        await prisma.user.update({
            where: { id: userId },
            data: { responderOrganization },
        });
        revalidatePath('/users');

        return { success: true };
    } catch (error) {
        console.error('Error updating user responder organization:', error);
        return {
            success: false,
            error: 'Failed to update user responder organization',
        };
    }
}

export async function updateUserRegion(userId: string, region: string | null) {
    try {
        await requireUser(['ADMIN']);
        await prisma.user.update({
            where: { id: userId },
            data: { region },
        });
        revalidatePath('/users');

        return { success: true };
    } catch (error) {
        console.error('Error updating user region:', error);
        return {
            success: false,
            error: 'Failed to update user region',
        };
    }
}
