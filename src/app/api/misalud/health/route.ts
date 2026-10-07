import { withAccess } from '@/lib/apiAccess';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { requireUser } from '@/lib/access';
import { QUESTIONS } from '@/constants';
import type { SubmissionData } from '@/types';

async function handlePOST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body: SubmissionData = await request.json();
        const { formData, responses } = body;
        if (
            !formData ||
            !responses ||
            typeof responses !== 'object' ||
            Object.keys(responses).length !== QUESTIONS.length ||
            QUESTIONS.some((q) => !q.options.includes(responses[q.id])) ||
            Number.isNaN(new Date(formData.date).getTime())
        ) {
            return NextResponse.json(
                { error: 'Provide valid answers to every screening question.' },
                { status: 400 }
            );
        }

        // Validate required fields
        if (!formData.name || !formData.date) {
            return NextResponse.json(
                { error: 'Missing required fields: name or date' },
                { status: 400 }
            );
        }

        // Validate that all questions are answered
        const answeredQuestions = Object.keys(responses).map(Number);
        const requiredQuestions = QUESTIONS.map((q) => q.id);
        const missingQuestions = requiredQuestions.filter(
            (id) => !answeredQuestions.includes(id)
        );

        if (missingQuestions.length > 0) {
            return NextResponse.json(
                {
                    error: `Missing responses for questions: ${missingQuestions.join(', ')}`,
                },
                { status: 400 }
            );
        }

        const approvedMembership = await prisma.miSaludMembership.findFirst({
            where: {
                userId: session.user.id,
                status: 'APPROVED',
                team: { status: 'APPROVED' },
            },
            include: {
                team: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        if (!approvedMembership) {
            return NextResponse.json(
                {
                    error: 'You do not have an approved Mi Salud membership yet',
                },
                { status: 403 }
            );
        }

        // Create submission with responses
        if (
            body.mode !== undefined &&
            !['general', 'scheduled'].includes(body.mode)
        )
            return NextResponse.json(
                { error: 'Choose a general or scheduled assessment.' },
                { status: 400 }
            );
        const general = body.mode === 'general' && !body.scheduleId;
        let selected: { id: string } | null = null;
        if (!general) {
            const schedules = await prisma.miSaludScreeningSchedule.findMany({
                where: {
                    teamId: approvedMembership.teamId,
                    status: 'ACTIVE',
                    validDate: { lte: new Date() },
                    dueDate: { gte: new Date() },
                },
            });
            selected = body.scheduleId
                ? schedules.find((s) => s.id === body.scheduleId) || null
                : schedules.length === 1
                  ? schedules[0]
                  : null;
            if (!selected)
                return NextResponse.json(
                    {
                        error: 'Choose an active screening from your assigned screenings.',
                    },
                    { status: 400 }
                );
            if (
                await prisma.submission.findFirst({
                    where: { userId: session.user.id, scheduleId: selected.id },
                })
            )
                return NextResponse.json(
                    { error: 'You already submitted this screening.' },
                    { status: 409 }
                );
        }
        const submission = await prisma.submission.create({
            data: {
                userId: session.user.id,
                name: formData.name,
                date: new Date(formData.date),
                team: approvedMembership.team.name,
                teamId: approvedMembership.teamId,
                scheduleId: selected?.id || null,
                responses: {
                    create: Object.entries(responses).map(
                        ([questionId, selectedOption]) => {
                            const question = QUESTIONS.find(
                                (q) => q.id === Number.parseInt(questionId)
                            );
                            return {
                                questionId: Number.parseInt(questionId),
                                questionText: question?.text || '',
                                selectedOption,
                            };
                        }
                    ),
                },
            },
            include: {
                responses: true,
            },
        });

        return NextResponse.json({
            success: true,
            submissionId: submission.id,
            message: 'Questionnaire submitted successfully',
        });
    } catch (error) {
        if ((error as { code?: string }).code === 'P2002')
            return NextResponse.json(
                { error: 'You already submitted this screening.' },
                { status: 409 }
            );
        console.error('Error submitting questionnaire:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function handleGET() {
    try {
        const user = await requireUser(['ADMIN', 'RESPONDER']);
        const ledTeams =
            user.role === 'ADMIN'
                ? []
                : await prisma.miSaludMembership.findMany({
                      where: {
                          userId: user.id,
                          role: 'TEAM_LEADER',
                          status: 'APPROVED',
                          team: { status: 'APPROVED' },
                      },
                      select: { teamId: true },
                  });
        const submissions = await prisma.submission.findMany({
            where:
                user.role === 'ADMIN'
                    ? {}
                    : {
                          OR: [
                              { userId: user.id },
                              { teamId: { in: ledTeams.map((m) => m.teamId) } },
                          ],
                      },
            include: {
                responses: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ submissions });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export const POST = withAccess(handlePOST, ['ADMIN', 'RESPONDER']);

export const GET = withAccess(handleGET, ['ADMIN', 'RESPONDER']);
