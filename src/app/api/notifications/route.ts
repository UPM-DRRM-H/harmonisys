// app/api/notifications/route.ts
import { NextResponse } from 'next/server';
// adjust to your auth import
import { prisma } from '@/lib/prisma'; // adjust to your prisma import
import { auth } from '@/lib/auth';

// ── GET /api/notifications ────────────────────────────────────────────────────
// Returns the current user's notifications (latest 50).
// Query params:
//   ?unreadOnly=true   → only unread
//   ?limit=20          → override default 50
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const requestedLimit = Number(searchParams.get('limit') ?? 50);
    const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(100, Math.floor(requestedLimit))) : 50;

    const notifications = await prisma.notification.findMany({
        where: {
            userId: session.user.id,
            ...(unreadOnly ? { read: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });

    const unreadCount = await prisma.notification.count({
        where: { userId: session.user.id, read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
}

// ── POST /api/notifications ───────────────────────────────────────────────────
// Internal helper — mark all notifications as read for the current user.
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
    });

    return NextResponse.json({ success: true });
}
