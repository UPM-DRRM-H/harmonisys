export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RequestStatus, UserType } from '@prisma/client';

// Retain the legacy URL while sharing validation and notifications.
export { POST } from '@/app/api/user/role-request/route';

export async function GET() {
    try {
        const session = await auth();

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

        const requests = await prisma.roleChangeRequest.findMany({
            where: { status: RequestStatus.PENDING },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                userId: true,
                fromRole: true,
                toRole: true,
                requestedMhpssLevel: true,
                requestedResponderOrganization: true,
                requestedMhpssCertificateFileUrl: true,
                status: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        competency: true,
                        mhpssLevel: true,
                        createdAt: true,
                    },
                },
            },
        });

        return NextResponse.json({ success: true, data: requests });
    } catch (err: any) {
        console.error('GET /api/admin/users/role-requests error:', err);
        return NextResponse.json(
            {
                success: false,
                message: err?.message || 'Internal Server Error',
            },
            { status: 500 }
        );
    }
}
