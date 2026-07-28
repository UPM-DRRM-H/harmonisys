'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from 'next-auth';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Skeleton,
    Tabs,
    Tab,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Textarea,
    Input,
    Select,
    SelectItem,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import {
    CheckCircle2,
    XCircle,
    Users,
    Clock3,
    HeartPulse,
    ClipboardList,
    Trash2,
    Edit3,
    Save,
} from 'lucide-react';

type MiSaludRequest = {
    id: string;
    fullName: string;
    age: number;
    address: string;
    requestedRole: 'TEAM_LEADER' | 'TEAM_MEMBER';
    teamName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewLevel: 'ADMIN' | 'TEAM_LEADER';
    createdAt: string;
    rejectionReason?: string | null;
};

type MiSaludUserRow = {
    id: string;
    userId: string;
    name: string | null;
    email: string;
    teamName: string;
    miSaludRole: 'TEAM_LEADER' | 'TEAM_MEMBER';
    membershipStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedAt: string | null;
    createdAt: string;
    latestRequestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
    latestRequestRole: 'TEAM_LEADER' | 'TEAM_MEMBER' | null;
};

type MiSaludSubmissionRow = {
    id: string;
    userId: string;
    name: string;
    email: string;
    team: string;
    assessmentDate: string;
    submittedAt: string;
    totalAnswers: number;
};

interface Props {
    session: Session | null;
}

const formatDate = (value?: string | null) => {
    if (!value) return '—';

    return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const MiSaludAdminRequestsClient = ({ session }: Props) => {
    const router = useRouter();

    const [selectedTab, setSelectedTab] = useState('requests');

    const queryClient = useQueryClient();

    const refreshAdminData = async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: ['misalud-admin-requests'],
            }),
            queryClient.invalidateQueries({
                queryKey: ['misalud-admin-users'],
            }),
            queryClient.invalidateQueries({
                queryKey: ['misalud-admin-submissions'],
            }),
        ]);
    };

    const { data: requests = [], isLoading: loadingRequests } = useQuery<
        MiSaludRequest[]
    >({
        queryKey: ['misalud-admin-requests'],
        queryFn: async () => {
            const response = await fetch('/api/misalud/admin/requests');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch requests');
            }

            return result.requests || [];
        },
        staleTime: 2 * 60 * 1000,
    });

    const { data: users = [], isLoading: loadingUsers } = useQuery<
        MiSaludUserRow[]
    >({
        queryKey: ['misalud-admin-users'],
        queryFn: async () => {
            const response = await fetch('/api/misalud/admin/users');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch users');
            }

            return result.users || [];
        },
        staleTime: 2 * 60 * 1000,
    });

    const { data: submissions = [], isLoading: loadingSubmissions } = useQuery<
        MiSaludSubmissionRow[]
    >({
        queryKey: ['misalud-admin-submissions'],
        queryFn: async () => {
            const response = await fetch('/api/misalud/admin/submissions');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch submissions');
            }

            return result.submissions || [];
        },
        staleTime: 2 * 60 * 1000,
    });

    const [processingId, setProcessingId] = useState<string | null>(null);

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedRejectId, setSelectedRejectId] = useState<string | null>(
        null
    );
    const [rejectionReason, setRejectionReason] = useState('');

    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState<
        'ALL' | 'TEAM_LEADER' | 'TEAM_MEMBER'
    >('ALL');

    const [editingTeamUserId, setEditingTeamUserId] = useState<string | null>(
        null
    );
    const [editedTeamName, setEditedTeamName] = useState('');

    const [deleteUserModalOpen, setDeleteUserModalOpen] = useState(false);
    const [selectedDeleteUser, setSelectedDeleteUser] =
        useState<MiSaludUserRow | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
    const [updatingTeamUserId, setUpdatingTeamUserId] = useState<string | null>(
        null
    );

    const [submissionSearchQuery, setSubmissionSearchQuery] = useState('');
    const [submissionTeamFilter, setSubmissionTeamFilter] = useState('ALL');

    const [deleteSubmissionModalOpen, setDeleteSubmissionModalOpen] =
        useState(false);
    const [selectedDeleteSubmission, setSelectedDeleteSubmission] =
        useState<MiSaludSubmissionRow | null>(null);
    const [deletingSubmissionId, setDeletingSubmissionId] = useState<
        string | null
    >(null);

    const handleApprove = async (id: string) => {
        try {
            setProcessingId(id);

            const res = await fetch(`/api/misalud/admin/requests/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'APPROVE',
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to approve request');
            }

            await refreshAdminData();
        } catch (error) {
            console.error('Approve error:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to approve request'
            );
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (id: string) => {
        setSelectedRejectId(id);
        setRejectionReason('');
        setRejectModalOpen(true);
    };

    const handleUpdateTeamName = async (user: MiSaludUserRow) => {
        try {
            setUpdatingTeamUserId(user.id);

            const res = await fetch(`/api/misalud/admin/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teamName: editedTeamName.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update team name');
            }

            setEditingTeamUserId(null);
            setEditedTeamName('');

            await refreshAdminData();
        } catch (error) {
            console.error('Update team name error:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to update team name'
            );
        } finally {
            setUpdatingTeamUserId(null);
        }
    };

    const openDeleteUserModal = (user: MiSaludUserRow) => {
        setSelectedDeleteUser(user);
        setDeleteUserModalOpen(true);
    };

    const handleDeleteUserConfirm = async () => {
        if (!selectedDeleteUser) return;

        try {
            setDeletingUserId(selectedDeleteUser.id);

            const res = await fetch(
                `/api/misalud/admin/users/${selectedDeleteUser.id}`,
                {
                    method: 'DELETE',
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete Mi Salud user');
            }

            setDeleteUserModalOpen(false);
            setSelectedDeleteUser(null);

            await refreshAdminData();
        } catch (error) {
            console.error('Delete Mi Salud user error:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete Mi Salud user'
            );
        } finally {
            setDeletingUserId(null);
        }
    };

    const handleRejectConfirm = async () => {
        if (!selectedRejectId) return;

        try {
            setProcessingId(selectedRejectId);

            const res = await fetch(
                `/api/misalud/admin/requests/${selectedRejectId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'REJECT',
                        rejectionReason: rejectionReason.trim() || undefined,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to reject request');
            }

            setRejectModalOpen(false);
            setSelectedRejectId(null);
            setRejectionReason('');

            await refreshAdminData();
        } catch (error) {
            console.error('Reject error:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to reject request'
            );
        } finally {
            setProcessingId(null);
        }
    };

    const openDeleteSubmissionModal = (submission: MiSaludSubmissionRow) => {
        setSelectedDeleteSubmission(submission);
        setDeleteSubmissionModalOpen(true);
    };

    const handleDeleteSubmissionConfirm = async () => {
        if (!selectedDeleteSubmission) return;

        try {
            setDeletingSubmissionId(selectedDeleteSubmission.id);

            const res = await fetch(
                `/api/misalud/admin/submissions/${selectedDeleteSubmission.id}`,
                {
                    method: 'DELETE',
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete submission');
            }

            setDeleteSubmissionModalOpen(false);
            setSelectedDeleteSubmission(null);

            await refreshAdminData();
        } catch (error) {
            console.error('Delete submission error:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete submission'
            );
        } finally {
            setDeletingSubmissionId(null);
        }
    };

    const pendingCount = useMemo(
        () => requests.filter((request) => request.status === 'PENDING').length,
        [requests]
    );

    const submissionTeamOptions = useMemo(() => {
        const uniqueTeams = Array.from(
            new Set(
                submissions.map((submission) => submission.team).filter(Boolean)
            )
        ).sort();

        return ['ALL', ...uniqueTeams];
    }, [submissions]);

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesSearch =
                (user.name || '')
                    .toLowerCase()
                    .includes(userSearchQuery.toLowerCase()) ||
                user.email
                    .toLowerCase()
                    .includes(userSearchQuery.toLowerCase()) ||
                user.teamName
                    .toLowerCase()
                    .includes(userSearchQuery.toLowerCase());

            const matchesRole =
                userRoleFilter === 'ALL' || user.miSaludRole === userRoleFilter;

            return matchesSearch && matchesRole;
        });
    }, [users, userSearchQuery, userRoleFilter]);

    const filteredSubmissions = useMemo(() => {
        return submissions.filter((submission) => {
            const matchesSearch =
                submission.name
                    .toLowerCase()
                    .includes(submissionSearchQuery.toLowerCase()) ||
                submission.email
                    .toLowerCase()
                    .includes(submissionSearchQuery.toLowerCase()) ||
                submission.team
                    .toLowerCase()
                    .includes(submissionSearchQuery.toLowerCase());

            const matchesTeam =
                submissionTeamFilter === 'ALL' ||
                submission.team === submissionTeamFilter;

            return matchesSearch && matchesTeam;
        });
    }, [submissions, submissionSearchQuery, submissionTeamFilter]);

    return (
        <>
            <div className="min-h-screen bg-emerald-50">
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <Card className="mb-8 bg-white/70 backdrop-blur-sm shadow-lg border border-white/20 overflow-hidden rounded-[28px]">
                        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600">
                            <div className="p-6">
                                <div>
                                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-2">
                                        Mi Salud Admin
                                    </h1>
                                    <p className="text-white/85 text-lg">
                                        Manage requests, members, and Assess
                                        Health submissions
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Card className="bg-white/80 border border-white/20 shadow-lg rounded-2xl">
                            <CardBody className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-amber-100">
                                        <Clock3 className="w-6 h-6 text-amber-700" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">
                                            Pending Requests
                                        </p>
                                        <p className="text-3xl font-black text-slate-800">
                                            {pendingCount}
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="bg-white/80 border border-white/20 shadow-lg rounded-2xl">
                            <CardBody className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-emerald-100">
                                        <Users className="w-6 h-6 text-emerald-700" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">
                                            Registered Members
                                        </p>
                                        <p className="text-3xl font-black text-slate-800">
                                            {users.length}
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="bg-white/80 border border-white/20 shadow-lg rounded-2xl">
                            <CardBody className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-rose-100">
                                        <HeartPulse className="w-6 h-6 text-rose-700" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">
                                            Assess Health Forms
                                        </p>
                                        <p className="text-3xl font-black text-slate-800">
                                            {submissions.length}
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    <Tabs
                        selectedKey={selectedTab}
                        onSelectionChange={(key) =>
                            setSelectedTab(key as string)
                        }
                        className="mb-8"
                        classNames={{
                            tabList:
                                'bg-white/80 backdrop-blur-xl shadow-xl border border-white/30 p-2',
                            tab: 'font-semibold text-slate-700 data-[selected=true]:text-white',
                            tabContent:
                                'group-data-[selected=true]:text-white group-data-[hover=true]:text-slate-900',
                            cursor: 'bg-gradient-to-r from-emerald-700 to-emerald-600 shadow-lg',
                            panel: 'pt-5',
                        }}
                    >
                        <Tab
                            key="requests"
                            title={
                                <div className="flex items-center gap-2 px-2">
                                    <ClipboardList className="w-5 h-5" />
                                    <span>Pending Leader Requests</span>
                                </div>
                            }
                        >
                            <div className="mb-6 flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-emerald-100">
                                    <Users className="w-6 h-6 text-emerald-700" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        Pending Team Leader Requests
                                    </h2>
                                    <p className="text-slate-600">
                                        Admin approval queue for new Mi Salud
                                        teams
                                    </p>
                                </div>
                            </div>

                            {loadingRequests ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {Array.from({ length: 3 }).map(
                                        (_, index) => (
                                            <Card
                                                key={index}
                                                className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/20 rounded-2xl"
                                            >
                                                <CardBody className="p-6 space-y-4">
                                                    <Skeleton className="w-64 h-6 rounded-lg" />
                                                    <Skeleton className="w-48 h-4 rounded-lg" />
                                                    <Skeleton className="w-full h-20 rounded-xl" />
                                                </CardBody>
                                            </Card>
                                        )
                                    )}
                                </div>
                            ) : requests.length === 0 ? (
                                <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/20 rounded-2xl">
                                    <CardBody className="p-12 text-center">
                                        <Clock3 className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
                                        <h3 className="text-2xl font-bold text-slate-800 mb-2">
                                            No Pending Requests
                                        </h3>
                                        <p className="text-slate-600">
                                            There are currently no Team Leader
                                            requests waiting for review.
                                        </p>
                                    </CardBody>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {requests.map((request) => (
                                        <Card
                                            key={request.id}
                                            className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 rounded-2xl"
                                        >
                                            <CardHeader className="pb-2">
                                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 w-full">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-slate-800">
                                                            {request.fullName}
                                                        </h3>
                                                        <p className="text-slate-500">
                                                            Requested Team:{' '}
                                                            {request.teamName}
                                                        </p>
                                                    </div>

                                                    <Chip
                                                        color="warning"
                                                        variant="flat"
                                                    >
                                                        Pending Admin Review
                                                    </Chip>
                                                </div>
                                            </CardHeader>

                                            <CardBody className="pt-2">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                                                    <div className="rounded-xl bg-slate-50 p-4">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                                            Age
                                                        </p>
                                                        <p className="font-bold text-slate-800">
                                                            {request.age}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-xl bg-slate-50 p-4">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                                            Role
                                                        </p>
                                                        <p className="font-bold text-slate-800">
                                                            Team Leader
                                                        </p>
                                                    </div>

                                                    <div className="rounded-xl bg-slate-50 p-4">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                                            Submitted
                                                        </p>
                                                        <p className="font-bold text-slate-800">
                                                            {formatDate(
                                                                request.createdAt
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="rounded-xl bg-slate-50 p-4 mb-5">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                                        Address
                                                    </p>
                                                    <p className="text-slate-800 font-medium">
                                                        {request.address}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                                                    <Button
                                                        color="danger"
                                                        variant="flat"
                                                        startContent={
                                                            <XCircle className="w-4 h-4" />
                                                        }
                                                        isDisabled={
                                                            processingId ===
                                                            request.id
                                                        }
                                                        onPress={() =>
                                                            openRejectModal(
                                                                request.id
                                                            )
                                                        }
                                                    >
                                                        Reject
                                                    </Button>

                                                    <Button
                                                        color="success"
                                                        startContent={
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        }
                                                        isLoading={
                                                            processingId ===
                                                            request.id
                                                        }
                                                        onPress={() =>
                                                            handleApprove(
                                                                request.id
                                                            )
                                                        }
                                                    >
                                                        Approve
                                                    </Button>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </Tab>

                        <Tab
                            key="users"
                            title={
                                <div className="flex items-center gap-2 px-2">
                                    <Users className="w-5 h-5" />
                                    <span>Users / Members</span>
                                </div>
                            }
                        >
                            {loadingUsers ? (
                                <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/20 rounded-2xl">
                                    <CardBody className="p-6 space-y-4">
                                        {Array.from({ length: 5 }).map(
                                            (_, index) => (
                                                <Skeleton
                                                    key={index}
                                                    className="w-full h-14 rounded-xl"
                                                />
                                            )
                                        )}
                                    </CardBody>
                                </Card>
                            ) : (
                                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 rounded-2xl">
                                    <CardHeader className="pb-2">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800">
                                                Mi Salud Users
                                            </h2>
                                            <p className="text-slate-600">
                                                Registered members and their
                                                current team assignments
                                            </p>
                                        </div>
                                    </CardHeader>

                                    <CardBody className="pt-2">
                                        <div className="flex flex-col lg:flex-row gap-4 mb-5">
                                            <Input
                                                placeholder="Search by name, email, or team..."
                                                value={userSearchQuery}
                                                onChange={(e) =>
                                                    setUserSearchQuery(
                                                        e.target.value
                                                    )
                                                }
                                                variant="bordered"
                                                className="lg:max-w-md"
                                            />

                                            <Select
                                                label="Mi Salud Role"
                                                selectedKeys={[userRoleFilter]}
                                                onSelectionChange={(keys) => {
                                                    const value = Array.from(
                                                        keys
                                                    )[0] as
                                                        | 'ALL'
                                                        | 'TEAM_LEADER'
                                                        | 'TEAM_MEMBER'
                                                        | undefined;

                                                    setUserRoleFilter(
                                                        value || 'ALL'
                                                    );
                                                }}
                                                variant="bordered"
                                                className="lg:max-w-xs"
                                            >
                                                <SelectItem key="ALL">
                                                    All Roles
                                                </SelectItem>
                                                <SelectItem key="TEAM_LEADER">
                                                    Team Leader
                                                </SelectItem>
                                                <SelectItem key="TEAM_MEMBER">
                                                    Team Member
                                                </SelectItem>
                                            </Select>
                                        </div>
                                        {filteredUsers.length === 0 ? (
                                            <div className="py-12 text-center text-slate-500">
                                                No registered Mi Salud users
                                                found.
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-slate-200 text-left">
                                                            <th className="py-3 pr-4 font-semibold text-slate-600">
                                                                Name
                                                            </th>
                                                            <th className="py-3 pr-4 font-semibold text-slate-600">
                                                                Email
                                                            </th>
                                                            <th className="py-3 pr-4 font-semibold text-slate-600">
                                                                Team
                                                            </th>
                                                            <th className="py-3 pr-4 font-semibold text-slate-600">
                                                                Mi Salud Role
                                                            </th>
                                                            <th className="py-3 pr-4 font-semibold text-slate-600">
                                                                Membership
                                                            </th>
                                                            <th className="py-3 pr-4 font-semibold text-slate-600">
                                                                Approved
                                                            </th>
                                                            <th className="py-3 pr-4 font-semibold text-slate-600">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredUsers.map(
                                                            (user) => (
                                                                <tr
                                                                    key={
                                                                        user.id
                                                                    }
                                                                    className="border-b border-slate-100"
                                                                >
                                                                    <td className="py-3 pr-4 font-semibold text-slate-800">
                                                                        {user.name ||
                                                                            'Unnamed User'}
                                                                    </td>
                                                                    <td className="py-3 pr-4 text-slate-600">
                                                                        {
                                                                            user.email
                                                                        }
                                                                    </td>
                                                                    <td className="py-3 pr-4 text-slate-700">
                                                                        {editingTeamUserId ===
                                                                        user.id ? (
                                                                            <Input
                                                                                size="sm"
                                                                                value={
                                                                                    editedTeamName
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) =>
                                                                                    setEditedTeamName(
                                                                                        e
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                variant="bordered"
                                                                                isDisabled={
                                                                                    updatingTeamUserId ===
                                                                                    user.id
                                                                                }
                                                                                className="min-w-[220px]"
                                                                            />
                                                                        ) : (
                                                                            user.teamName
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 pr-4 text-slate-700">
                                                                        {user.miSaludRole ===
                                                                        'TEAM_LEADER'
                                                                            ? 'Team Leader'
                                                                            : 'Team Member'}
                                                                    </td>
                                                                    <td className="py-3 pr-4">
                                                                        <Chip
                                                                            size="sm"
                                                                            color={
                                                                                user.membershipStatus ===
                                                                                'APPROVED'
                                                                                    ? 'success'
                                                                                    : user.membershipStatus ===
                                                                                        'REJECTED'
                                                                                      ? 'danger'
                                                                                      : 'warning'
                                                                            }
                                                                            variant="flat"
                                                                        >
                                                                            {
                                                                                user.membershipStatus
                                                                            }
                                                                        </Chip>
                                                                    </td>
                                                                    <td className="py-3 pr-4 text-slate-700">
                                                                        {formatDate(
                                                                            user.approvedAt
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 pr-4">
                                                                        <div className="flex items-center gap-2">
                                                                            {editingTeamUserId ===
                                                                            user.id ? (
                                                                                <Button
                                                                                    isIconOnly
                                                                                    size="sm"
                                                                                    color="success"
                                                                                    variant="flat"
                                                                                    isLoading={
                                                                                        updatingTeamUserId ===
                                                                                        user.id
                                                                                    }
                                                                                    onPress={() =>
                                                                                        handleUpdateTeamName(
                                                                                            user
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <Save className="w-4 h-4" />
                                                                                </Button>
                                                                            ) : (
                                                                                <Button
                                                                                    isIconOnly
                                                                                    size="sm"
                                                                                    variant="flat"
                                                                                    className="text-emerald-700 bg-emerald-100"
                                                                                    onPress={() => {
                                                                                        setEditingTeamUserId(
                                                                                            user.id
                                                                                        );
                                                                                        setEditedTeamName(
                                                                                            user.teamName
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <Edit3 className="w-4 h-4" />
                                                                                </Button>
                                                                            )}

                                                                            <Button
                                                                                isIconOnly
                                                                                size="sm"
                                                                                color="danger"
                                                                                variant="flat"
                                                                                isLoading={
                                                                                    deletingUserId ===
                                                                                    user.id
                                                                                }
                                                                                onPress={() =>
                                                                                    openDeleteUserModal(
                                                                                        user
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            )}
                        </Tab>

                        <Tab
                            key="submissions"
                            title={
                                <div className="flex items-center gap-2 px-2">
                                    <HeartPulse className="w-5 h-5" />
                                    <span>Assess Health Submissions</span>
                                </div>
                            }
                        >
                            {loadingSubmissions ? (
                                <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/20 rounded-2xl">
                                    <CardBody className="p-6 space-y-4">
                                        {Array.from({ length: 5 }).map(
                                            (_, index) => (
                                                <Skeleton
                                                    key={index}
                                                    className="w-full h-14 rounded-xl"
                                                />
                                            )
                                        )}
                                    </CardBody>
                                </Card>
                            ) : (
                                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 rounded-2xl">
                                    <CardHeader className="pb-2">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800">
                                                Assess Health Submissions
                                            </h2>
                                            <p className="text-slate-600">
                                                Completed wellness questionnaire
                                                submissions
                                            </p>
                                        </div>
                                    </CardHeader>

                                    <CardBody className="pt-2">
                                        <div className="flex flex-col lg:flex-row gap-4 mb-5">
                                            <Input
                                                placeholder="Search by name, email, or team..."
                                                value={submissionSearchQuery}
                                                onChange={(e) =>
                                                    setSubmissionSearchQuery(
                                                        e.target.value
                                                    )
                                                }
                                                variant="bordered"
                                                className="lg:max-w-md"
                                            />

                                            <Select
                                                label="Team"
                                                selectedKeys={[
                                                    submissionTeamFilter,
                                                ]}
                                                onSelectionChange={(keys) => {
                                                    const value = Array.from(
                                                        keys
                                                    )[0] as string | undefined;
                                                    setSubmissionTeamFilter(
                                                        value || 'ALL'
                                                    );
                                                }}
                                                variant="bordered"
                                                className="lg:max-w-xs"
                                            >
                                                {submissionTeamOptions.map(
                                                    (team) => (
                                                        <SelectItem key={team}>
                                                            {team === 'ALL'
                                                                ? 'All Teams'
                                                                : team}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </Select>
                                        </div>
                                        {filteredSubmissions.length === 0 ? (
                                            <div className="py-12 text-center text-slate-500">
                                                No Assess Health submissions
                                                found.
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-slate-200 text-left">
                                                            <th className="py-3 pr-4 font-semibold text-slate-600">
                                                                Name
                                                            </th>
                                                            <th className="py-3 pr-4 font-semibold text-slate-600">
                                                                Email
                                                            </th>
                                                            <th className="py-3 pr-4 font-semibold text-slate-600">
                                                                Team
                                                            </th>
                                                            <th className="py-3 pr-4 font-semibold text-slate-600">
                                                                Assessment Date
                                                            </th>
                                                            <th className="py-3 pr-4 font-semibold text-slate-600">
                                                                Submitted At
                                                            </th>
                                                            <th className="py-3 pr-4 font-semibold text-slate-600">
                                                                Total Answers
                                                            </th>
                                                            <th className="py-3 pr-4 font-semibold text-slate-600">
                                                                Action
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredSubmissions.map(
                                                            (submission) => (
                                                                <tr
                                                                    key={
                                                                        submission.id
                                                                    }
                                                                    className="border-b border-slate-100"
                                                                >
                                                                    <td className="py-3 pr-4 font-semibold text-slate-800">
                                                                        {
                                                                            submission.name
                                                                        }
                                                                    </td>
                                                                    <td className="py-3 pr-4 text-slate-600">
                                                                        {
                                                                            submission.email
                                                                        }
                                                                    </td>
                                                                    <td className="py-3 pr-4 text-slate-700">
                                                                        {
                                                                            submission.team
                                                                        }
                                                                    </td>
                                                                    <td className="py-3 pr-4 text-slate-700">
                                                                        {formatDate(
                                                                            submission.assessmentDate
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 pr-4 text-slate-700">
                                                                        {formatDate(
                                                                            submission.submittedAt
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 pr-4 text-slate-700 font-semibold">
                                                                        {
                                                                            submission.totalAnswers
                                                                        }
                                                                    </td>
                                                                    <td className="py-3 pr-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <Button
                                                                                size="sm"
                                                                                color="success"
                                                                                variant="flat"
                                                                                onPress={() =>
                                                                                    router.push(
                                                                                        `/misalud/manage/submission/${submission.id}`
                                                                                    )
                                                                                }
                                                                            >
                                                                                View
                                                                            </Button>

                                                                            <Button
                                                                                isIconOnly
                                                                                size="sm"
                                                                                color="danger"
                                                                                variant="flat"
                                                                                isLoading={
                                                                                    deletingSubmissionId ===
                                                                                    submission.id
                                                                                }
                                                                                onPress={() =>
                                                                                    openDeleteSubmissionModal(
                                                                                        submission
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            )}
                        </Tab>
                    </Tabs>
                </div>
            </div>

            <Modal
                isOpen={deleteUserModalOpen}
                onOpenChange={(open) => {
                    setDeleteUserModalOpen(open);
                    if (!open) {
                        setSelectedDeleteUser(null);
                    }
                }}
            >
                <ModalContent>
                    <ModalHeader className="font-bold">
                        Confirm Delete
                    </ModalHeader>

                    <ModalBody>
                        <div className="space-y-1 text-slate-700">
                            <p>
                                Are you sure you want to{' '}
                                <span className="font-bold text-red-600">
                                    DELETE
                                </span>{' '}
                                this Mi Salud user?
                            </p>

                            <p className="font-semibold text-slate-900">
                                {selectedDeleteUser?.name || 'Unknown User'}
                            </p>

                            <p className="text-sm text-slate-500">
                                Team: {selectedDeleteUser?.teamName || '—'}
                            </p>
                        </div>

                        <p className="text-sm text-slate-500">
                            This action cannot be undone.
                        </p>
                    </ModalBody>

                    <ModalFooter>
                        <Button
                            variant="light"
                            onPress={() => {
                                setDeleteUserModalOpen(false);
                                setSelectedDeleteUser(null);
                            }}
                            isDisabled={!!deletingUserId}
                        >
                            Cancel
                        </Button>

                        <Button
                            className="bg-gradient-to-r from-emerald-800 to-emerald-600 text-white hover:from-emerald-900 hover:to-emerald-700"
                            onPress={handleDeleteUserConfirm}
                            isLoading={!!deletingUserId}
                        >
                            Confirm Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal
                isOpen={deleteSubmissionModalOpen}
                onOpenChange={(open) => {
                    setDeleteSubmissionModalOpen(open);
                    if (!open) {
                        setSelectedDeleteSubmission(null);
                    }
                }}
            >
                <ModalContent>
                    <ModalHeader className="font-bold">
                        Confirm Delete Submission
                    </ModalHeader>

                    <ModalBody>
                        <div className="space-y-1 text-slate-700">
                            <p>
                                Are you sure you want to{' '}
                                <span className="font-bold text-red-600">
                                    DELETE
                                </span>{' '}
                                this submission?
                            </p>

                            <p className="font-semibold text-slate-900">
                                {selectedDeleteSubmission?.name || 'Unknown'}
                            </p>

                            <p className="text-sm text-slate-500">
                                Team: {selectedDeleteSubmission?.team || '—'}
                            </p>
                        </div>

                        <p className="text-sm text-slate-500">
                            This action cannot be undone.
                        </p>
                    </ModalBody>

                    <ModalFooter>
                        <Button
                            variant="light"
                            onPress={() => {
                                setDeleteSubmissionModalOpen(false);
                                setSelectedDeleteSubmission(null);
                            }}
                            isDisabled={!!deletingSubmissionId}
                        >
                            Cancel
                        </Button>

                        <Button
                            className="bg-gradient-to-r from-emerald-800 to-emerald-600 text-white"
                            onPress={handleDeleteSubmissionConfirm}
                            isLoading={!!deletingSubmissionId}
                        >
                            Confirm Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal
                isOpen={rejectModalOpen}
                onOpenChange={(open) => {
                    setRejectModalOpen(open);
                    if (!open) {
                        setSelectedRejectId(null);
                        setRejectionReason('');
                    }
                }}
                size="lg"
            >
                <ModalContent>
                    <ModalHeader>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">
                                Reject Team Leader Request
                            </h3>
                            <p className="text-sm text-slate-500 font-normal">
                                You may provide a reason for rejecting this
                                request.
                            </p>
                        </div>
                    </ModalHeader>

                    <ModalBody>
                        <Textarea
                            label="Rejection Reason"
                            placeholder="Enter a reason for rejection (optional)"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            minRows={4}
                            variant="bordered"
                        />
                    </ModalBody>

                    <ModalFooter>
                        <Button
                            variant="light"
                            onPress={() => {
                                setRejectModalOpen(false);
                                setSelectedRejectId(null);
                                setRejectionReason('');
                            }}
                            isDisabled={!!processingId}
                        >
                            Cancel
                        </Button>

                        <Button
                            color="danger"
                            onPress={handleRejectConfirm}
                            isLoading={processingId === selectedRejectId}
                        >
                            Confirm Reject
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default MiSaludAdminRequestsClient;
