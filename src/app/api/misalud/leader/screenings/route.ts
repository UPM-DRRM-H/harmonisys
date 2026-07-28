import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Verify the caller is an approved team leader and return their team
async function getLeaderTeam(userId: string) {
    return prisma.miSaludMembership.findFirst({
        where: { userId, role: 'TEAM_LEADER', status: 'APPROVED' },
        include: { team: true },
        orderBy: { updatedAt: 'desc' },
    });
}

// GET /api/misalud/leader/screenings
// Returns screening schedules for the leader's team, descending by createdAt
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const membership = await getLeaderTeam(session.user.id);
        if (!membership) {
            return NextResponse.json({ error: 'No approved Team Leader membership found' }, { status: 403 });
        }

        const schedules = await prisma.miSaludScreeningSchedule.findMany({
            where: { teamId: membership.teamId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ schedules });
    } catch (error) {
        console.error('GET /api/misalud/leader/screenings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/misalud/leader/screenings
// Creates a new screening schedule for the leader's team
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const membership = await getLeaderTeam(session.user.id);
        if (!membership) {
            return NextResponse.json({ error: 'No approved Team Leader membership found' }, { status: 403 });
        }

        const body = await req.json();
        const { screeningType, validDate, dueDate } = body;

        if (!screeningType || !validDate || !dueDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const validTypes = ['PRE_DEPLOYMENT', 'DURING_DEPLOYMENT', 'POST_DEPLOYMENT'];
        if (!validTypes.includes(screeningType)) {
            return NextResponse.json({ error: 'Invalid screening type' }, { status: 400 });
        }

        const parsedValid = new Date(validDate);
        const parsedDue = new Date(dueDate);

        if (isNaN(parsedValid.getTime()) || isNaN(parsedDue.getTime())) {
            return NextResponse.json({ error: 'Invalid date values' }, { status: 400 });
        }

        if (parsedDue <= parsedValid) {
            return NextResponse.json({ error: 'Due date must be after valid date' }, { status: 400 });
        }

        const schedule = await prisma.miSaludScreeningSchedule.create({
            data: {
                teamId: membership.teamId,
                createdById: session.user.id,
                screeningType,
                validDate: parsedValid,
                dueDate: parsedDue,
                status: 'ACTIVE',
            },
        });

        return NextResponse.json({ schedule }, { status: 201 });
    } catch (error) {
        console.error('POST /api/misalud/leader/screenings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
