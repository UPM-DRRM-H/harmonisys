import {
    PREDEFINED_QUESTIONS,
    type PredefinedQuestion,
} from './predefinedQuestions';

export function normalizeChatMessage(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function comparableText(value: string) {
    return normalizeChatMessage(value)
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function matchPredefinedQuestion(
    message: string
): PredefinedQuestion | null {
    const normalizedMessage = comparableText(message);
    if (!normalizedMessage) return null;

    const exactMatch = PREDEFINED_QUESTIONS.find(
        (item) => comparableText(item.question) === normalizedMessage
    );
    if (exactMatch) return exactMatch;

    const matches = PREDEFINED_QUESTIONS.flatMap((item) =>
        item.keywords
            .map((keyword) => comparableText(keyword))
            .filter((keyword) => keyword && normalizedMessage.includes(keyword))
            .map((keyword) => ({ item, score: keyword.split(' ').length }))
    ).sort((a, b) => b.score - a.score);

    if (matches.length === 0) return null;

    const best = matches[0];
    const tiedWithAnotherAnswer = matches.some(
        (match, index) =>
            index > 0 &&
            match.score === best.score &&
            match.item.id !== best.item.id
    );

    return tiedWithAnotherAnswer ? null : best.item;
}
