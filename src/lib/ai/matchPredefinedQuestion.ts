import {
    PREDEFINED_QUESTIONS,
    PredefinedQuestion,
    QuestionCategory,
} from './predefinedQuestions';
export function normalizeChatMessage(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .replace(/mi\s+salud/g, 'misalud')
        .replace(/hazard\s+hunter/g, 'hazardhunter')
        .replace(/sign\s+up|sign-up/g, 'register')
        .replace(/sign\s+in|log\s+in/g, 'login')
        .replace(/one[- ]time (?:password|code)/g, 'otp')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
const STOP = new Set(
    'what how can i do the is a to my in with and please me you tell about of it on this that for get want does are from an should where'.split(
        ' '
    )
);
function tokens(value: string) {
    return normalizeChatMessage(value)
        .split(' ')
        .filter((w) => w && !STOP.has(w))
        .map(
            (w) =>
                (
                    ({
                        registration: 'register',
                        installing: 'install',
                        installed: 'install',
                        approved: 'approval',
                        approve: 'approval',
                        approvals: 'approval',
                        notifications: 'notification',
                        graphs: 'graph',
                        charts: 'chart',
                        requesting: 'request',
                        requests: 'request',
                        screenings: 'screening',
                        teams: 'team',
                        members: 'member',
                        joining: 'join',
                        reporting: 'report',
                        reports: 'report',
                    }) as Record<string, string>
                )[w] || w
        );
}
export function rankedGuideQuestions(
    message: string,
    category?: QuestionCategory
) {
    const normalized = normalizeChatMessage(message),
        words = new Set(tokens(message));
    if (!normalized) return [];
    const modules = ['irs', 'redas', 'unahon', 'misalud', 'hazardhunter'];
    const explicit = modules.find((module) => words.has(module));
    return PREDEFINED_QUESTIONS.map((item) => {
        const exact = normalizeChatMessage(item.question) === normalized;
        const phrases = item.keywords
            .map(normalizeChatMessage)
            .filter((k) => (' ' + normalized + ' ').includes(' ' + k + ' '));
        const phrase = phrases.length
            ? Math.max(...phrases.map((p) => tokens(p).length * 8))
            : 0;
        const candidate = new Set(
            tokens(item.question + ' ' + item.keywords.join(' '))
        );
        const overlap = [...words].filter((w) => candidate.has(w)).length;
        const overview =
            /overview$|general-modules/.test(item.id) &&
            explicit &&
            item.category === explicit &&
            (/^(what|tell|explain)|overview/.test(normalized) ||
                words.size === 1);
        const score = exact
            ? 100
            : phrase +
              overlap * 3 +
              (overview ? 16 : 0) +
              (explicit
                  ? item.category === explicit
                      ? 3
                      : 0
                  : category && item.category === category
                    ? 1
                    : 0);
        return { item, score, overlap, phrase };
    })
        .filter(
            (r) =>
                r.score >= 8 &&
                (r.phrase > 0 || r.overlap >= 2 || r.score >= 16)
        )
        .sort((a, b) => b.score - a.score);
}
export function matchPredefinedQuestion(
    message: string,
    category?: QuestionCategory
): PredefinedQuestion | null {
    const ranked = rankedGuideQuestions(message, category);
    if (!ranked.length) return null;
    if (ranked.length > 1 && ranked[0].score === ranked[1].score) return null;
    return ranked[0].item;
}
