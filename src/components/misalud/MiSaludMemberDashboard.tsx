'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { Session } from 'next-auth';
import {
    Avatar, Button, Card, CardBody, CardHeader,
    Chip, Modal, ModalBody, ModalContent, ModalFooter,
    ModalHeader, Skeleton, useDisclosure,
} from '@heroui/react';
import {
    CalendarClock, CheckCircle2, Clock, ClipboardList,
    Heart, LogOut, ShieldCheck, Users,
} from 'lucide-react';
import type { Recommendation, QuestionnaireFormData, QuestionnaireResponses } from '@/types';
import { generateRecommendations } from '@/lib/action/misalud';
import Questionnaire from './Questionnaire';
import RecommendationsModal from './RecommendationsModal';

// ─── Types ───────────────────────────────────────────────────────────────────

type Teammate = {
    userId: string;
    name: string | null;
    email: string;
    image: string | null;
    approvedAt: string | null;
};

type Leader = {
    userId: string;
    name: string | null;
    email: string;
    image: string | null;
};

type DashboardData = {
    membership: { id: string; teamId: string; teamName: string; approvedAt: string | null };
    leader: Leader | null;
    teammates: Teammate[];
};

type MemberScreening = {
    id: string;
    screeningType: 'PRE_DEPLOYMENT' | 'DURING_DEPLOYMENT' | 'POST_DEPLOYMENT';
    validDate: string;
    dueDate: string;
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    createdAt: string;
    windowStatus: 'pending' | 'active' | 'past';
    hasSubmitted: boolean;
    submittedAt: string | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const SCREENING_TYPE_LABELS: Record<MemberScreening['screeningType'], string> = {
    PRE_DEPLOYMENT: 'Pre-Deployment',
    DURING_DEPLOYMENT: 'During Deployment',
    POST_DEPLOYMENT: 'Post-Deployment',
};

const SCREENING_TYPE_COLORS: Record<
    MemberScreening['screeningType'],
    'primary' | 'warning' | 'success'
> = {
    PRE_DEPLOYMENT: 'primary',
    DURING_DEPLOYMENT: 'warning',
    POST_DEPLOYMENT: 'success',
};

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
    session: Session | null;
}

export default function MiSaludMemberDashboard({ session: _session }: Props) {
    const queryClient = useQueryClient();
    const router = useRouter();

    // leave-team confirmation modal
    const { isOpen: isLeaveOpen, onOpen: onLeaveOpen, onOpenChange: onLeaveOpenChange } = useDisclosure();
    const [leaving, setLeaving] = useState(false);

    // health assessment modal
    const [showQuestionnaire, setShowQuestionnaire] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [assessmentFormData, setAssessmentFormData] = useState<QuestionnaireFormData>({
        name: '',
        date: new Date(),
        team: '',
    });

    // screenings inbox tab
    const [inboxTab, setInboxTab] = useState<'active' | 'pending' | 'past'>('active');

    // ── Queries ──────────────────────────────────────────────────────────────

    const { data, isLoading, error } = useQuery<DashboardData>({
        queryKey: ['misalud-member-dashboard'],
        queryFn: async () => {
            const res = await fetch('/api/misalud/member/dashboard');
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error ?? `Error ${res.status}`);
            }
            return res.json();
        },
        staleTime: 2 * 60 * 1000,
        retry: 1,
    });

    const { data: screeningsData, isLoading: screeningsLoading } = useQuery<{
        schedules: MemberScreening[];
    }>({
        queryKey: ['misalud-member-screenings'],
        queryFn: async () => {
            const res = await fetch('/api/misalud/member/screenings');
            if (!res.ok) throw new Error('Failed to load screenings');
            return res.json();
        },
        staleTime: 2 * 60 * 1000,
    });

    // ── Derived ──────────────────────────────────────────────────────────────

    const allSchedules = screeningsData?.schedules ?? [];
    const activeScreenings = allSchedules.filter((s) => s.windowStatus === 'active' && s.status === 'ACTIVE');
    const pendingScreenings = allSchedules.filter((s) => s.windowStatus === 'pending' && s.status === 'ACTIVE');
    const pastScreenings = allSchedules.filter((s) => s.windowStatus === 'past' || s.status !== 'ACTIVE');

    const tabScreenings =
        inboxTab === 'active' ? activeScreenings :
        inboxTab === 'pending' ? pendingScreenings :
        pastScreenings;

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleLeaveTeam = async () => {
        setLeaving(true);
        try {
            const res = await fetch('/api/misalud/member/leave', { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to leave team');
            await queryClient.invalidateQueries({ queryKey: ['misalud-member-dashboard'] });
            router.replace('/overview/misalud');
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setLeaving(false);
        }
    };

    const handleRecommendations = (
        responses: QuestionnaireResponses,
        formData: QuestionnaireFormData
    ) => {
        setRecommendations(generateRecommendations(responses));
        setAssessmentFormData(formData);
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-emerald-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">

                {/* Header */}
                <Card className="mb-8 overflow-hidden rounded-[28px] border border-white/20 shadow-lg">
                    <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-black text-white mb-1">
                                    My Mi Salud Dashboard
                                </h1>
                                <p className="text-white/80">
                                    {isLoading ? '...' : data?.membership.teamName ?? 'Your Team'}
                                </p>
                            </div>
                            <Button
                                onPress={() => setShowQuestionnaire(true)}
                                className="shrink-0 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl border border-white/30"
                                startContent={<Heart className="w-4 h-4" />}
                            >
                                Health Assessment
                            </Button>
                        </div>
                    </div>
                </Card>

                {isLoading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="rounded-2xl bg-white/70 shadow-md">
                                <CardBody className="p-6 space-y-3">
                                    <Skeleton className="h-6 w-48 rounded-lg" />
                                    <Skeleton className="h-14 w-full rounded-xl" />
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                ) : error ? (
                    <Card className="rounded-2xl bg-white/70 shadow-md border border-red-100">
                        <CardBody className="p-12 text-center">
                            <p className="font-semibold text-red-600 mb-1">Failed to load dashboard</p>
                            <p className="text-sm text-slate-500">{(error as Error).message}</p>
                        </CardBody>
                    </Card>
                ) : !data ? null : (
                    <div className="space-y-6">

                        {/* ── Team Info ──────────────────────────────────────── */}
                        <Card className="rounded-2xl bg-white/80 shadow-lg border border-white/20">
                            <CardHeader className="px-6 pt-5 pb-2">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                        <h2 className="text-lg font-black text-slate-800">My Team</h2>
                                    </div>
                                    <Button
                                        size="sm"
                                        color="danger"
                                        variant="flat"
                                        startContent={<LogOut className="w-3.5 h-3.5" />}
                                        onPress={onLeaveOpen}
                                    >
                                        Leave Team
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 pb-5">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 mb-4">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">
                                        Team Name
                                    </p>
                                    <p className="text-2xl font-black text-emerald-800">
                                        {data.membership.teamName}
                                    </p>
                                    {data.membership.approvedAt && (
                                        <p className="text-xs text-slate-400 mt-1">
                                            Member since{' '}
                                            {new Date(data.membership.approvedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                {/* Leader */}
                                {data.leader && (
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                                            Team Leader
                                        </p>
                                        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
                                            <Avatar
                                                src={data.leader.image ?? undefined}
                                                name={data.leader.name ?? data.leader.email}
                                                size="sm"
                                                className="shrink-0 bg-emerald-100 text-emerald-800"
                                            />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800 truncate">
                                                    {data.leader.name ?? '—'}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {data.leader.email}
                                                </p>
                                            </div>
                                            <Chip size="sm" color="success" variant="flat" className="ml-auto shrink-0">
                                                Leader
                                            </Chip>
                                        </div>
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* ── Team Roster ────────────────────────────────────── */}
                        <Card className="rounded-2xl bg-white/80 shadow-lg border border-white/20">
                            <CardHeader className="px-6 pt-5 pb-2">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-emerald-600" />
                                    <h2 className="text-lg font-black text-slate-800">Team Roster</h2>
                                    <Chip size="sm" color="success" variant="flat">
                                        {data.teammates.length} peer{data.teammates.length !== 1 ? 's' : ''}
                                    </Chip>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 pb-5">
                                {data.teammates.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                        <p className="font-medium">No other members yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {data.teammates.map((teammate) => (
                                            <div
                                                key={teammate.userId}
                                                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                                            >
                                                <Avatar
                                                    src={teammate.image ?? undefined}
                                                    name={teammate.name ?? teammate.email}
                                                    size="sm"
                                                    className="shrink-0 bg-emerald-100 text-emerald-800"
                                                />
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-800 truncate">
                                                        {teammate.name ?? '—'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {teammate.email}
                                                    </p>
                                                </div>
                                                {teammate.approvedAt && (
                                                    <p className="ml-auto text-xs text-slate-400 hidden sm:block shrink-0">
                                                        Joined{' '}
                                                        {new Date(teammate.approvedAt).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* ── Screenings Inbox ───────────────────────────────── */}
                        <Card className="rounded-2xl bg-white/80 shadow-lg border border-white/20">
                            <CardHeader className="px-6 pt-5 pb-2">
                                <div className="flex items-center gap-2">
                                    <CalendarClock className="w-5 h-5 text-emerald-600" />
                                    <h2 className="text-lg font-black text-slate-800">Screenings Inbox</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 pb-5">
                                {/* Tab bar */}
                                <div className="flex gap-1 mb-4 bg-slate-100 rounded-xl p-1">
                                    {(
                                        [
                                            { key: 'active', label: 'Active', count: activeScreenings.length },
                                            { key: 'pending', label: 'Pending', count: pendingScreenings.length },
                                            { key: 'past', label: 'Past', count: pastScreenings.length },
                                        ] as const
                                    ).map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setInboxTab(tab.key)}
                                            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                                                inboxTab === tab.key
                                                    ? 'bg-white text-emerald-700 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            {tab.label}
                                            {tab.count > 0 && (
                                                <span
                                                    className={`rounded-full px-1.5 py-0.5 text-xs ${
                                                        inboxTab === tab.key
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-slate-200 text-slate-500'
                                                    }`}
                                                >
                                                    {tab.count}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {screeningsLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2].map((i) => (
                                            <Skeleton key={i} className="h-16 w-full rounded-xl" />
                                        ))}
                                    </div>
                                ) : tabScreenings.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400">
                                        <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                        <p className="font-medium">
                                            No {inboxTab} screenings.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {tabScreenings.map((s) => (
                                            <div
                                                key={s.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Chip
                                                        size="sm"
                                                        color={SCREENING_TYPE_COLORS[s.screeningType]}
                                                        variant="flat"
                                                        className="shrink-0"
                                                    >
                                                        {SCREENING_TYPE_LABELS[s.screeningType]}
                                                    </Chip>
                                                    <div className="min-w-0 text-sm text-slate-600">
                                                        <span className="font-medium">Opens:</span>{' '}
                                                        {new Date(s.validDate).toLocaleString()}
                                                        {' · '}
                                                        <span className="font-medium">Closes:</span>{' '}
                                                        {new Date(s.dueDate).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                    {s.hasSubmitted ? (
                                                        <Chip
                                                            size="sm"
                                                            color="success"
                                                            variant="flat"
                                                            startContent={<CheckCircle2 className="w-3 h-3" />}
                                                        >
                                                            Submitted
                                                        </Chip>
                                                    ) : s.windowStatus === 'active' ? (
                                                        <Button
                                                            size="sm"
                                                            color="success"
                                                            startContent={<Heart className="w-3.5 h-3.5" />}
                                                            onPress={() => setShowQuestionnaire(true)}
                                                        >
                                                            Submit Now
                                                        </Button>
                                                    ) : s.windowStatus === 'pending' ? (
                                                        <Chip size="sm" color="default" variant="flat" startContent={<Clock className="w-3 h-3" />}>
                                                            Not open yet
                                                        </Chip>
                                                    ) : (
                                                        <Chip size="sm" color="default" variant="flat">
                                                            Missed
                                                        </Chip>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                    </div>
                )}
            </div>

            {/* ── Leave Team Modal ─────────────────────────────────────────── */}
            <Modal isOpen={isLeaveOpen} onOpenChange={onLeaveOpenChange} size="sm">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="text-slate-800">Leave Team</ModalHeader>
                            <ModalBody>
                                <p className="text-slate-600 text-sm">
                                    Are you sure you want to leave{' '}
                                    <strong>{data?.membership.teamName}</strong>? You will lose
                                    access to team screenings and will need to rejoin or apply to
                                    a new team.
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="danger"
                                    isLoading={leaving}
                                    onPress={handleLeaveTeam}
                                >
                                    Leave Team
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* ── Health Assessment Modal ──────────────────────────────────── */}
            {showQuestionnaire && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="bg-white shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <CardHeader className="pb-4 border-b border-slate-200">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                                        <Heart className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                                            Health Assessment
                                        </h2>
                                        <p className="text-slate-600 text-sm">
                                            Complete your wellness evaluation
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    isIconOnly
                                    variant="light"
                                    onPress={() => setShowQuestionnaire(false)}
                                    className="hover:bg-red-100"
                                    aria-label="Close"
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
                                onClose={() => setShowQuestionnaire(false)}
                                openSuccessModal={() => {
                                    setShowQuestionnaire(false);
                                    setShowRecommendations(true);
                                    // Refresh screenings so submitted status updates
                                    queryClient.invalidateQueries({
                                        queryKey: ['misalud-member-screenings'],
                                    });
                                }}
                                approvedTeamName={data?.membership.teamName}
                                handleRecommendations={handleRecommendations}
                            />
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* ── Recommendations Modal ────────────────────────────────────── */}
            <RecommendationsModal
                open={showRecommendations}
                onClose={() => setShowRecommendations(false)}
                recommendations={recommendations}
                formData={assessmentFormData}
            />
        </div>
    );
}
