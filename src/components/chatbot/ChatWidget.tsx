'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button, Card, CardBody } from '@heroui/react';
import {
    AlertTriangle,
    ChevronLeft,
    MessageCircle,
    ShieldCheck,
    X,
} from 'lucide-react';
import {
    PREDEFINED_QUESTIONS,
    PredefinedQuestion,
    QuestionCategory,
} from '@/lib/ai/predefinedQuestions';

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
    general: 'General',
    irs: 'IRS',
    redas: 'REDAS',
    unahon: 'Unahon',
    misalud: 'Mi Salud',
    hazardhunter: 'HazardHunter',
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as QuestionCategory[];

const THEMES = {
    general: {
        headerGradient:
            'linear-gradient(135deg, #5B0A0A, #7A1111, #A11B1B)',
        userBubble: '#951515',
        accent: '#8B1538',
        alertBg: 'rgba(139, 21, 56, 0.10)',
        alertBorder: 'rgba(139, 21, 56, 0.20)',
    },
    irs: {
        headerGradient:
            'linear-gradient(135deg, #4A0A18, #6B0F25, #8B1538)',
        userBubble: '#6B0F25',
        accent: '#8A002A',
        alertBg: 'rgba(74, 10, 24, 0.08)',
        alertBorder: 'rgba(74, 10, 24, 0.18)',
    },
    unahon: {
        headerGradient:
            'linear-gradient(135deg, #7A0C1E, #991B1B, #B91C1C)',
        userBubble: '#991B1B',
        accent: '#B40000',
        alertBg: 'rgba(185, 28, 28, 0.08)',
        alertBorder: 'rgba(185, 28, 28, 0.18)',
    },
    misalud: {
        headerGradient:
            'linear-gradient(135deg, #065F46, #047857, #10B981)',
        userBubble: '#047857',
        accent: '#006745',
        alertBg: 'rgba(16, 185, 129, 0.10)',
        alertBorder: 'rgba(16, 185, 129, 0.22)',
    },
    hazardhunter: {
        headerGradient:
            'linear-gradient(135deg, #5A3A1A, #7B5A3A, #9D7C5A)',
        userBubble: '#7B5A3A',
        accent: '#62380F',
        alertBg: 'rgba(90, 58, 26, 0.08)',
        alertBorder: 'rgba(90, 58, 26, 0.18)',
    },
    redas: {
        headerGradient:
            'linear-gradient(135deg, #1E3A8A, #1D4ED8, #0284C7)',
        userBubble: '#1D4ED8',
        accent: '#0074AE',
        alertBg: 'rgba(2, 132, 199, 0.10)',
        alertBorder: 'rgba(2, 132, 199, 0.22)',
    },
};

function categoryFromPath(pathname: string): QuestionCategory {
    const path = pathname.toLowerCase();
    if (path.includes('/irs')) return 'irs';
    if (path.includes('/redas')) return 'redas';
    if (path.includes('/unahon')) return 'unahon';
    if (path.includes('/misalud')) return 'misalud';
    if (path.includes('/hazardhunter')) return 'hazardhunter';
    return 'general';
}

export default function ChatWidget() {
    const pathname = usePathname() || '/';
    const pageCategory = categoryFromPath(pathname);
    const [open, setOpen] = useState(false);
    const [category, setCategory] =
        useState<QuestionCategory>(pageCategory);
    const [selected, setSelected] = useState<PredefinedQuestion | null>(null);

    const theme = THEMES[pageCategory];

    const questions = PREDEFINED_QUESTIONS.filter(
        (item) => item.category === category
    );

    function chooseCategory(nextCategory: QuestionCategory) {
        setCategory(nextCategory);
        setSelected(null);
    }

    function handleOpen() {
        setCategory(pageCategory);
        setSelected(null);
        setOpen(true);
    }

    return (
        <>
            {!open && (
                <div className="fixed bottom-5 right-5 z-50">
                    <Button
                        onPress={handleOpen}
                        className="h-12 w-12 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.35),0_0_10px_rgba(255,255,255,0.45)] transition hover:shadow-[0_6px_18px_rgba(0,0,0,0.45),0_0_14px_rgba(255,255,255,0.6)]"
                        style={{
                            backgroundColor: theme.userBubble,
                            color: 'white',
                        }}
                        isIconOnly
                        aria-label="Open Harmonisys guide"
                    >
                        <MessageCircle className="h-6 w-6" />
                    </Button>
                </div>
            )}

            {open && (
                <div className="fixed bottom-5 right-5 z-50 w-full max-w-[390px] px-3 sm:px-0">
                    <Card className="overflow-hidden rounded-3xl border border-slate-200 shadow-xl">
                        <div
                            className="flex items-center justify-between px-4 py-3 text-white"
                            style={{ background: theme.headerGradient }}
                        >
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div className="leading-tight">
                                    <p className="text-sm font-extrabold">
                                        DRRM-H Quick Guide
                                    </p>
                                    <p className="text-[11px] text-white/80">
                                        Predefined questions and answers
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white shadow-sm transition hover:bg-black/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                aria-label="Close DRRM-H Quick Guide"
                                title="Close"
                            >
                                <X
                                    className="h-5 w-5"
                                    strokeWidth={3}
                                    aria-hidden="true"
                                />
                            </button>
                        </div>

                        <CardBody className="p-0">
                            <div
                                className="flex gap-2 border-b px-4 py-3"
                                style={{
                                    background: theme.alertBg,
                                    borderColor: theme.alertBorder,
                                }}
                            >
                                <AlertTriangle
                                    className="mt-0.5 h-5 w-5 shrink-0"
                                    style={{ color: theme.accent }}
                                />
                                <p
                                    className="text-xs leading-relaxed"
                                    style={{ color: theme.accent }}
                                >
                                    For life-threatening emergencies, contact
                                    local emergency services immediately.
                                </p>
                            </div>

                            <div className="h-[430px] overflow-y-auto bg-white px-4 py-4">
                                {selected ? (
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setSelected(null)}
                                            className="mb-4 flex items-center gap-1 text-xs font-semibold"
                                            style={{ color: theme.accent }}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Ask another question
                                        </button>
                                        <div
                                            className="mb-3 ml-auto max-w-[88%] rounded-2xl px-3 py-2 text-sm text-white shadow-sm"
                                            style={{
                                                backgroundColor:
                                                    theme.userBubble,
                                            }}
                                        >
                                            {selected.question}
                                        </div>
                                        <div
                                            className="max-w-[92%] rounded-2xl border bg-white px-3 py-3 text-sm leading-relaxed text-slate-800 shadow-sm"
                                            style={{
                                                borderColor:
                                                    theme.alertBorder,
                                            }}
                                        >
                                            {selected.answer}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="mb-3 text-sm font-semibold text-slate-800">
                                            Choose a topic
                                        </p>
                                        <div className="mb-5 flex flex-wrap gap-2">
                                            {CATEGORIES.map((item) => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() =>
                                                        chooseCategory(item)
                                                    }
                                                    className="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                                                    style={
                                                        category === item
                                                            ? {
                                                                  color: 'white',
                                                                  borderColor:
                                                                      theme.accent,
                                                                  backgroundColor:
                                                                      theme.accent,
                                                              }
                                                            : {
                                                                  color: theme.accent,
                                                                  borderColor:
                                                                      theme.alertBorder,
                                                                  backgroundColor:
                                                                      theme.alertBg,
                                                              }
                                                    }
                                                >
                                                    {CATEGORY_LABELS[item]}
                                                </button>
                                            ))}
                                        </div>

                                        <p className="mb-3 text-sm font-semibold text-slate-800">
                                            Select a question
                                        </p>
                                        <div className="space-y-2">
                                            {questions.map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelected(item)
                                                    }
                                                    className="w-full rounded-xl border px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:shadow-sm"
                                                    style={{
                                                        borderColor:
                                                            theme.alertBorder,
                                                        backgroundColor:
                                                            theme.alertBg,
                                                    }}
                                                >
                                                    {item.question}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-[11px] text-slate-500">
                                No AI service or usage fee is required.
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </>
    );
}
