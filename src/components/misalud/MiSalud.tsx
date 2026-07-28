'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import type {
    Team,
    Event,
    QuestionnaireResponses,
    QuestionnaireFormData,
} from '@/types';
import { Incident } from '@/types';
import { parseIncidentDates } from '@/lib/action/irs';

import Questionnaire from './Questionnaire';
import MiSaludControls from './MiSaludControls';
import MiSaludStats from './MiSaludStats';
import MiSaludGrid from './MiSaludGrid';
import type { Recommendation } from '@/types';
import { generateRecommendations } from '@/lib/action/misalud';
import RecommendationsModal from './RecommendationsModal';
import MiSaludRegistrationForm from './MiSaludRegistrationForm';

interface QuestionnaireResponse {
    id: string;
    questionId: number;
    questionText: string;
    selectedOption: string;
    submissionId: string;
}

export interface QuestionnaireSubmission {
    id: string;
    name: string;
    date: string;
    team: string;
    createdAt: string;
    updatedAt: string;
    responses: QuestionnaireResponse[];
}

export interface QuestionnaireData {
    submissions: QuestionnaireSubmission[];
}

export interface TeamGroup {
    teamName: string;
    members: QuestionnaireSubmission[];
    totalSubmissions: number;
    lastSubmission: string;
}

export interface IncidentGroup {
    teamDeployed: string;
    incidents: Incident[];
    totalIncidents: number;
    lastIncident: Date;
    severityBreakdown: { [key: string]: number };
}

type MiSaludProps = {
    userRole?: 'ADMIN' | 'RESPONDER' | 'STANDARD' | string;
};

const MiSalud = ({ userRole = 'STANDARD' }: MiSaludProps) => {
    const misaludTheme = {
        primaryGradient:
            'bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600',
        primaryHover:
            'hover:from-emerald-900 hover:via-emerald-800 hover:to-emerald-700',
    };
    const primaryGradient = misaludTheme.primaryGradient;
    const primaryHover = misaludTheme.primaryHover;
    const roleRaw = String(userRole || 'STANDARD').toUpperCase();
    const isResponderView = roleRaw.includes('RESPONDER');
    const isAdminView = roleRaw.includes('ADMIN');

    const router = useRouter();
    useEffect(() => {
        const canAccess = isAdminView || isResponderView;
        if (!canAccess) {
            router.replace('/overview/misalud');
            return;
        }
        // Responders should use the TL dashboard, not the full admin view
        if (isResponderView && !isAdminView) {
            router.replace('/misalud/team-requests');
        }
    }, [isAdminView, isResponderView, router]);

    const [selectedView, setSelectedView] = useState<'teams' | 'events'>(
        'teams'
    );
    const [selectedFilter, setSelectedFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Original data (for archive)
    const { data: teamsData = [], isLoading: loadingTeams } = useQuery<Team[]>({
        queryKey: ['misalud-teams'],
        queryFn: async () => {
            const response = await fetch('/api/misalud/teams');
            const result = await response.json();

            if (!response.ok) {
                throw new Error('Failed to fetch teams data');
            }

            return result.data || [];
        },
        staleTime: 5 * 60 * 1000,
    });

    const { data: eventsData = [], isLoading: loadingEvents } = useQuery<
        Event[]
    >({
        queryKey: ['misalud-screenings'],
        queryFn: async () => {
            const response = await fetch('/api/misalud/screenings');
            const result = await response.json();

            if (!response.ok) {
                throw new Error('Failed to fetch events data');
            }

            return result.data || [];
        },
        staleTime: 5 * 60 * 1000,
    });

    const {
        data: questionnaireData = { submissions: [] },
        isLoading: loadingQuestionnaire,
    } = useQuery<QuestionnaireData>({
        queryKey: ['misalud-health'],
        queryFn: async () => {
            const response = await fetch('/api/misalud/health');

            if (!response.ok) {
                throw new Error('Failed to fetch questionnaire data');
            }

            return response.json();
        },
        staleTime: 2 * 60 * 1000,
    });

    const { data: incidentsData = [], isLoading: loadingIncidents } = useQuery<
        Incident[]
    >({
        queryKey: ['misalud-incidents'],
        queryFn: async () => {
            const response = await fetch('/api/irs/incidents');

            if (!response.ok) {
                throw new Error('Failed to fetch incidents data');
            }

            const result = await response.json();
            return result.map(parseIncidentDates);
        },
        staleTime: 2 * 60 * 1000,
    });

    const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recommendations, setRecommendations] = useState<Recommendation[]>(
        []
    );
    const [formData, setFormData] = useState<QuestionnaireFormData>({
        name: '',
        date: new Date(),
        team: '',
    });

    // 🔥 MiSalud Membership State
    const {
        data: membershipResult,
        isLoading: loadingMembership,
        refetch: refetchMembership,
    } = useQuery({
        queryKey: ['misalud-membership', isAdminView],
        queryFn: async () => {
            if (isAdminView) {
                return {
                    status: 'APPROVED' as const,
                    membership: {
                        role: 'ADMIN',
                        teamName: 'Admin Access',
                    },
                };
            }

            const response = await fetch('/api/misalud/membership');
            return response.json();
        },
        staleTime: 2 * 60 * 1000,
    });

    const membershipStatus = membershipResult?.status || 'NONE';

    const membershipData = membershipResult?.membership || null;

    const isApprovedTeamLeader =
        membershipStatus === 'APPROVED' &&
        membershipData?.role === 'TEAM_LEADER';

    const handleRecommendations = (
        responses: QuestionnaireResponses,
        formData: QuestionnaireFormData
    ) => {
        setRecommendations(generateRecommendations(responses));
        setFormData(formData);
    };

    // Group questionnaire submissions by team
    const teamGroups = useMemo(() => {
        const groups: { [key: string]: QuestionnaireSubmission[] } = {};

        questionnaireData.submissions.forEach((submission) => {
            if (!groups[submission.team]) {
                groups[submission.team] = [];
            }
            groups[submission.team].push(submission);
        });

        return Object.entries(groups).map(([teamName, members]) => ({
            teamName,
            members,
            totalSubmissions: members.length,
            lastSubmission: members.reduce(
                (latest, member) =>
                    new Date(member.createdAt) > new Date(latest)
                        ? member.createdAt
                        : latest,
                members[0]?.createdAt || ''
            ),
        }));
    }, [questionnaireData.submissions]);

    // Group incidents by teamDeployed
    const incidentGroups = useMemo(() => {
        const groups: { [key: string]: Incident[] } = {};

        incidentsData.forEach((incident) => {
            const team = incident.teamDeployed || 'Unassigned';
            if (!groups[team]) {
                groups[team] = [];
            }
            groups[team].push(incident);
        });

        return Object.entries(groups).map(([teamDeployed, incidents]) => ({
            teamDeployed,
            incidents,
            totalIncidents: incidents.length,
            lastIncident: incidents.reduce(
                (latest, incident) =>
                    new Date(incident.createdAt) > new Date(latest)
                        ? incident.createdAt
                        : latest,
                incidents[0]?.createdAt || ''
            ),
            severityBreakdown: {} as { [key: string]: number }, // ← severity removed from schema
        }));
    }, [incidentsData]);

    // Handle team click
    const handleTeamClick = (teamName: string) => {
        // Navigate to team detail page
        router.push(`/misalud/team/${encodeURIComponent(teamName)}`);
    };

    // Handle event click - NEW FUNCTION
    const handleEventClick = (teamDeployed: string) => {
        // Navigate to event detail page
        router.push(`/irs/event/${encodeURIComponent(teamDeployed)}`);
    };

    // Filter teams based on archive vs new data
    const filteredTeams = useMemo(() => {
        if (selectedFilter === 'archive') {
            // Show original teams data in archive
            let filtered = teamsData;

            if (searchQuery) {
                filtered = filtered.filter(
                    (team) =>
                        team.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                        team.code
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                );
            }

            return filtered;
        } else {
            // Show new questionnaire team groups for other filters
            let filtered = teamGroups;

            if (searchQuery) {
                filtered = filtered.filter(
                    (team) =>
                        team.teamName
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                        team.members.some((member) =>
                            member.name
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase())
                        )
                );
            }

            return filtered;
        }
    }, [teamsData, teamGroups, selectedFilter, searchQuery]);

    // Filter events based on archive vs new data
    const filteredEvents = useMemo(() => {
        if (selectedFilter === 'archive') {
            // Show original events data in archive
            let filtered = eventsData;

            if (searchQuery) {
                filtered = filtered.filter(
                    (event) =>
                        event.teamId
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                        event.id
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                );
            }

            return filtered;
        } else {
            // Show new incidents data for other filters
            let filtered = incidentGroups;

            if (searchQuery) {
                filtered = filtered.filter(
                    (group) =>
                        group.teamDeployed
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                        group.incidents.some(
                            (incident) =>
                                incident.summary
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase()) ||
                                incident.location
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase()) ||
                                incident.category
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase())
                        )
                );
            }

            return filtered;
        }
    }, [eventsData, incidentGroups, selectedFilter, searchQuery]);

    const getTeamByEventId = (teamId: string) => {
        return teamsData.find((team) => team.id === teamId);
    };

    const isArchiveView = selectedFilter === 'archive';
    const loadingOriginal = loadingTeams || loadingEvents;
    const isTransitioningMembership =
        loadingMembership || showRegistrationModal;
    const showMembershipModal =
        !isAdminView &&
        !loadingMembership &&
        !isSubmitting &&
        membershipStatus &&
        membershipStatus !== 'APPROVED';

    // Don't render anything for responders — they're being redirected
    if (isResponderView && !isAdminView) return null;

    const isLoading = isArchiveView
        ? loadingOriginal
        : selectedView === 'teams'
          ? loadingQuestionnaire
          : loadingIncidents;

    return (
        <div className="min-h-screen bg-emerald-50 relative">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div
                    className={`transition-all duration-300 ${
                        !isAdminView && membershipStatus !== 'APPROVED'
                            ? 'blur-md pointer-events-none select-none'
                            : ''
                    }`}
                >
                    {/* ✅ COMBINED HEADER + CONTROLS (like User Controller / REDAS) */}
                    <Card className="mb-8 bg-white/70 backdrop-blur-sm shadow-lg border border-white/20 overflow-hidden rounded-[28px]">
                        {/* ✅ HERO (top) */}
                        <div
                            className={`bg-gradient-to-r ${misaludTheme.primaryGradient}`}
                        >
                            <div className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div>
                                        <h1 className="text-4xl lg:text-5xl font-black text-white drop-shadow-[0_12px_22px_rgba(0,0,0,0.35)] mb-2">
                                            Mi Salud Dashboard
                                        </h1>
                                        <p className="text-white/85 text-lg">
                                            {isArchiveView
                                                ? 'Explore archived teams and events data with comprehensive historical insights'
                                                : 'Monitor team wellness through questionnaire submissions and health analytics'}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                                        <Button
                                            className="
                                font-bold
                                bg-white text-emerald-700
                                border border-white/70
                                min-w-[180px] h-12
                                shadow-xl hover:shadow-2xl
                                transition-all duration-500
                                transform hover:-translate-y-1 hover:scale-105
                                rounded-xl
                                hover:bg-emerald-50
                                hover:text-emerald-800
                            "
                                            size="lg"
                                            onPress={() =>
                                                setShowQuestionnaireModal(true)
                                            }
                                            endContent={
                                                <svg
                                                    className="w-5 h-5 text-emerald-700 group-hover:text-emerald-800"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                    />
                                                </svg>
                                            }
                                        >
                                            Assess Health
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ✅ CONTROLS (bottom attached) */}
                        <div className="border-t border-white/30">
                            <MiSaludControls
                                searchQuery={searchQuery}
                                selectedFilter={selectedFilter}
                                selectedView={selectedView}
                                setSearchQuery={setSearchQuery}
                                setSelectedFilter={setSelectedFilter}
                                setSelectedView={setSelectedView}
                                showLeaderActions={isApprovedTeamLeader}
                                onLeaderRequestsClick={() =>
                                    router.push('/misalud/team-requests')
                                }
                            />
                        </div>
                    </Card>
                    {/* Stats Section */}
                    <MiSaludStats
                        eventsData={eventsData}
                        filteredEvents={filteredEvents}
                        filteredTeams={filteredTeams}
                        incidentsData={incidentsData}
                        isArchiveView={isArchiveView}
                        questionnaireData={questionnaireData}
                        selectedView={selectedView}
                        teamGroups={teamGroups}
                        teamsData={teamsData}
                        loading={isLoading}
                    />
                    {/* Data Grid Section */}
                    <MiSaludGrid
                        filteredEvents={filteredEvents}
                        filteredTeams={filteredTeams}
                        getTeamByEventId={getTeamByEventId}
                        handleEventClick={handleEventClick}
                        handleTeamClick={handleTeamClick}
                        isArchiveView={isArchiveView}
                        isLoading={isLoading}
                        selectedView={selectedView}
                    />
                    {/* Questionnaire Modal */}
                    {showQuestionnaireModal && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <Card className="bg-white shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                                <CardHeader className="pb-4 border-b border-slate-200">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                                                <svg
                                                    className="w-6 h-6 text-white"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                                                    Health Assessment
                                                </h2>
                                                <p className="text-slate-600 text-sm">
                                                    Complete your wellness
                                                    evaluation
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            isIconOnly
                                            variant="light"
                                            onPress={() =>
                                                setShowQuestionnaireModal(false)
                                            }
                                            className="hover:bg-red-100"
                                        >
                                            <svg
                                                className="w-6 h-6 text-slate-400 hover:text-red-500"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <Questionnaire
                                        onClose={() =>
                                            setShowQuestionnaireModal(false)
                                        }
                                        openSuccessModal={() =>
                                            setShowSuccessDialog(true)
                                        }
                                        approvedTeamName={
                                            membershipData?.teamName
                                        }
                                        handleRecommendations={
                                            handleRecommendations
                                        }
                                    />
                                </CardBody>
                            </Card>
                        </div>
                    )}

                    <RecommendationsModal
                        open={showSuccessDialog}
                        onClose={() => setShowSuccessDialog(false)}
                        recommendations={recommendations}
                        formData={formData}
                    />
                </div>
            </div>

            {showRegistrationModal && (
                <div className="fixed inset-x-0 top-[64px] bottom-0 bg-black/60 z-[110] flex items-center justify-center p-4">
                    <Card className="bg-white shadow-2xl w-full max-w-xl">
                        <CardHeader className="pb-4 border-b border-slate-200">
                            <div className="flex items-center justify-between w-full">
                                <div>
                                    <h2 className="text-2xl font-bold text-emerald-700">
                                        Mi Salud Registration
                                    </h2>
                                    <p className="text-slate-600 text-sm">
                                        Complete your registration to request
                                        access to the Mi Salud dashboard
                                    </p>
                                </div>

                                <Button
                                    isIconOnly
                                    variant="light"
                                    onPress={() =>
                                        setShowRegistrationModal(false)
                                    }
                                    className="hover:bg-red-100"
                                >
                                    <svg
                                        className="w-6 h-6 text-slate-400 hover:text-red-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </Button>
                            </div>
                        </CardHeader>

                        <CardBody className="p-6">
                            <MiSaludRegistrationForm
                                onCancel={() => setShowRegistrationModal(false)}
                                onSuccess={async () => {
                                    setIsSubmitting(true); // 🔒 lock UI transitions

                                    setShowRegistrationModal(false);

                                    await refetchMembership();

                                    setIsSubmitting(false); // 🔓 unlock after stable state
                                }}
                            />
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* 🔒 MiSalud Membership Modal (FIXED FLOW) */}
            {showMembershipModal && !showRegistrationModal && (
                <div className="fixed inset-x-0 top-[64px] bottom-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <Card className="w-full max-w-lg shadow-2xl border border-white/20">
                        <CardBody className="p-6 text-center space-y-4">
                            {/* NONE → Join Mi Salud */}
                            {membershipStatus === 'NONE' && (
                                <>
                                    <h2 className="text-2xl font-bold text-emerald-700">
                                        Join Mi Salud
                                    </h2>

                                    <p className="text-slate-600">
                                        Before accessing the dashboard, you must
                                        register your team or join an existing
                                        one.
                                    </p>

                                    <Button
                                        onPress={() => {
                                            setIsSubmitting(false);
                                            setShowRegistrationModal(true);
                                        }}
                                        className={`${misaludTheme.primaryGradient} text-white font-bold rounded-xl`}
                                    >
                                        Register Now
                                    </Button>
                                </>
                            )}

                            {/* PENDING → Request Pending */}
                            {membershipStatus === 'PENDING' && (
                                <>
                                    <h2 className="text-xl font-bold text-yellow-600">
                                        Request Pending
                                    </h2>

                                    <p className="text-slate-600">
                                        {membershipData?.requestedRole ===
                                        'TEAM_LEADER'
                                            ? 'Your team registration has been submitted and is now waiting for admin approval. You will be able to access Mi Salud once your request is approved.'
                                            : 'Your join request is waiting for team leader approval.'}
                                    </p>
                                </>
                            )}

                            {/* REJECTED → Rejected */}
                            {membershipStatus === 'REJECTED' && (
                                <>
                                    <h2 className="text-xl font-bold text-red-600">
                                        Request Not Approved
                                    </h2>

                                    <p className="text-slate-600">
                                        Your previous request was not approved.
                                        You may submit a new request.
                                    </p>

                                    {membershipData?.rejectionReason && (
                                        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-left">
                                            <p className="text-sm font-semibold text-red-700 mb-1">
                                                Rejection Reason
                                            </p>
                                            <p className="text-sm text-red-600">
                                                {membershipData.rejectionReason}
                                            </p>
                                        </div>
                                    )}

                                    <Button
                                        className={`${misaludTheme.primaryGradient} text-white font-bold rounded-xl`}
                                        onPress={() =>
                                            setShowRegistrationModal(true)
                                        }
                                    >
                                        Submit Again
                                    </Button>
                                </>
                            )}
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default MiSalud;
