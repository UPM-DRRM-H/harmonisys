// app/api/notifications/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, context: RouteContext) {
    const { id } = await context.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notification = await prisma.notification.findUnique({
        where: { id },
    });

    if (!notification || notification.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.notification.update({
        where: { id },
        data: { read: true },
    });

    return NextResponse.json({ notification: updated });
}

export async function DELETE(_req: Request, context: RouteContext) {
    const { id } = await context.params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notification = await prisma.notification.findUnique({
        where: { id },
    });

    if (!notification || notification.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.notification.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
