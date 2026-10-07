'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    MessageCircle,
    X,
    Send,
    Loader2,
    ArrowLeft,
    BookOpen,
    AlertTriangle,
} from 'lucide-react';
import {
    PREDEFINED_QUESTIONS,
    PredefinedQuestion,
    QuestionCategory,
} from '@/lib/ai/predefinedQuestions';
import { guideReply } from '@/lib/ai/guideReply';
const LABELS: Record<QuestionCategory, string> = {
    general: 'Account & help',
    irs: 'IRS',
    redas: 'REDAS',
    unahon: 'Unahon',
    misalud: 'Mi Salud',
    hazardhunter: 'HazardHunter',
};
type Reply = ReturnType<typeof guideReply>;
type Message = { role: 'user' | 'assistant'; content: string; reply?: Reply };
export default function ChatWidget() {
    const pathname = usePathname() || '/';
    const pageCategory = (Object.keys(LABELS).find(
        (c) => c !== 'general' && pathname.toLowerCase().includes(c)
    ) || 'general') as QuestionCategory;
    const [open, setOpen] = useState(false),
        [category, setCategory] = useState<QuestionCategory>(pageCategory),
        [messages, setMessages] = useState<Message[]>([]),
        [input, setInput] = useState(''),
        [loading, setLoading] = useState(false);
    const field = useRef<HTMLInputElement>(null),
        launcher = useRef<HTMLButtonElement>(null),
        end = useRef<HTMLDivElement>(null),
        panel = useRef<HTMLElement>(null),
        abort = useRef<AbortController | null>(null),
        generation = useRef(0);
    const previousOpen = useRef(false);
    const questions = PREDEFINED_QUESTIONS.filter(
        (q) => q.category === category
    );
    useEffect(() => {
        if (open) field.current?.focus();
        else if (previousOpen.current) launcher.current?.focus();
        previousOpen.current = open;
    }, [open]);
    useEffect(() => {
        end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages, loading]);
    useEffect(() => {
        if (open && !loading) field.current?.focus();
    }, [open, loading]);
    useEffect(() => () => abort.current?.abort(), []);
    useEffect(() => {
        const clear = () => {
            abort.current?.abort();
            generation.current++;
            setMessages([]);
            setInput('');
            setLoading(false);
        };
        window.addEventListener('harmonisys:session-change', clear);
        return () =>
            window.removeEventListener('harmonisys:session-change', clear);
    }, []);
    function close() {
        setOpen(false);
        launcher.current?.focus();
    }
    function reset() {
        abort.current?.abort();
        generation.current++;
        setLoading(false);
        setMessages([]);
        setInput('');
        field.current?.focus();
    }
    async function ask(value: string, question?: PredefinedQuestion) {
        const message = value.trim();
        if (!message || loading) return;
        setMessages((old) => [...old, { role: 'user', content: message }]);
        setInput('');
        setLoading(true);
        const token = ++generation.current;
        abort.current?.abort();
        const controller = new AbortController();
        abort.current = controller;
        const timeout = setTimeout(() => controller.abort(), 10000);
        let reply: Reply;
        try {
            if (question || !navigator.onLine)
                reply = guideReply(question?.question || message, category);
            else {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, category }),
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error('Guide request failed');
                reply = await response.json();
                if (typeof reply.reply !== 'string')
                    throw new Error('Invalid guide response');
            }
        } catch {
            reply = guideReply(message, category);
        } finally {
            clearTimeout(timeout);
        }
        if (token === generation.current) {
            setMessages((old) => [
                ...old,
                { role: 'assistant', content: reply!.reply, reply },
            ]);
            setLoading(false);
            field.current?.focus();
        }
    }
    function submit(e: FormEvent) {
        e.preventDefault();
        void ask(input);
    }
    function keydown(e: React.KeyboardEvent<HTMLElement>) {
        if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
        if (e.key === 'Tab') {
            const nodes = panel.current?.querySelectorAll<HTMLElement>(
                'button:not(:disabled),input,a[href]'
            );
            if (!nodes?.length) return;
            const first = nodes[0],
                last = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }
    return (
        <>
            {!open && (
                <button
                    ref={launcher}
                    onClick={() => {
                        setOpen(true);
                        setCategory(pageCategory);
                    }}
                    className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#77152d] text-white shadow-lg hover:bg-[#591021] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#77152d]"
                    aria-label="Open Harmonisys guide"
                >
                    <MessageCircle aria-hidden className="h-6 w-6" />
                </button>
            )}
            {open && (
                <section
                    ref={panel}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="chat-heading"
                    onKeyDown={keydown}
                    className="fixed bottom-[max(.75rem,env(safe-area-inset-bottom))] right-3 z-[70] flex max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[420px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
                >
                    <header className="flex shrink-0 items-center justify-between bg-[#77152d] px-5 py-4 text-white">
                        <div>
                            <h2 id="chat-heading" className="font-bold">
                                DRRM-H App Guide
                            </h2>
                            <p className="text-xs text-white/80">
                                Manual-based help, available offline
                            </p>
                        </div>
                        <button
                            onClick={close}
                            aria-label="Close Harmonisys guide"
                            className="rounded-full p-2 hover:bg-white/15 focus-visible:ring-2"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </header>
                    <p className="flex shrink-0 gap-2 border-b border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        For guidance only. For immediate danger, contact
                        emergency services. Do not share patient details,
                        passwords or codes.
                    </p>
                    <div
                        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
                        style={{ height: 'min(410px,50dvh)' }}
                    >
                        {messages.length === 0 ? (
                            <>
                                <p className="mb-3 text-sm text-slate-600">
                                    Hello! Choose a topic or ask how to use a
                                    feature.
                                </p>
                                <div
                                    className="mb-5 flex flex-wrap gap-2"
                                    aria-label="Help topics"
                                >
                                    {(
                                        Object.keys(
                                            LABELS
                                        ) as QuestionCategory[]
                                    ).map((c) => (
                                        <button
                                            key={c}
                                            aria-pressed={category === c}
                                            onClick={() => setCategory(c)}
                                            className={
                                                'rounded-full border px-3 py-2 text-xs font-semibold ' +
                                                (category === c
                                                    ? 'border-[#77152d] bg-[#77152d] text-white'
                                                    : 'border-slate-200 text-slate-700 hover:bg-rose-50')
                                            }
                                        >
                                            {LABELS[c]}
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    {questions.map((q) => (
                                        <button
                                            key={q.id}
                                            onClick={() =>
                                                void ask(q.question, q)
                                            }
                                            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-left text-sm text-slate-800 hover:border-[#77152d] hover:bg-rose-50"
                                        >
                                            {q.question}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={reset}
                                    className="mb-4 flex items-center gap-1 text-xs font-semibold text-[#77152d]"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Browse questions / clear chat
                                </button>
                                <div
                                    role="log"
                                    aria-live="polite"
                                    aria-relevant="additions"
                                    className="space-y-4"
                                >
                                    {messages.map((m, i) => (
                                        <div
                                            key={i}
                                            className={
                                                m.role === 'user'
                                                    ? 'ml-auto max-w-[90%] rounded-2xl bg-[#77152d] p-3 text-sm text-white'
                                                    : 'max-w-[96%] rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800'
                                            }
                                        >
                                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                                                {m.content}
                                            </p>
                                            {m.reply && (
                                                <>
                                                    <p className="mt-3 flex items-center gap-1 text-[11px] text-slate-500">
                                                        <BookOpen className="h-3 w-3" />
                                                        {m.reply.sourceLabel}
                                                    </p>
                                                    {m.reply.links.map(
                                                        (link) => (
                                                            <Link
                                                                key={link.href}
                                                                href={link.href}
                                                                onClick={close}
                                                                className="mt-2 block font-semibold text-[#77152d] underline underline-offset-2"
                                                            >
                                                                {link.label}
                                                            </Link>
                                                        )
                                                    )}
                                                    {m.reply.suggestions.map(
                                                        (q) => (
                                                            <button
                                                                key={q.id}
                                                                disabled={
                                                                    loading
                                                                }
                                                                onClick={() =>
                                                                    void ask(
                                                                        q.question,
                                                                        PREDEFINED_QUESTIONS.find(
                                                                            (
                                                                                item
                                                                            ) =>
                                                                                item.id ===
                                                                                q.id
                                                                        )
                                                                    )
                                                                }
                                                                className="mt-2 block w-full rounded-lg border bg-white p-2 text-left text-xs hover:bg-rose-50"
                                                            >
                                                                {q.question}
                                                            </button>
                                                        )
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {loading && (
                            <p
                                role="status"
                                className="mt-4 flex items-center gap-2 text-sm text-slate-500"
                            >
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Finding guidance…
                            </p>
                        )}
                        <div ref={end} />
                    </div>
                    <form
                        onSubmit={submit}
                        className="shrink-0 border-t bg-white px-4 py-3"
                    >
                        <label htmlFor="guide-question" className="sr-only">
                            Ask the Harmonisys guide
                        </label>
                        <div className="flex gap-2">
                            <input
                                id="guide-question"
                                ref={field}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                maxLength={2000}
                                placeholder="How do I request Responder access?"
                                disabled={loading}
                                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-3 text-sm focus:border-[#77152d] focus:outline-none focus:ring-2 focus:ring-rose-100"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                aria-label="Send question"
                                className="rounded-xl bg-[#77152d] px-4 text-white disabled:opacity-40"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </form>
                </section>
            )}
        </>
    );
}
