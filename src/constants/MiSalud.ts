import { Question, Recommendation } from '@/types/';

export const QUESTIONS: Question[] = [
    {
        id: 1,
        text: 'How much have you slept within the last 24 hours?',
        options: [
            'I had 7 or more hours of sleep.',
            'I had less than 7 hours of sleep.',
            'I had no sleep at all.',
        ],
    },
    {
        id: 2,
        text: 'When was your last meal?',
        options: [
            'I had eaten a meal less than 5 hours ago.',
            'I had eaten a meal within 24 hours.',
            'I had not eaten a meal within 24 hours or more.',
        ],
    },
    {
        id: 3,
        text: "How much do you know about your family's safety and wellbeing?",
        options: [
            'I know that my family is safe and out of the danger zone.',
            'I know that my family is within the danger zone but I was informed that they were safe.',
            'I know that my family is within the danger zone and I was informed that they were harmed / I have no information about them.',
        ],
    },
    {
        id: 4,
        text: 'Have you experienced disturbing conditions in your previous deployment in the field?',
        options: [
            'I have not experienced disturbing conditions in my previous deployment in the field.',
            'I have experienced disturbing conditions in my previous deployment in the field but I am not upset by it.',
            'I have experienced disturbing conditions in my previous deployment in the field and I am upset by it.',
        ],
    },
    {
        id: 5,
        text: 'Do you feel supported by your team or your team leader?',
        options: [
            'I feel very much supported.',
            'I feel supported but not much.',
            'I feel little to no support.',
        ],
    },
];

export const RECOMMENDATIONS: Record<string, Recommendation[]> = {
    green: [
        {
            category: 'green',
            title: 'General Wellness Recommendations',
            items: [
                'Get at least 7 hours of sleep',
                'Eat enough food and fill your body with nutrients',
                'Drink water frequently',
                'Exercise when able',
                'Practice breathing and relaxation techniques:',
                '• Paced breathing - Inhale slowly through your nose for 2-4 seconds, and then exhale for 4-6 seconds. You can say or think "in" and "out" with each breath.',
                '• Draw your elbows back slightly to allow your chest to expand. Inhale through your nose, hold your breath for 5 seconds, then exhale slowly through your nose.',
                '• Take 10 slow breaths.',
                '• Take a pause if you can.',
                'Always communicate with your teammates and team leaders.',
            ],
        },
    ],
    yellow: [
        {
            category: 'yellow',
            questionId: 1,
            title: 'Sleep',
            items: ['Get more sleep (at least 7 hours is recommended).'],
        },
        {
            category: 'yellow',
            questionId: 2,
            title: 'Food',
            items: ['Eat a full and nutritious meal.'],
        },
        {
            category: 'yellow',
            questionId: 3,
            title: "Family's safety and wellbeing",
            items: [
                'Contact your family, loved ones, and/or friends to make sure they are safe.',
                'Request for a family welfare check by the organization',
            ],
        },
        {
            category: 'yellow',
            questionId: 4,
            title: 'Exposure to disturbing conditions',
            items: [
                'Ask for rotation of tasks from team leader if possible.',
                'Talk to a trusted person about your feelings and experiences.',
                'Practice breathing and relaxation techniques:',
                '• Paced breathing – inhale slowly through your nose for 2-4 seconds, and then exhale for 4-6 seconds. You can say or think "in" and "out" with each breath.',
                '• Draw your elbows back slightly to allow your chest to expand. Inhale through your nose, hold your breath for 5 seconds, then exhale slowly through your nose.',
                '• Take 10 breaths.',
                '• Take a pause if you can.',
            ],
        },
        {
            category: 'yellow',
            questionId: 5,
            title: 'Support from Team',
            items: [
                'Inform your team leader and/or teammates of the support you need',
            ],
        },
    ],
    red: [
        {
            category: 'red',
            questionId: 1,
            title: 'Sleep',
            items: ['Get enough sleep (at least 7 hours is recommended).'],
        },
        {
            category: 'red',
            questionId: 2,
            title: 'Food',
            items: ['Eat a full and nutritious meal.'],
        },
        {
            category: 'red',
            questionId: 3,
            title: "Family's safety and wellbeing",
            items: [
                'Contact your family, loved ones, and/or friends to make sure they are safe.',
                'Request for a family welfare check by the organization.',
            ],
        },
        {
            category: 'red',
            questionId: 4,
            title: 'Exposure to disturbing conditions',
            items: [
                'Ask for rotation of tasks from team leader if possible.',
                'Talk to a trusted person about your feelings and experiences.',
                'Practice breathing and relaxation techniques:',
                '• Paced breathing – inhale slowly through your nose for 2-4 seconds, and then exhale for 4-6 seconds. You can say or think "in" and "out" with each breath.',
                '• Draw your elbows back slightly to allow your chest to expand. Inhale through your nose, hold your breath for 5 seconds, then exhale slowly through your nose.',
                '• Take 10 breaths.',
                '• Take a pause if you can.',
                'Seek help from a psychosocial support service provider if needed. Identify any psychosocial support services provided by your agency. This could be government agencies set up in the disaster site such as DOH or DSWD.',
                'For emergencies, go to the nearest hospital emergency room.',
            ],
        },
        {
            category: 'red',
            questionId: 5,
            title: 'Support from Team',
            items: [
                'Inform your team leader and/or teammates of the support you need.',
            ],
        },
    ],
};

export const WELLNESS_DOMAINS = [
    { id: 1, key: 'sleep', label: 'Sleep' },
    { id: 2, key: 'food', label: 'Food' },
    { id: 3, key: 'familySafety', label: 'Family Safety' },
    { id: 4, key: 'exposure', label: 'Exposure' },
    { id: 5, key: 'teamSupport', label: 'Team Support' },
] as const;

export const STATUS_BADGE_LABELS = {
    green: 'Ready to Work',
    yellow: 'Action Recommended',
    red: 'Urgent Support Needed',
    pending: 'Awaiting Response',
} as const;

/** Team-leader-facing recommendations when a domain is yellow or red */
export const LEADER_RECOMMENDATIONS: Record<
    number,
    Partial<Record<'yellow' | 'red', Recommendation>>
> = {
    1: {
        yellow: {
            category: 'yellow',
            questionId: 1,
            title: 'Sleep — Action Recommended',
            items: [
                'Assign the member to a low-stress task for the remainder of the shift.',
                'Adjust rotation to allow a rest window before the next deployment activity.',
                'Check in privately on sleep plans before the next operational period.',
            ],
        },
        red: {
            category: 'red',
            questionId: 1,
            title: 'Sleep — Urgent Support Needed',
            items: [
                'Mandate immediate rest before any high-risk assignment.',
                'Temporarily reassign the member away from field operations.',
                'Escalate to medical or psychosocial support if fatigue persists.',
            ],
        },
    },
    2: {
        yellow: {
            category: 'yellow',
            questionId: 2,
            title: 'Food — Action Recommended',
            items: [
                'Ensure the member receives a meal break within the next shift window.',
                'Coordinate with logistics for field rations if meals are unavailable.',
            ],
        },
        red: {
            category: 'red',
            questionId: 2,
            title: 'Food — Urgent Support Needed',
            items: [
                'Authorize an immediate meal and hydration break.',
                'Remove the member from active tasks until basic nutrition is restored.',
                'Monitor for signs of dehydration or exhaustion.',
            ],
        },
    },
    3: {
        yellow: {
            category: 'yellow',
            questionId: 3,
            title: 'Family Safety — Action Recommended',
            items: [
                'Authorize contact with family when communications are available.',
                'Request a family welfare check through your organization.',
                'Offer a brief check-in after the member contacts loved ones.',
            ],
        },
        red: {
            category: 'red',
            questionId: 3,
            title: 'Family Safety — Urgent Support Needed',
            items: [
                'Authorize immediate contact with family as soon as possible.',
                'Request an urgent family welfare check through your agency.',
                'Connect the member with psychosocial support if distress is evident.',
                'Consider temporary relief from high-stress assignments.',
            ],
        },
    },
    4: {
        yellow: {
            category: 'yellow',
            questionId: 4,
            title: 'Exposure — Action Recommended',
            items: [
                'Assign the member to a lower-exposure or low-stress task.',
                'Schedule a brief debrief with a trusted teammate or leader.',
                'Monitor for changes in mood or performance through the shift.',
            ],
        },
        red: {
            category: 'red',
            questionId: 4,
            title: 'Exposure — Urgent Support Needed',
            items: [
                'Remove the member from high-exposure field tasks immediately.',
                'Coordinate a peer support session or psychosocial referral.',
                'Document the concern and escalate per agency protocols.',
                'Do not leave the member isolated — assign a buddy when possible.',
            ],
        },
    },
    5: {
        yellow: {
            category: 'yellow',
            questionId: 5,
            title: 'Team Support — Action Recommended',
            items: [
                'Schedule a one-on-one check-in within the current operational window.',
                'Clarify roles and reinforce that the member can ask for help.',
                'Pair the member with a supportive teammate for the next task rotation.',
            ],
        },
        red: {
            category: 'red',
            questionId: 5,
            title: 'Team Support — Urgent Support Needed',
            items: [
                'Coordinate a peer support session with trusted teammates.',
                'Provide direct leadership intervention — listen and acknowledge concerns.',
                'Review team dynamics and address any isolation or conflict promptly.',
                'Refer to psychosocial support services if distress continues.',
            ],
        },
    },
};
