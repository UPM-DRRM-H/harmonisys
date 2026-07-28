'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Avatar,
    Button,
    Card,
    CardBody,
    Chip,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Skeleton,
} from '@heroui/react';
import {
    AlertTriangle,
    Eye,
    Home,
    Lock,
    Moon,
    Salad,
    Users,
    X,
} from 'lucide-react';
import { STATUS_BADGE_LABELS, WELLNESS_DOMAINS } from '@/constants';
import { getLeaderRecommendation } from '@/lib/action/misalud';
import type { MemberOverallStatus, Recommendation, WellnessDomainStatus } from '@/types';

type ScreeningSchedule = {
    id: string;
    screeningType: 'PRE_DEPLOYMENT' | 'DURING_DEPLOYMENT' | 'POST_DEPLOYMENT';
    validDate: string;
    dueDate: string;
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    createdAt: string;
};

type MemberReport = {
    userId: string;
    name: string | null;
    email: string;
    image: string | null;
    hasSubmitted: boolean;
    submissionId: string | null;
    submittedAt: string | null;
    overallStatus: MemberOverallStatus;
    domains: Array<{
        questionId: number;
        key: string;
        label: string;
        status: WellnessDomainStatus;
        selectedOption: string | null;
    }>;
};

type ScreeningReport = {
    schedule: ScreeningSchedule;
    team: { id: string; name: string };
    summary: {
        totalMembers: number;
        respondedCount: number;
        pendingCount: number;
        readyCount: number;
        actionRecommendedCount: number;
        urgentCount: number;
    };
    members: MemberReport[];
};

const SCREENING_TYPE_LABELS: Record<ScreeningSchedule['screeningType'], string> = {
    PRE_DEPLOYMENT: 'Pre-Deployment',
    DURING_DEPLOYMENT: 'During Deployment',
    POST_DEPLOYMENT: 'Post-Deployment',
};

const DOMAIN_ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
    1: Moon,
    2: Salad,
    3: Home,
    4: Eye,
    5: Users,
};

const OVERALL_STATUS_CONFIG: Record<
    MemberOverallStatus,
    { label: string; color: 'default' | 'success' | 'warning' | 'danger' }
> = {
    ready: { label: STATUS_BADGE_LABELS.green, color: 'success' },
    action: { label: STATUS_BADGE_LABELS.yellow, color: 'warning' },
    urgent: { label: STATUS_BADGE_LABELS.red, color: 'danger' },
    pending: { label: STATUS_BADGE_LABELS.pending, color: 'default' },
};

const DOMAIN_STATUS_STYLES: Record<WellnessDomainStatus, string> = {
    green: 'bg-emerald-100 border-emerald-300 text-emerald-700',
    yellow: 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200 cursor-pointer',
    red: 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200 cursor-pointer',
    pending: 'bg-slate-100 border-slate-200 text-slate-400',
};

type SelectedAction = {
    memberName: string;
    domainLabel: string;
    recommendation: Recommendation;
};

interface Props {
    scheduleId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function MiSaludScreeningReportModal({ scheduleId, isOpen, onClose }: Props) {
    const [selectedAction, setSelectedAction] = useState<SelectedAction | null>(null);

    const { data, isLoading, error } = useQuery<ScreeningReport>({
        queryKey: ['misalud-screening-report', scheduleId],
        queryFn: async () => {
            const res = await fetch(`/api/misalud/leader/screenings/${scheduleId}/report`);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error ?? 'Failed to load screening report');
            }
            return res.json();
        },
        enabled: isOpen && !!scheduleId,
        staleTime: 60 * 1000,
    });

    const handleClose = () => {
        setSelectedAction(null);
        onClose();
    };

    const handleDomainPress = (
        member: MemberReport,
        domain: MemberReport['domains'][number]
    ) => {
        if (domain.status !== 'yellow' && domain.status !== 'red') return;

        const recommendation = getLeaderRecommendation(domain.questionId, domain.status);
        if (!recommendation) return;

        setSelectedAction({
            memberName: member.name ?? member.email,
            domainLabel: domain.label,
            recommendation,
        });
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                size="5xl"
                scrollBehavior="inside"
                classNames={{
                    base: 'max-h-[95vh]',
                    backdrop: 'bg-black/60 backdrop-blur-sm',
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1 border-b border-slate-100 pb-4">
                        <span className="text-xl font-black text-emerald-800">
                            Team Well-being Report
                        </span>
                        {data && (
                            <span className="text-sm font-normal text-slate-500">
                                {SCREENING_TYPE_LABELS[data.schedule.screeningType]} ·{' '}
                                {data.team.name}
                            </span>
                        )}
                    </ModalHeader>

                    <ModalBody className="py-5 gap-5">
                        {/* Data Privacy Disclaimer */}
                        <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
                            <CardBody className="p-4 flex items-start gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                                    <Lock className="w-4 h-4 text-blue-700" />
                                </div>
                                <div>
                                    <p className="font-bold text-blue-900 text-sm mb-1">
                                        Confidential Wellness Data
                                    </p>
                                    <p className="text-sm text-blue-800 leading-relaxed">
                                        This report contains sensitive health and well-being
                                        information about your team members. Use it only for
                                        authorized leadership support. Do not share, copy, or
                                        discuss individual results outside approved channels.
                                        Follow your organization&apos;s data protection and
                                        privacy policies at all times.
                                    </p>
                                </div>
                            </CardBody>
                        </Card>

                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-full rounded-xl" />
                                <Skeleton className="h-64 w-full rounded-xl" />
                            </div>
                        ) : error ? (
                            <Card className="border border-red-100 bg-red-50">
                                <CardBody className="p-6 text-center text-red-700">
                                    {(error as Error).message}
                                </CardBody>
                            </Card>
                        ) : data ? (
                            <>
                                {/* Screening window + summary */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <Card className="border border-slate-100 bg-slate-50/80">
                                        <CardBody className="p-4 text-sm text-slate-600 space-y-1">
                                            <p>
                                                <span className="font-semibold text-slate-800">
                                                    Window:
                                                </span>{' '}
                                                {new Date(data.schedule.validDate).toLocaleString()}{' '}
                                                – {new Date(data.schedule.dueDate).toLocaleString()}
                                            </p>
                                            <p>
                                                <span className="font-semibold text-slate-800">
                                                    Status:
                                                </span>{' '}
                                                {data.schedule.status.charAt(0) +
                                                    data.schedule.status.slice(1).toLowerCase()}
                                            </p>
                                            <p>
                                                <span className="font-semibold text-slate-800">
                                                    Responses:
                                                </span>{' '}
                                                {data.summary.respondedCount} of{' '}
                                                {data.summary.totalMembers} members
                                            </p>
                                        </CardBody>
                                    </Card>

                                    <div className="flex flex-wrap gap-2 items-center">
                                        <Chip color="success" variant="flat">
                                            🟢 {data.summary.readyCount} Ready to Work
                                        </Chip>
                                        <Chip color="warning" variant="flat">
                                            🟡 {data.summary.actionRecommendedCount} Action
                                            Recommended
                                        </Chip>
                                        <Chip color="danger" variant="flat">
                                            🔴 {data.summary.urgentCount} Urgent Support
                                        </Chip>
                                        {data.summary.pendingCount > 0 && (
                                            <Chip variant="flat">
                                                {data.summary.pendingCount} Awaiting Response
                                            </Chip>
                                        )}
                                    </div>
                                </div>

                                {/* 5-Domain Indicator Matrix */}
                                <div>
                                    <h3 className="text-base font-black text-slate-800 mb-3">
                                        5-Domain Indicator Matrix
                                    </h3>

                                    {data.members.length === 0 ? (
                                        <Card className="border border-dashed border-slate-200">
                                            <CardBody className="p-8 text-center text-slate-500">
                                                No team members have joined yet. Results will
                                                appear here once members submit screenings.
                                            </CardBody>
                                        </Card>
                                    ) : (
                                        <div className="overflow-x-auto rounded-2xl border border-slate-100">
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr className="bg-emerald-50/80 text-slate-700">
                                                        <th className="text-left px-4 py-3 font-bold min-w-[180px]">
                                                            Member
                                                        </th>
                                                        {WELLNESS_DOMAINS.map((domain) => {
                                                            const Icon =
                                                                DOMAIN_ICONS[domain.id] ?? Moon;
                                                            return (
                                                                <th
                                                                    key={domain.id}
                                                                    className="px-2 py-3 text-center font-semibold min-w-[88px]"
                                                                >
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <Icon className="w-4 h-4 text-emerald-700" />
                                                                        <span className="text-xs">
                                                                            {domain.label}
                                                                        </span>
                                                                    </div>
                                                                </th>
                                                            );
                                                        })}
                                                        <th className="px-4 py-3 text-left font-bold min-w-[140px]">
                                                            Overall
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.members.map((member) => {
                                                        const overall =
                                                            OVERALL_STATUS_CONFIG[
                                                                member.overallStatus
                                                            ];

                                                        return (
                                                            <tr
                                                                key={member.userId}
                                                                className="border-t border-slate-100 bg-white/70"
                                                            >
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <Avatar
                                                                            src={
                                                                                member.image ??
                                                                                undefined
                                                                            }
                                                                            name={
                                                                                member.name ??
                                                                                member.email
                                                                            }
                                                                            size="sm"
                                                                            className="shrink-0"
                                                                        />
                                                                        <div className="min-w-0">
                                                                            <p className="font-semibold text-slate-800 truncate">
                                                                                {member.name ?? '—'}
                                                                            </p>
                                                                            {!member.hasSubmitted && (
                                                                                <p className="text-xs text-slate-400">
                                                                                    No submission
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {member.domains.map((domain) => {
                                                                    const Icon =
                                                                        DOMAIN_ICONS[
                                                                            domain.questionId
                                                                        ] ?? Moon;
                                                                    const isActionable =
                                                                        domain.status ===
                                                                            'yellow' ||
                                                                        domain.status === 'red';

                                                                    return (
                                                                        <td
                                                                            key={domain.questionId}
                                                                            className="px-2 py-3 text-center"
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                disabled={
                                                                                    !isActionable
                                                                                }
                                                                                onClick={() =>
                                                                                    handleDomainPress(
                                                                                        member,
                                                                                        domain
                                                                                    )
                                                                                }
                                                                                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${DOMAIN_STATUS_STYLES[domain.status]} ${!isActionable ? 'cursor-default' : ''}`}
                                                                                title={
                                                                                    isActionable
                                                                                        ? `View ${domain.label} recommendations`
                                                                                        : domain.status ===
                                                                                            'green'
                                                                                          ? STATUS_BADGE_LABELS.green
                                                                                          : STATUS_BADGE_LABELS.pending
                                                                                }
                                                                                aria-label={`${member.name ?? member.email} — ${domain.label}: ${domain.status}`}
                                                                            >
                                                                                <Icon className="w-4 h-4" />
                                                                            </button>
                                                                        </td>
                                                                    );
                                                                })}

                                                                <td className="px-4 py-3">
                                                                    <Chip
                                                                        size="sm"
                                                                        color={overall.color}
                                                                        variant="flat"
                                                                    >
                                                                        {overall.label}
                                                                    </Chip>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    <p className="text-xs text-slate-500 mt-3">
                                        Tap any 🟡 or 🔴 domain icon to view step-by-step
                                        leadership recommendations for that member.
                                    </p>
                                </div>
                            </>
                        ) : null}
                    </ModalBody>

                    <ModalFooter className="border-t border-slate-100">
                        <Button variant="light" onPress={handleClose}>
                            Close Report
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Actionable Recommendation Card */}
            <Modal
                isOpen={!!selectedAction}
                onClose={() => setSelectedAction(null)}
                size="lg"
                scrollBehavior="inside"
            >
                <ModalContent>
                    {(onActionClose) => (
                        <>
                            <ModalHeader className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-lg font-black text-slate-800">
                                        Leadership Recommendations
                                    </p>
                                    {selectedAction && (
                                        <p className="text-sm font-normal text-slate-500 mt-1">
                                            {selectedAction.memberName} ·{' '}
                                            {selectedAction.domainLabel}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    isIconOnly
                                    variant="light"
                                    onPress={onActionClose}
                                    aria-label="Close recommendations"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </ModalHeader>
                            <ModalBody className="gap-4">
                                {selectedAction && (
                                    <>
                                        <Chip
                                            color={
                                                selectedAction.recommendation.category === 'red'
                                                    ? 'danger'
                                                    : 'warning'
                                            }
                                            variant="flat"
                                            startContent={
                                                selectedAction.recommendation.category === 'red' ? (
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                ) : undefined
                                            }
                                        >
                                            {selectedAction.recommendation.category === 'red'
                                                ? STATUS_BADGE_LABELS.red
                                                : STATUS_BADGE_LABELS.yellow}
                                        </Chip>

                                        <Card
                                            className={`border ${
                                                selectedAction.recommendation.category === 'red'
                                                    ? 'border-red-200 bg-red-50/60'
                                                    : 'border-amber-200 bg-amber-50/60'
                                            }`}
                                        >
                                            <CardBody className="p-4">
                                                <h4 className="font-bold text-slate-800 mb-3">
                                                    {selectedAction.recommendation.title}
                                                </h4>
                                                <ol className="space-y-3">
                                                    {selectedAction.recommendation.items.map(
                                                        (item, index) => (
                                                            <li
                                                                key={index}
                                                                className="flex gap-3 text-sm text-slate-700 leading-relaxed"
                                                            >
                                                                <span className="font-bold text-emerald-700 shrink-0">
                                                                    {index + 1}.
                                                                </span>
                                                                <span>{item}</span>
                                                            </li>
                                                        )
                                                    )}
                                                </ol>
                                            </CardBody>
                                        </Card>
                                    </>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    color="success"
                                    className="bg-emerald-600 text-white"
                                    onPress={onActionClose}
                                >
                                    Acknowledged
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
