export type QuestionCategory =
    | 'general'
    | 'irs'
    | 'redas'
    | 'unahon'
    | 'misalud'
    | 'hazardhunter';

export type PredefinedQuestion = {
    id: string;
    category: QuestionCategory;
    question: string;
    answer: string;
    keywords: string[];
};

export const PREDEFINED_QUESTIONS: PredefinedQuestion[] = [
    {
        id: 'general-modules',
        keywords: ['harmonisys assistant help', 'harmonisys modules'],
        category: 'general',
        question: 'What can the Harmonisys assistant help me with?',
        answer: 'Harmonisys provides guidance for five DRRM-H modules: the Incident Reporting System (IRS), REDAS, Unahon, Mi Salud, and HazardHunter. Choose one of the questions below to learn about a module.',
    },
    {
        id: 'irs-overview',
        keywords: ['incident reporting system overview', 'what is irs'],
        category: 'irs',
        question: 'What is the Incident Reporting System?',
        answer: 'The Incident Reporting System (IRS) supports real-time documentation of emergency drills and incidents. It generates structured summaries and helps response teams review and compare performance over time.',
    },
    {
        id: 'irs-report',
        keywords: ['report an incident in irs', 'submit an irs report'],
        category: 'irs',
        question: 'How do I report an incident in IRS?',
        answer: 'Open the IRS page and select the appropriate event. Enter the requested incident details carefully, review the information for accuracy, and submit the report. If the event is not listed, contact the system administrator or authorized incident manager.',
    },
    {
        id: 'irs-prepare',
        keywords: ['information for irs report', 'irs report requirements'],
        category: 'irs',
        question: 'What information should I prepare for an IRS report?',
        answer: 'Prepare the event name, incident date and time, location, a clear description of what happened, the actions taken, and any other details requested by the incident form.',
    },
    {
        id: 'redas-overview',
        keywords: ['what is redas', 'redas overview'],
        category: 'redas',
        question: 'What is REDAS?',
        answer: 'REDAS is the Rapid Earthquake Damage Assessment System developed by DOST-PHIVOLCS. It supports earthquake, tsunami, rain, flood, wind, lahar, and other multi-hazard assessments for preparedness and decision-making.',
    },
    {
        id: 'redas-capabilities',
        keywords: ['redas capabilities', 'redas tools'],
        category: 'redas',
        question: 'What can REDAS do?',
        answer: 'REDAS provides hazard monitoring, seismic hazard simulations, and estimates of damage, fatalities, and economic losses. Its tools include SHAKE for earthquakes, FLoAT for floods, SWIFT for severe wind, QLIST for lahars, and CropDAT for agriculture.',
    },
    {
        id: 'redas-training',
        keywords: ['request redas training', 'redas training request'],
        category: 'redas',
        question: 'How can I request REDAS training?',
        answer: 'Send a formal request to the Director of DOST-PHIVOLCS through redas@phivolcs.dost.gov.ph. Basic REDAS training typically runs for five days and covers the core tools.',
    },
    {
        id: 'unahon-overview',
        keywords: ['what is unahon', 'unahon purpose'],
        category: 'unahon',
        question: 'What is Unahon used for?',
        answer: 'Unahon is a rapid mental-health screening tool for internally displaced persons after disasters. It helps non-mental-health responders identify signs of distress and helps camp managers prioritize support and resources.',
    },
    {
        id: 'unahon-users',
        keywords: ['unahon users', 'who uses unahon'],
        category: 'unahon',
        question: 'Who should use Unahon?',
        answer: 'Unahon is intended for camp management teams, humanitarian workers, and other trained non-mental-health responders supporting displaced communities.',
    },
    {
        id: 'unahon-risk',
        keywords: ['unahon person at risk', 'unahon immediate safety concern'],
        category: 'unahon',
        question: 'What should I do if someone appears to be at risk?',
        answer: 'Do not leave the person alone when there is an immediate safety concern. Follow your organization’s emergency and referral protocol and connect the person with a qualified mental-health or medical professional. For an immediate threat to life, contact local emergency services.',
    },
    {
        id: 'misalud-overview',
        keywords: ['what is mi salud', 'mi salud overview'],
        category: 'misalud',
        question: 'What is Mi Salud?',
        answer: 'Mi Salud monitors responders’ mental, emotional, and physical condition before, during, and after disaster response. It provides stress-management recommendations based on screening answers.',
    },
    {
        id: 'misalud-screening',
        keywords: ['submit mi salud screening', 'mi salud wellness screening'],
        category: 'misalud',
        question: 'How do I submit a Mi Salud wellness screening?',
        answer: 'Open the Mi Salud dashboard, access your team, and complete every required screening question honestly. Review your responses before submitting so the recommendations and team statistics are accurate.',
    },
    {
        id: 'misalud-data',
        keywords: [
            'cannot see mi salud team data',
            'mi salud team data missing',
        ],
        category: 'misalud',
        question: 'Why can’t I see my Mi Salud team data?',
        answer: 'Confirm that you are signed in with the correct account and that your team membership or request has been approved. Team leaders and administrators may have different access from regular members.',
    },
    {
        id: 'hazardhunter-overview',
        keywords: ['hazardhunter hazards', 'hazardhunter check'],
        category: 'hazardhunter',
        question: 'What does HazardHunter check?',
        answer: 'HazardHunter provides a rapid assessment of a Philippine location’s exposure to hazards such as earthquakes, volcanic eruptions, floods, rain-induced landslides, storm surges, and severe winds.',
    },
    {
        id: 'hazardhunter-use',
        keywords: [
            'assess location with hazardhunter',
            'hazardhunter location assessment',
        ],
        category: 'hazardhunter',
        question: 'How do I assess a location with HazardHunter?',
        answer: 'Open the HazardHunter page, locate or select the place you want to assess on the map, and review the available hazard information. Use the results as an initial screening and consult the responsible government agency for detailed planning decisions.',
    },
];
