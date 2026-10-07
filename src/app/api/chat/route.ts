import { NextResponse } from 'next/server';
import { guideReply } from '@/lib/ai/guideReply';
import {
    PREDEFINED_QUESTIONS,
    QuestionCategory,
} from '@/lib/ai/predefinedQuestions';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
    try {
        const body = await request.json();
        if (
            !body ||
            typeof body !== 'object' ||
            typeof body.message !== 'string' ||
            !body.message.trim() ||
            body.message.length > 2000
        )
            return NextResponse.json(
                { reply: 'Enter a question of 1–2,000 characters.' },
                { status: 400 }
            );
        const categories = [
            'general',
            'irs',
            'redas',
            'unahon',
            'misalud',
            'hazardhunter',
        ];
        const category = categories.includes(body.category)
            ? body.category
            : 'general';
        const selected =
            typeof body.questionId === 'string'
                ? PREDEFINED_QUESTIONS.find((q) => q.id === body.questionId)
                : null;
        return NextResponse.json(
            guideReply(
                selected?.question || body.message,
                category as QuestionCategory
            ),
            { headers: { 'Cache-Control': 'no-store' } }
        );
    } catch {
        return NextResponse.json(
            { reply: 'Please enter a valid question.' },
            { status: 400 }
        );
    }
}
