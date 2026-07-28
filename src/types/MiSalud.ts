export interface Team {
    id: string;
    totalMembers: number;
    createdAt: number;
    code: string;
    name: string;
    agencyId: string;
    updatedAt: number;
    leaderId: string | null;
}

export interface Event {
    id: string;
    createdAt: number;
    endDate: number;
    teamId: string;
    type: 'pre' | 'during' | 'post';
    startDate: number;
    updatedAt: number;
}

export interface FilterOption {
    label: string;
    value: string;
}

export type QuestionnaireFormData = {
    name: string;
    date: Date;
    team: string;
};

export interface QuestionnaireResponses {
    [questionId: number]: string;
}

export type SubmissionData = {
    formData: QuestionnaireFormData;
    responses: QuestionnaireResponses;
};

export type Question = {
    id: number;
    text: string;
    options: string[];
};

export type UrgencyLevel = 'red' | 'yellow' | 'green';

export type WellnessDomainStatus = UrgencyLevel | 'pending';

export type MemberOverallStatus = 'ready' | 'action' | 'urgent' | 'pending';

export interface Recommendation {
    category: UrgencyLevel;
    questionId?: number;
    title: string;
    items: string[];
}
