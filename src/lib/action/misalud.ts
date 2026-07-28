import type {
    QuestionnaireResponses,
    UrgencyLevel,
    Recommendation,
    WellnessDomainStatus,
    MemberOverallStatus,
} from '@/types';
import { QUESTIONS, RECOMMENDATIONS, LEADER_RECOMMENDATIONS } from '@/constants/';

export function getUrgencyLevel(
    questionId: number,
    optionIndex: number
): UrgencyLevel {
    // Option index 0 = Green, 1 = Yellow, 2 = Red
    switch (optionIndex) {
        case 0:
            return 'green';
        case 1:
            return 'yellow';
        case 2:
            return 'red';
        default:
            return 'green';
    }
}

export function generateRecommendations(
    responses: QuestionnaireResponses
): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const urgencyLevels: Set<UrgencyLevel> = new Set();

    // Analyze responses and determine urgency levels
    Object.entries(responses).forEach(([questionIdStr, selectedOption]) => {
        const questionId = Number.parseInt(questionIdStr);

        // Find the option index (0, 1, or 2)
        const optionIndex = getOptionIndex(questionId, selectedOption);
        const urgencyLevel = getUrgencyLevel(questionId, optionIndex);

        urgencyLevels.add(urgencyLevel);

        // Add specific recommendations for yellow and red categories
        if (urgencyLevel === 'yellow' || urgencyLevel === 'red') {
            const categoryRecommendations = RECOMMENDATIONS[urgencyLevel];
            const questionRecommendation = categoryRecommendations.find(
                (rec) => rec.questionId === questionId
            );

            if (questionRecommendation) {
                recommendations.push(questionRecommendation);
            }
        }
    });

    // Always add green recommendations if any green responses exist
    if (urgencyLevels.has('green')) {
        recommendations.push(...RECOMMENDATIONS.green);
    }

    // Sort recommendations by urgency: Red first, then Yellow, then Green
    return recommendations.sort((a, b) => {
        const urgencyOrder = { red: 0, yellow: 1, green: 2 };
        return urgencyOrder[a.category] - urgencyOrder[b.category];
    });
}

function getOptionIndex(questionId: number, selectedOption: string): number {
    const questionOptions = QUESTIONS[questionId - 1];
    return questionOptions.options.indexOf(selectedOption);
}

export function getUrgencyFromSelectedOption(
    questionId: number,
    selectedOption: string
): UrgencyLevel {
    const optionIndex = getOptionIndex(questionId, selectedOption);
    return getUrgencyLevel(questionId, optionIndex);
}

export function getMemberOverallStatus(
    domainStatuses: WellnessDomainStatus[]
): MemberOverallStatus {
    if (domainStatuses.every((status) => status === 'pending')) return 'pending';
    if (domainStatuses.includes('red')) return 'urgent';
    if (domainStatuses.includes('yellow')) return 'action';
    return 'ready';
}

export function getLeaderRecommendation(
    questionId: number,
    urgency: 'yellow' | 'red'
): Recommendation | null {
    return LEADER_RECOMMENDATIONS[questionId]?.[urgency] ?? null;
}
