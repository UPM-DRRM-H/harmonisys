import { PREDEFINED_QUESTIONS, QuestionCategory } from './predefinedQuestions';
import {
    matchPredefinedQuestion,
    rankedGuideQuestions,
} from './matchPredefinedQuestion';
export function guideReply(
    message: string,
    category: QuestionCategory = 'general'
) {
    if (
        /(?:kill myself|suicid|(?:can\s*not|can.?t|unable to)\s+breathe|chest pain|life.?threatening|immediate danger)/i.test(
            message
        )
    )
        return {
            reply: 'This app guide cannot assess symptoms or dispatch help. For immediate danger or a life-threatening emergency, contact local emergency services now and follow your organization’s emergency protocol.',
            source: 'emergency',
            sourceLabel: 'Emergency reminder',
            suggestions: [],
            links: [],
        };
    const greeting =
        /^(hi|hello|hey|good morning|good afternoon|good evening)[!.?\s]*$/i.test(
            message.trim()
        );
    const match = greeting
        ? PREDEFINED_QUESTIONS.find((q) => q.id === 'general-modules')!
        : matchPredefinedQuestion(message, category);
    if (match)
        return {
            reply: match.answer,
            source: 'guide',
            matchedQuestionId: match.id,
            sourceLabel: match.pages.length
                ? 'User manual · ' +
                  match.pages.map((p) => 'p. ' + p).join(', ')
                : 'Current app guidance',
            suggestions: [],
            links: match.href
                ? [
                      {
                          href: match.href,
                          label: match.linkLabel || 'Open this area',
                      },
                  ]
                : [],
        };
    const ranked = rankedGuideQuestions(message, category);
    const suggestions = (
        ranked.length
            ? ranked.map((r) => r.item)
            : PREDEFINED_QUESTIONS.filter((q) => q.category === category)
    )
        .slice(0, 3)
        .map((q) => ({ id: q.id, question: q.question }));
    return {
        reply: 'I can guide you through the app, but I cannot read your records, diagnose a condition or complete actions for you. Choose a related question below, or describe the app feature and the step you need help with.',
        source: 'clarification',
        sourceLabel: 'App guide',
        suggestions,
        links: [{ href: '/help', label: 'Browse all help topics' }],
    };
}
