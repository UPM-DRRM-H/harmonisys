import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        const approvedMembership = await prisma.miSaludMembership.findFirst({
            where: {
                userId,
                status: 'APPROVED',
            },
            include: {
                team: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        if (approvedMembership) {
            return NextResponse.json({
                status: 'APPROVED',
                accountName: session.user.name ?? null,
                membership: {
                    id: approvedMembership.id,
                    role: approvedMembership.role,
                    teamId: approvedMembership.teamId,
                    teamName: approvedMembership.team.name,
                    approvedAt: approvedMembership.approvedAt,
                },
            });
        }

        const latestRequest = await prisma.miSaludRequest.findFirst({
            where: {
                userId,
                NOT: { status: 'APPROVED' },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!latestRequest) {
            return NextResponse.json({
                status: 'NONE',
                accountName: session.user.name ?? null,
                membership: null,
            });
        }

        return NextResponse.json({
            status: latestRequest.status,
            accountName: session.user.name ?? null,
            membership: {
                id: latestRequest.id,
                fullName: latestRequest.fullName,
                age: latestRequest.age,
                address: latestRequest.address,
                requestedRole: latestRequest.requestedRole,
                teamId: latestRequest.teamId,
                teamName: latestRequest.teamName,
                reviewLevel: latestRequest.reviewLevel,
                rejectionReason: latestRequest.rejectionReason,
                createdAt: latestRequest.createdAt,
                reviewedAt: latestRequest.reviewedAt,
            },
        });
    } catch (error) {
        console.error('Error fetching MiSalud membership:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
