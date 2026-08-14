import { NextResponse } from 'next/server';
import { matchPredefinedQuestion } from '@/lib/ai/matchPredefinedQuestion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 12_000;
const FALLBACK_MESSAGE =
    'The AI assistant is temporarily unavailable. Please try again later or choose one of the suggested questions.';

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

type RequestBody = {
    message?: string;
    pathname?: string;
    history?: ChatMessage[];
};

function pageContext(pathname: string) {
    const path = pathname.toLowerCase();
    const modules = ['irs', 'redas', 'unahon', 'misalud', 'hazardhunter'];
    const moduleName = modules.find((module) => path.includes(`/${module}`));
    return moduleName ? `The user is viewing the ${moduleName} area.` : '';
}

function safeHistory(history: unknown): ChatMessage[] {
    if (!Array.isArray(history)) return [];

    return history
        .filter(
            (item): item is ChatMessage =>
                item !== null &&
                typeof item === 'object' &&
                (item.role === 'user' || item.role === 'assistant') &&
                typeof item.content === 'string'
        )
        .slice(-6)
        .map((item) => ({
            role: item.role,
            content: item.content.trim().slice(0, 1_000),
        }))
        .filter((item) => item.content.length > 0);
}

export async function POST(request: Request) {
    let body: RequestBody;

    try {
        body = (await request.json()) as RequestBody;
    } catch {
        return NextResponse.json(
            { reply: 'Please enter a valid question.' },
            { status: 400 }
        );
    }

    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) {
        return NextResponse.json(
            { reply: 'Please enter a question first.' },
            { status: 400 }
        );
    }

    const predefined = matchPredefinedQuestion(message);
    if (predefined) {
        return NextResponse.json({
            reply: predefined.answer,
            source: 'predefined',
            matchedQuestionId: predefined.id,
        });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { reply: FALLBACK_MESSAGE, source: 'fallback' },
            { status: 503 }
        );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const context = pageContext(
            typeof body.pathname === 'string' ? body.pathname : '/'
        );
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer':
                    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                'X-Title': 'Harmonisys DRRM-H Assistant',
            },
            body: JSON.stringify({
                model: 'openrouter/free',
                temperature: 0.2,
                max_tokens: 350,
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are the Harmonisys DRRM-H assistant. Give concise, helpful, professional answers relevant to Harmonisys, disaster preparedness, IRS, REDAS, Unahon, Mi Salud, or HazardHunter. Never claim to have completed actions, accessed records, contacted people, or changed the application. Do not request or reveal secrets. For emergencies, direct the user to local emergency services. If a question is outside this scope, briefly say what topics you can help with.',
                    },
                    ...(context
                        ? [{ role: 'system' as const, content: context }]
                        : []),
                    ...safeHistory(body.history),
                    { role: 'user', content: message.slice(0, 2_000) },
                ],
            }),
        });

        if (!response.ok) {
            console.error(
                'OpenRouter request failed with status',
                response.status
            );
            return NextResponse.json(
                { reply: FALLBACK_MESSAGE, source: 'fallback' },
                { status: response.status === 429 ? 429 : 502 }
            );
        }

        const data = await response.json().catch(() => null);
        const reply = data?.choices?.[0]?.message?.content;

        if (typeof reply !== 'string' || !reply.trim()) {
            return NextResponse.json(
                { reply: FALLBACK_MESSAGE, source: 'fallback' },
                { status: 502 }
            );
        }

        return NextResponse.json({ reply: reply.trim(), source: 'ai' });
    } catch (error) {
        console.error(
            'OpenRouter request failed:',
            error instanceof Error ? error.message : 'Unknown error'
        );
        return NextResponse.json(
            { reply: FALLBACK_MESSAGE, source: 'fallback' },
            { status: 503 }
        );
    } finally {
        clearTimeout(timeout);
    }
}
