'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from 'next-auth';
import {
    Card, CardBody, CardHeader,
    Button, Chip, Skeleton, Avatar,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    useDisclosure, Select, SelectItem,
} from '@heroui/react';
import {
    Users, Clock3, CheckCircle2, XCircle,
    Copy, Check, Trash2, ShieldCheck,
    Plus, CalendarClock, Calendar, ChevronRight,
} from 'lucide-react';
import MiSaludScreeningReportModal from '@/components/misalud/MiSaludScreeningReportModal';

// ─── Types ───────────────────────────────────────────────────────────────────

type Member = {
    membershipId: string;
    userId: string;
    name: string | null;
    email: string;
    image: string | null;
    approvedAt: string | null;
};

type PendingRequest = {
    id: string;
    fullName: string;
    age: number;
    address: string;
    createdAt: string;
};

type ScreeningSchedule = {
    id: string;
    screeningType: 'PRE_DEPLOYMENT' | 'DURING_DEPLOYMENT' | 'POST_DEPLOYMENT';
    validDate: string;
    dueDate: string;
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    createdAt: string;
};

type DashboardData = {
    team: { id: string; name: string; code: string; createdAt: string };
    members: Member[];
    pendingRequests: PendingRequest[];
};

// ─── Constants ───────────────────────────────────────────────────────────────

const SCREENING_TYPE_LABELS: Record<ScreeningSchedule['screeningType'], string> = {
    PRE_DEPLOYMENT: 'Pre-Deployment',
    DURING_DEPLOYMENT: 'During Deployment',
    POST_DEPLOYMENT: 'Post-Deployment',
};

const SCREENING_TYPE_COLORS: Record<
    ScreeningSchedule['screeningType'],
    'primary' | 'warning' | 'success'
> = {
    PRE_DEPLOYMENT: 'primary',
    DURING_DEPLOYMENT: 'warning',
    POST_DEPLOYMENT: 'success',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toLocalDatetimeValue(date: Date) {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
    session: Session | null;
}

export default function MiSaludLeaderDashboard({ session: _session }: Props) {
    const queryClient = useQueryClient();

    // remove-member modal
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // create-screening modal
    const {
        isOpen: isScheduleOpen,
        onOpen: onScheduleOpen,
        onOpenChange: onScheduleOpenChange,
    } = useDisclosure();
    const [screeningType, setScreeningType] = useState<string>('PRE_DEPLOYMENT');
    const [validDate, setValidDate] = useState(() => toLocalDatetimeValue(new Date()));
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setHours(d.getHours() + 24);
        return toLocalDatetimeValue(d);
    });
    const [schedulingLoading, setSchedulingLoading] = useState(false);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
    const [isReportOpen, setIsReportOpen] = useState(false);

    // ── Queries ──────────────────────────────────────────────────────────────

    const { data, isLoading, error } = useQuery<DashboardData>({
        queryKey: ['misalud-leader-dashboard'],
        queryFn: async () => {
            const res = await fetch('/api/misalud/leader/dashboard');
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error ?? `Error ${res.status}`);
            }
            return res.json();
        },
        retry: 1,
        staleTime: 2 * 60 * 1000,
    });

    const { data: schedulesData, isLoading: schedulesLoading } = useQuery<{
        schedules: ScreeningSchedule[];
    }>({
        queryKey: ['misalud-leader-screenings'],
        queryFn: async () => {
            const res = await fetch('/api/misalud/leader/screenings');
            if (!res.ok) throw new Error('Failed to load screenings');
            return res.json();
        },
        staleTime: 2 * 60 * 1000,
    });

    // ── Handlers ─────────────────────────────────────────────────────────────

    const copyCode = () => {
        if (!data?.team.code) return;
        navigator.clipboard.writeText(data.team.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const confirmRemove = (member: Member) => {
        setSelectedMember(member);
        onOpen();
    };

    const handleRemove = async () => {
        if (!selectedMember) return;
        setProcessingId(selectedMember.membershipId);
        try {
            const res = await fetch(
                `/api/misalud/leader/members/${selectedMember.membershipId}`,
                { method: 'DELETE' }
            );
            if (!res.ok) throw new Error('Failed to remove member');
            await queryClient.invalidateQueries({ queryKey: ['misalud-leader-dashboard'] });
            onOpenChange();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setProcessingId(null);
            setSelectedMember(null);
        }
    };

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch(`/api/misalud/leader/requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'APPROVE' }),
            });
            if (!res.ok) throw new Error('Failed to approve');
            await queryClient.invalidateQueries({ queryKey: ['misalud-leader-dashboard'] });
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to approve');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt('Rejection reason (optional):');
        setProcessingId(id);
        try {
            const res = await fetch(`/api/misalud/leader/requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'REJECT', rejectionReason: reason || undefined }),
            });
            if (!res.ok) throw new Error('Failed to reject');
            await queryClient.invalidateQueries({ queryKey: ['misalud-leader-dashboard'] });
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to reject');
        } finally {
            setProcessingId(null);
        }
    };

    const handleValidDateChange = (val: string) => {
        setValidDate(val);
        if (val) {
            const d = new Date(val);
            d.setHours(d.getHours() + 24);
            setDueDate(toLocalDatetimeValue(d));
        }
    };

    const handleCreateScreening = async (onClose: () => void) => {
        setSchedulingLoading(true);
        try {
            const res = await fetch('/api/misalud/leader/screenings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    screeningType,
                    validDate: new Date(validDate).toISOString(),
                    dueDate: new Date(dueDate).toISOString(),
                }),
            });
            if (!res.ok) throw new Error('Failed to create screening');
            await queryClient.invalidateQueries({ queryKey: ['misalud-leader-screenings'] });
            onClose();
            // reset form
            setScreeningType('PRE_DEPLOYMENT');
            setValidDate(toLocalDatetimeValue(new Date()));
            const next = new Date();
            next.setHours(next.getHours() + 24);
            setDueDate(toLocalDatetimeValue(next));
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to create screening');
        } finally {
            setSchedulingLoading(false);
        }
    };

    const openScreeningReport = (scheduleId: string) => {
        setSelectedScheduleId(scheduleId);
        setIsReportOpen(true);
    };

    const closeScreeningReport = () => {
        setIsReportOpen(false);
        setSelectedScheduleId(null);
    };

    return (
        <div className="min-h-screen bg-emerald-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">

                {/* Header — no back button (already on Mi Salud) */}
                <Card className="mb-8 overflow-hidden rounded-[28px] border border-white/20 shadow-lg">
                    <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-black text-white mb-1">
                                    Team Leader Dashboard
                                </h1>
                                <p className="text-white/80">
                                    {isLoading ? '...' : data?.team.name ?? 'Your Mi Salud Team'}
                                </p>
                            </div>
                            <Button
                                onPress={onScheduleOpen}
                                className="shrink-0 bg-[#483519] hover:bg-white/30 text-white font-semibold rounded-xl border border-white/20"
                                startContent={<Plus className="w-4 h-4" />}
                            >
                                Create Screening
                            </Button>
                        </div>
                    </div>
                </Card>

                {isLoading ? (
                    <div className="space-y-6">
                        {[1, 2].map((i) => (
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
                        <CardBody className="p-12 text-center text-slate-500">
                            <p className="font-semibold text-red-600 mb-1">Failed to load dashboard</p>
                            <p className="text-sm">{(error as Error).message}</p>
                        </CardBody>
                    </Card>
                ) : !data ? (
                    <Card className="rounded-2xl bg-white/70 shadow-md">
                        <CardBody className="p-12 text-center text-slate-500">
                            No team data available. Make sure your Team Leader status is approved.
                        </CardBody>
                    </Card>
                ) : (
                    <div className="space-y-6">

                        {/* Team Code Widget */}
                        <Card className="rounded-2xl bg-white/80 shadow-lg border border-white/20">
                            <CardHeader className="px-6 pt-5 pb-2">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                    <h2 className="text-lg font-black text-slate-800">Active Team Code</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 pb-5">
                                <p className="text-sm text-slate-500 mb-3">
                                    Share this code with your team members so they can find and join your team.
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-emerald-50 border-2 border-emerald-200 rounded-2xl px-6 py-4">
                                        <span className="text-3xl font-black tracking-[0.3em] text-emerald-800">
                                            {data.team.code}
                                        </span>
                                    </div>
                                    <Button
                                        onPress={copyCode}
                                        className="h-14 px-5 rounded-2xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                                        startContent={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    >
                                        {copied ? 'Copied!' : 'Copy'}
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    Team: <span className="font-semibold text-slate-600">{data.team.name}</span>
                                    {' · '}Created {new Date(data.team.createdAt).toLocaleDateString()}
                                </p>
                            </CardBody>
                        </Card>

                        {/* Pending Join Requests */}
                        {data.pendingRequests.length > 0 && (
                            <Card className="rounded-2xl bg-white/80 shadow-lg border border-amber-200">
                                <CardHeader className="px-6 pt-5 pb-2">
                                    <div className="flex items-center gap-2">
                                        <Clock3 className="w-5 h-5 text-amber-500" />
                                        <h2 className="text-lg font-black text-slate-800">
                                            Pending Join Requests
                                        </h2>
                                        <Chip size="sm" color="warning" variant="flat">
                                            {data.pendingRequests.length}
                                        </Chip>
                                    </div>
                                </CardHeader>
                                <CardBody className="px-6 pb-5 space-y-3">
                                    {data.pendingRequests.map((req) => (
                                        <div
                                            key={req.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4"
                                        >
                                            <div>
                                                <p className="font-bold text-slate-800">{req.fullName}</p>
                                                <p className="text-sm text-slate-500">
                                                    Age {req.age} · {req.address}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <Button
                                                    size="sm"
                                                    color="danger"
                                                    variant="flat"
                                                    startContent={<XCircle className="w-3.5 h-3.5" />}
                                                    isDisabled={processingId === req.id}
                                                    onPress={() => handleReject(req.id)}
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    color="success"
                                                    startContent={<CheckCircle2 className="w-3.5 h-3.5" />}
                                                    isLoading={processingId === req.id}
                                                    onPress={() => handleApprove(req.id)}
                                                >
                                                    Approve
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardBody>
                            </Card>
                        )}

                        {/* Team Roster */}
                        <Card className="rounded-2xl bg-white/80 shadow-lg border border-white/20">
                            <CardHeader className="px-6 pt-5 pb-2">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-emerald-600" />
                                    <h2 className="text-lg font-black text-slate-800">Team Roster</h2>
                                    <Chip size="sm" color="success" variant="flat">
                                        {data.members.length} member{data.members.length !== 1 ? 's' : ''}
                                    </Chip>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 pb-5">
                                {data.members.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400">
                                        <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                        <p className="font-medium">No team members yet.</p>
                                        <p className="text-sm mt-1">Share your team code to get members to join.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {data.members.map((member) => (
                                            <div
                                                key={member.membershipId}
                                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Avatar
                                                        src={member.image ?? undefined}
                                                        name={member.name ?? member.email}
                                                        size="sm"
                                                        className="shrink-0 bg-emerald-100 text-emerald-800"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-800 truncate">
                                                            {member.name ?? '—'}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">{member.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {member.approvedAt && (
                                                        <p className="text-xs text-slate-400 hidden sm:block">
                                                            Joined {new Date(member.approvedAt).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        color="danger"
                                                        variant="flat"
                                                        isIconOnly
                                                        onPress={() => confirmRemove(member)}
                                                        aria-label="Remove member"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {/* Screening Schedules & Well-being Reports */}
                        <Card className="rounded-2xl bg-white/80 shadow-lg border border-white/20">
                            <CardHeader className="px-6 pt-5 pb-2">
                                <div className="flex items-center justify-between w-full">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <CalendarClock className="w-5 h-5 text-emerald-600" />
                                            <h2 className="text-lg font-black text-slate-800">
                                                Screening Schedules
                                            </h2>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Tap a schedule to open the team well-being report.
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardBody className="px-6 pb-5">
                                {schedulesLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2].map((i) => (
                                            <Skeleton key={i} className="h-16 w-full rounded-xl" />
                                        ))}
                                    </div>
                                ) : !schedulesData?.schedules.length ? (
                                    <div className="text-center py-10 text-slate-400">
                                        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                        <p className="font-medium">No active schedules.</p>
                                        <p className="text-sm mt-1">Use the + button to create a screening window.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {schedulesData.schedules.map((s) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => openScreeningReport(s.id)}
                                                className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-left transition-colors hover:bg-emerald-50/80 hover:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                                                    <Chip
                                                        size="sm"
                                                        color={
                                                            s.status === 'ACTIVE'
                                                                ? 'success'
                                                                : s.status === 'EXPIRED'
                                                                ? 'default'
                                                                : 'danger'
                                                        }
                                                        variant="dot"
                                                    >
                                                        {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                                                    </Chip>
                                                    <ChevronRight className="w-4 h-4 text-emerald-600" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                    </div>
                )}
            </div>

            <MiSaludScreeningReportModal
                scheduleId={selectedScheduleId}
                isOpen={isReportOpen}
                onClose={closeScreeningReport}
            />

            {/* Create Screening Modal */}
            <Modal isOpen={isScheduleOpen} onOpenChange={onScheduleOpenChange} size="md">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="text-slate-800 flex items-center gap-2">
                                <CalendarClock className="w-5 h-5 text-emerald-600" />
                                Create Screening Schedule
                            </ModalHeader>
                            <ModalBody className="space-y-4 pb-2">
                                {/* Screening Type */}
                                <Select
                                    label="Screening Type"
                                    selectedKeys={[screeningType]}
                                    onSelectionChange={(keys) => {
                                        const val = Array.from(keys)[0] as string;
                                        if (val) setScreeningType(val);
                                    }}
                                    classNames={{ trigger: 'rounded-xl' }}
                                >
                                    <SelectItem key="PRE_DEPLOYMENT">
                                        Pre-Deployment (Before operation)
                                    </SelectItem>
                                    <SelectItem key="DURING_DEPLOYMENT">
                                        During Deployment (Mid-shift/active operations)
                                    </SelectItem>
                                    <SelectItem key="POST_DEPLOYMENT">
                                        Post-Deployment (Post-operation/demobilization)
                                    </SelectItem>
                                </Select>

                                {/* Valid Date */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Valid Date <span className="text-slate-400 font-normal">(screening opens)</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={validDate}
                                        onChange={(e) => handleValidDateChange(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Due Date <span className="text-slate-400 font-normal">(screening locks/expires)</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Defaults to 24 hours after the valid date.</p>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose} isDisabled={schedulingLoading}>
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-emerald-600 text-white"
                                    isLoading={schedulingLoading}
                                    onPress={() => handleCreateScreening(onClose)}
                                >
                                    Create
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Remove Member Confirmation Modal */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="text-red-700">Remove Member</ModalHeader>
                            <ModalBody>
                                <p className="text-slate-700">
                                    Are you sure you want to remove{' '}
                                    <span className="font-bold">
                                        {selectedMember?.name ?? selectedMember?.email}
                                    </span>{' '}
                                    from the team? They will need to re-apply to rejoin.
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose}>Cancel</Button>
                                <Button
                                    color="danger"
                                    isLoading={!!processingId}
                                    onPress={handleRemove}
                                >
                                    Remove
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
