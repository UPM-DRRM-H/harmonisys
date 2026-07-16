'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    Spinner,
    Tooltip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Button,
    useDisclosure,
    Card,
    CardBody,
    Chip,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@heroui/react';
import useSWR from 'swr';
import type { User } from '@/types';

type PendingRoleRequest = {
    id: string;
    toRole: UserType;
    requestedMhpssLevel?: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    createdAt?: string;
};

type UserWithPending = User & {
    pendingRoleRequest?: PendingRoleRequest | null;
};

import {
    updateUserMhpssLevel,
    updateUserRole,
    updateUserResponderOrganization,
    updateUserRegion,
} from '@/lib/action/user';
import { notifyAdminAction } from '@/lib/action/adminEmail';

import { MhpssLevel, UserType } from '@prisma/client';
import {
    ArrowLeft,
    Users,
    Shield,
    Award,
    UserIcon,
    Info,
    Edit3,
    Trash2,
    XCircle,
    UserCog,
    Search,
} from 'lucide-react';
import MHPSSLevel from '@/components/MHPSS';

const maroonTheme = {
    background: 'bg-gradient-to-br from-[#F9F3F5] via-[#F6E9EE] to-[#F3E2E7]',
    headerGradient: 'from-[#4A0707] via-[#6B0F0F] to-[#A11B1B]',
    title: 'text-white drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]',
    subtitle: 'text-white/85',
    shell: 'bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_20px_60px_rgba(42,6,13,0.22)]',
    innerPanel:
        'bg-white/70 border border-white/45 shadow-[0_10px_30px_rgba(42,6,13,0.10)]',
    tabWrap: 'bg-white/70 border border-white/45',
    tabActive:
        'bg-gradient-to-r from-[#4A0707] via-[#6B0F0F] to-[#A11B1B] text-white border-transparent shadow-md',
    tabIdle:
        'bg-white/80 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300',
    statPill:
        'bg-white/10 text-white border border-white/20 backdrop-blur-sm shadow-sm',
    legendBtn:
        'bg-white/15 text-white border border-white/25 backdrop-blur-sm shadow-sm hover:bg-white/20 transition-all',
    ghostBtn:
        'bg-white/85 text-[#7A0C1E] border border-[#7A0C1E]/20 hover:bg-[#B91C1C]/10 hover:border-[#B91C1C]/40 transition-all',
    filterBtn:
        'bg-white/85 text-[#7A0C1E] border-2 border-[#A11B1B]/30 hover:bg-[#A11B1B]/10 hover:border-[#A11B1B]/60 transition-all shadow-sm',
    dropdownMenu:
        'bg-white/95 backdrop-blur-sm border border-[#A11B1B]/15 shadow-[0_18px_50px_rgba(42,6,13,0.18)] rounded-2xl p-2',
    dropdownItem:
        'rounded-xl data-[hover=true]:bg-[#A11B1B]/10 data-[selectable=true]:focus:bg-[#A11B1B]/10',
    th: 'bg-gradient-to-r from-[#F3E2E7] to-[#F7EEF1] text-[#2A060D] font-extrabold border-b border-white/60',
    td: 'py-4 border-b border-white/60',
    rowHover: 'hover:bg-[#B91C1C]/[0.04] transition-colors duration-200',
    chipPill:
        'rounded-full px-3 py-1.5 border border-black/5 bg-white/80 backdrop-blur-sm',
    actionBtnBase:
        'rounded-xl border border-slate-200 bg-white/85 shadow-sm hover:shadow-md transition-all duration-200',
    actionEdit:
        'text-[#B45309] hover:text-[#92400E] hover:bg-[#F59E0B]/10 hover:border-[#F59E0B]/25',
    actionDelete:
        'text-[#B91C1C] hover:text-[#7A0C1E] hover:bg-[#EF4444]/10 hover:border-[#EF4444]/25',
    paginationWrap:
        'gap-1 overflow-visible h-10 rounded-xl border border-white/50 bg-white/80 backdrop-blur-sm shadow-lg',
    paginationItem:
        'w-10 h-10 text-sm rounded-lg bg-transparent hover:bg-[#A11B1B]/10 transition-all duration-200 font-medium text-slate-700 hover:text-[#A11B1B]',
    paginationCursor:
        'bg-gradient-to-r from-[#4A0707] via-[#6B0F0F] to-[#A11B1B] shadow-xl text-white font-bold rounded-lg border-2 border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300',
    paginationNav:
        'bg-white/90 hover:bg-[#B91C1C]/10 border border-white/50 text-[#7A0C1E] rounded-lg shadow-md hover:shadow-lg transition-all duration-200',
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const roleOptions = [UserType.ADMIN, UserType.RESPONDER, UserType.STANDARD];

const mhpssOptions: Array<MhpssLevel | 'NONE'> = [
    'NONE',
    MhpssLevel.LEVEL_1,
    MhpssLevel.LEVEL_2,
    MhpssLevel.LEVEL_3,
    MhpssLevel.LEVEL_4,
];

const regionOptions = [
    'NCR',
    'Region I',
    'Region II',
    'Region III',
    'Region IV-A',
    'Region IV-B',
    'Region V',
    'Region VI',
    'Region VII',
    'Region VIII',
    'Region IX',
    'Region X',
    'Region XI',
    'Region XII',
    'Region XIII',
    'CAR',
    'BARMM',
    'NONE',
];

const levelMap: Record<1 | 2 | 3 | 4, string> = {
    1: 'LEVEL_1',
    2: 'LEVEL_2',
    3: 'LEVEL_3',
    4: 'LEVEL_4',
};

const UserTable = () => {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'USERS' | 'PENDING'>('USERS');
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserType | 'ALL'>('ALL');
    const [mhpssFilter, setMhpssFilter] = useState<number | 'NONE' | 'ALL'>(
        'ALL'
    );
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUserName, setSelectedUserName] = useState<string | null>(
        null
    );
    const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(
        null
    );
    const [isDeleting, setIsDeleting] = useState(false);

    type PendingRequestRow = {
        id: string;
        fromRole: UserType;
        toRole: UserType;
        requestedMhpssLevel?: string | null;
        requestedResponderOrganization?: string | null;
        requestedMhpssCertificateFileUrl?: string | null;
        status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
        createdAt: string;
        user: {
            id: string;
            name: string | null;
            email: string;
            role: UserType;
            mhpssLevel?: string | null;
            createdAt: string;
        };
    };

    const [pendingRequests, setPendingRequests] = useState<PendingRequestRow[]>(
        []
    );
    const [pendingLoading, setPendingLoading] = useState(false);
    const [pendingMessage, setPendingMessage] = useState<string | null>(null);
    const [requestConfirmOpen, setRequestConfirmOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
        null
    );
    const [selectedRequestUserName, setSelectedRequestUserName] = useState<
        string | null
    >(null);
    const [selectedRequestAction, setSelectedRequestAction] = useState<
        'APPROVE' | 'REJECT' | null
    >(null);

    const [editingRow, setEditingRow] = useState<string | null>(null);
    const [editingField, setEditingField] = useState<
        'role' | 'mhpssLevel' | 'responderOrganization' | 'region' | null
    >(null);
    const [editedRole, setEditedRole] = useState<{ [key: string]: UserType }>(
        {}
    );
    const [editedMhpssLevel, setEditedMhpssLevel] = useState<{
        [key: string]: MhpssLevel | null;
    }>({});
    const [editedOrganization, setEditedOrganization] = useState<{
        [key: string]: string;
    }>({});
    const [editedRegion, setEditedRegion] = useState<{
        [key: string]: string | null;
    }>({});
    const [isUpdating, setIsUpdating] = useState(false);

    const rowsPerPage = 10;
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const { data, isLoading, mutate } = useSWR(
        `/api/user?page=${page}&limit=${rowsPerPage}`,
        fetcher,
        { keepPreviousData: true }
    );

    const pages = data?.count ? Math.ceil(data.count / rowsPerPage) : 0;
    const users = (data?.results as UserWithPending[]) || [];

    const filteredUsers = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return users.filter((u) => {
            const matchesSearch =
                !q ||
                (u.name ?? '').toLowerCase().includes(q) ||
                (u.email ?? '').toLowerCase().includes(q);
            const matchesRole =
                roleFilter === 'ALL' ? true : u.role === roleFilter;
            const matchesMHPSS =
                mhpssFilter === 'ALL'
                    ? true
                    : mhpssFilter === 'NONE'
                      ? u.mhpssLevel == null
                      : u.mhpssLevel === levelMap[mhpssFilter as 1 | 2 | 3 | 4];
            return matchesSearch && matchesRole && matchesMHPSS;
        });
    }, [users, searchTerm, roleFilter, mhpssFilter]);

    const loadPendingRequests = useCallback(async () => {
        try {
            setPendingLoading(true);
            setPendingMessage(null);
            const res = await fetch('/api/admin/users/role-requests', {
                method: 'GET',
            });
            const json = await res.json().catch(() => null);
            if (!res.ok || !json?.success) {
                setPendingMessage(
                    json?.message || 'Failed to load pending requests.'
                );
                setPendingRequests([]);
                return;
            }
            setPendingRequests(json.data || []);
        } catch {
            setPendingMessage('Failed to load pending requests.');
            setPendingRequests([]);
        } finally {
            setPendingLoading(false);
        }
    }, []);

    const openRequestConfirm = useCallback(
        (id: string, userName: string | null, action: 'APPROVE' | 'REJECT') => {
            setSelectedRequestId(id);
            setSelectedRequestUserName(userName);
            setSelectedRequestAction(action);
            setRequestConfirmOpen(true);
        },
        []
    );

    const actOnRequest = useCallback(
        async (id: string, action: 'APPROVE' | 'REJECT') => {
            try {
                setPendingLoading(true);
                setPendingMessage(null);
                const res = await fetch(
                    `/api/admin/users/role-requests/${id}`,
                    {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action }),
                    }
                );
                const json = await res.json().catch(() => null);
                if (!res.ok || !json?.success) {
                    setPendingMessage(json?.message || 'Action failed.');
                    return;
                }
                setPendingRequests((prev) => prev.filter((r) => r.id !== id));
                mutate();
            } catch {
                setPendingMessage('Action failed.');
            } finally {
                setPendingLoading(false);
            }
        },
        [mutate]
    );

    const confirmRequestAction = useCallback(async () => {
        if (!selectedRequestId || !selectedRequestAction) return;
        await actOnRequest(selectedRequestId, selectedRequestAction);
        setRequestConfirmOpen(false);
        setSelectedRequestId(null);
        setSelectedRequestUserName(null);
        setSelectedRequestAction(null);
    }, [selectedRequestId, selectedRequestAction, actOnRequest]);

    const loadingState =
        isLoading || (data?.results?.length ?? 0) === 0 ? 'loading' : 'idle';

    const handleRoleChange = useCallback(
        async (
            id: string,
            value: UserType,
            userEmail: string,
            userName: string | null,
            oldRole: UserType
        ) => {
            try {
                setIsUpdating(true);
                setEditedRole((prev) => ({ ...prev, [id]: value }));
                await updateUserRole(id, value);
                void notifyAdminAction({
                    to: userEmail,
                    userName,
                    actionType: 'ROLE_CHANGED',
                    oldRole,
                    newRole: value,
                });
                mutate((currentData: any) => {
                    if (!currentData) return currentData;
                    return {
                        ...currentData,
                        results: currentData.results.map((user: User) =>
                            user.id === id ? { ...user, role: value } : user
                        ),
                    };
                }, false);
                setEditingRow(null);
                setEditingField(null);
            } catch (error) {
                console.error('Failed to update role:', error);
            } finally {
                setIsUpdating(false);
            }
        },
        [mutate]
    );

    const handleMhpssLevelChange = useCallback(
        async (
            id: string,
            value: MhpssLevel | null,
            userEmail: string,
            userName: string | null,
            oldMhpss: string | null
        ) => {
            try {
                setIsUpdating(true);
                setEditedMhpssLevel((prev) => ({ ...prev, [id]: value }));
                await updateUserMhpssLevel(id, value);
                void notifyAdminAction({
                    to: userEmail,
                    userName,
                    actionType: 'MHPSS_CHANGED',
                    oldMhpss,
                    newMhpss: value,
                });
                mutate((currentData: any) => {
                    if (!currentData) return currentData;
                    return {
                        ...currentData,
                        results: currentData.results.map((user: User) =>
                            user.id === id
                                ? { ...user, mhpssLevel: value }
                                : user
                        ),
                    };
                }, false);
                setEditingRow(null);
                setEditingField(null);
            } catch (error) {
                console.error('Failed to update MHPSS level:', error);
            } finally {
                setIsUpdating(false);
            }
        },
        [mutate]
    );

    const handleOrganizationChange = useCallback(
        async (id: string, value: string) => {
            try {
                setIsUpdating(true);
                setEditedOrganization((prev) => ({ ...prev, [id]: value }));
                await updateUserResponderOrganization(id, value.trim() || null);
                mutate((currentData: any) => {
                    if (!currentData) return currentData;
                    return {
                        ...currentData,
                        results: currentData.results.map((user: User) =>
                            user.id === id
                                ? {
                                      ...user,
                                      responderOrganization:
                                          value.trim() || null,
                                  }
                                : user
                        ),
                    };
                }, false);
                setEditingRow(null);
                setEditingField(null);
            } catch (error) {
                console.error('Failed to update organization:', error);
            } finally {
                setIsUpdating(false);
            }
        },
        [mutate]
    );

    const handleRegionChange = useCallback(
        async (id: string, value: string | null) => {
            try {
                setIsUpdating(true);
                setEditedRegion((prev) => ({ ...prev, [id]: value }));
                await updateUserRegion(id, value);
                mutate((currentData: any) => {
                    if (!currentData) return currentData;
                    return {
                        ...currentData,
                        results: currentData.results.map((user: User) =>
                            user.id === id ? { ...user, region: value } : user
                        ),
                    };
                }, false);
                setEditingRow(null);
                setEditingField(null);
            } catch (error) {
                console.error('Failed to update region:', error);
            } finally {
                setIsUpdating(false);
            }
        },
        [mutate]
    );

    const openDeleteConfirm = useCallback(
        (id: string, name?: string | null, email?: string | null) => {
            setSelectedUserId(id);
            setSelectedUserName(name ?? null);
            setSelectedUserEmail(email ?? null);
            setDeleteConfirmOpen(true);
        },
        []
    );

    const handleDeleteUser = useCallback(async () => {
        if (!selectedUserId) return;
        try {
            setIsDeleting(true);
            const res = await fetch(`/api/admin/users/${selectedUserId}`, {
                method: 'DELETE',
            });
            const json = await res.json().catch(() => null);
            if (!res.ok || !json?.success) {
                alert(json?.message || 'Failed to delete user.');
                return;
            }
            void notifyAdminAction({
                to: selectedUserEmail ?? '',
                userName: selectedUserName ?? null,
                actionType: 'ACCOUNT_DELETED',
            });
            setDeleteConfirmOpen(false);
            setSelectedUserId(null);
            setSelectedUserName(null);
            setSelectedUserEmail(null);
            mutate();
        } catch {
            alert('Failed to delete user.');
        } finally {
            setIsDeleting(false);
        }
    }, [selectedUserId, selectedUserEmail, selectedUserName, mutate]);

    const getRoleIcon = (role: UserType) => {
        switch (role) {
            case UserType.ADMIN:
                return <Shield className="w-4 h-4" />;
            case UserType.RESPONDER:
                return <Users className="w-4 h-4" />;
            case UserType.STANDARD:
                return <UserIcon className="w-4 h-4" />;
            default:
                return <UserIcon className="w-4 h-4" />;
        }
    };

    const getRoleIconColored = (role: UserType, className = 'w-4 h-4') => {
        const color =
            role === UserType.ADMIN
                ? 'text-rose-600'
                : role === UserType.RESPONDER
                  ? 'text-amber-600'
                  : 'text-emerald-600';
        switch (role) {
            case UserType.ADMIN:
                return <Shield className={`${className} ${color}`} />;
            case UserType.RESPONDER:
                return <Users className={`${className} ${color}`} />;
            case UserType.STANDARD:
                return <UserIcon className={`${className} ${color}`} />;
            default:
                return <UserIcon className={`${className} ${color}`} />;
        }
    };

    const getRoleColor = (role: UserType) => {
        switch (role) {
            case UserType.ADMIN:
                return 'danger';
            case UserType.RESPONDER:
                return 'warning';
            case UserType.STANDARD:
                return 'success';
            default:
                return 'default';
        }
    };

    const tableCols = [
        { key: 'name', name: 'Name' },
        { key: 'email', name: 'Email' },
        { key: 'role', name: 'Role' },
        { key: 'mhpssLevel', name: 'MHPSS Level' },
        { key: 'responderOrganization', name: 'Organization' },
        { key: 'mhpssCertificateFileUrl', name: 'Certificate' },
        { key: 'region', name: 'Region' },
        { key: 'createdAt', name: 'Created' },
        { key: 'actions', name: 'Actions' },
    ];

    const renderCell = useCallback(
        (item: UserWithPending, columnKey: string | number) => {
            const roleValue =
                editingRow === item.id && editingField === 'role'
                    ? editedRole[item.id] !== undefined
                        ? editedRole[item.id]
                        : item.role
                    : item.role;

            switch (columnKey) {
                case 'name':
                    return (
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-mono text-sm font-semibold text-slate-900">
                                    {item.name}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {item.gender ? item.gender : 'No gender'}
                                </span>
                            </div>
                        </TableCell>
                    );

                case 'email':
                    return (
                        <TableCell className="w-[240px] text-center">
                            <span className="font-medium text-slate-700 truncate">
                                {item.email}
                            </span>
                        </TableCell>
                    );

                case 'role':
                    return (
                        <TableCell
                            className={`${
                                editingRow === item.id
                                    ? 'cursor-pointer rounded-xl bg-white/70 hover:bg-white/85 border border-white/60 transition-all duration-200'
                                    : ''
                            }`}
                            onClick={() => {
                                if (editingRow === item.id)
                                    setEditingField('role');
                            }}
                        >
                            {editingRow === item.id &&
                            editingField === 'role' ? (
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            variant="light"
                                            disabled={isUpdating}
                                            size="sm"
                                            className="bg-white/60 backdrop-blur-sm border border-white/60 shadow-sm"
                                            startContent={
                                                <UserCog className="w-4 h-4 text-slate-700" />
                                            }
                                        >
                                            <Chip
                                                color={getRoleColor(roleValue)}
                                                variant="flat"
                                                size="sm"
                                                startContent={getRoleIcon(
                                                    roleValue
                                                )}
                                                className={maroonTheme.chipPill}
                                            >
                                                {roleValue}
                                                {isUpdating && ' (Saving...)'}
                                            </Chip>
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        disabledKeys={
                                            isUpdating
                                                ? roleOptions.map(String)
                                                : []
                                        }
                                        onAction={(key) => {
                                            void handleRoleChange(
                                                item.id,
                                                key as UserType,
                                                item.email,
                                                item.name,
                                                item.role
                                            );
                                        }}
                                        className="bg-white/95 backdrop-blur-sm"
                                    >
                                        {roleOptions.map((option) => (
                                            <DropdownItem
                                                key={option}
                                                textValue={option}
                                                startContent={getRoleIcon(
                                                    option
                                                )}
                                                className="hover:bg-slate-100/80"
                                            >
                                                {option}
                                            </DropdownItem>
                                        ))}
                                    </DropdownMenu>
                                </Dropdown>
                            ) : (
                                <div className="flex flex-col items-center gap-1">
                                    <Chip
                                        color={getRoleColor(item.role)}
                                        variant="flat"
                                        size="sm"
                                        startContent={getRoleIcon(item.role)}
                                        className={maroonTheme.chipPill}
                                    >
                                        {item.role}
                                    </Chip>
                                    {item?.pendingRoleRequest?.status ===
                                        'PENDING' && (
                                        <>
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color="warning"
                                                className={maroonTheme.chipPill}
                                            >
                                                Pending →{' '}
                                                {item.pendingRoleRequest.toRole}
                                            </Chip>
                                            {item.pendingRoleRequest
                                                .requestedMhpssLevel ? (
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color="warning"
                                                    className={
                                                        maroonTheme.chipPill
                                                    }
                                                >
                                                    MHPSS →{' '}
                                                    {
                                                        item.pendingRoleRequest
                                                            .requestedMhpssLevel
                                                    }
                                                </Chip>
                                            ) : null}
                                        </>
                                    )}
                                </div>
                            )}
                        </TableCell>
                    );

                case 'mhpssLevel': {
                    const mhpssValue =
                        editingRow === item.id && editingField === 'mhpssLevel'
                            ? editedMhpssLevel[item.id] !== undefined
                                ? editedMhpssLevel[item.id]
                                : (item.mhpssLevel ?? null)
                            : (item.mhpssLevel ?? null);

                    return (
                        <TableCell
                            className={`text-center ${
                                editingRow === item.id
                                    ? 'cursor-pointer rounded-xl bg-white/70 hover:bg-white/85 border border-white/60 transition-all duration-200'
                                    : ''
                            }`}
                            onClick={() => {
                                if (editingRow === item.id)
                                    setEditingField('mhpssLevel');
                            }}
                        >
                            {editingRow === item.id &&
                            editingField === 'mhpssLevel' ? (
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            variant="light"
                                            disabled={isUpdating}
                                            size="sm"
                                            className="bg-white/60 backdrop-blur-sm border border-white/60 shadow-sm"
                                            startContent={
                                                <Award className="w-4 h-4 text-slate-700" />
                                            }
                                        >
                                            <Chip
                                                variant="flat"
                                                size="sm"
                                                className={maroonTheme.chipPill}
                                            >
                                                {mhpssValue
                                                    ? mhpssValue.replace(
                                                          'LEVEL_',
                                                          'Level '
                                                      )
                                                    : 'None'}
                                                {isUpdating && ' (Saving...)'}
                                            </Chip>
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        disabledKeys={
                                            isUpdating
                                                ? mhpssOptions.map(String)
                                                : []
                                        }
                                        onAction={(key) => {
                                            const value = String(key);
                                            void handleMhpssLevelChange(
                                                item.id,
                                                value === 'NONE'
                                                    ? null
                                                    : (value as MhpssLevel),
                                                item.email,
                                                item.name,
                                                item.mhpssLevel ?? null
                                            );
                                        }}
                                        className="bg-white/95 backdrop-blur-sm"
                                    >
                                        {mhpssOptions.map((option) => (
                                            <DropdownItem
                                                key={option}
                                                textValue={String(option)}
                                                className="hover:bg-slate-100/80"
                                            >
                                                {option === 'NONE'
                                                    ? 'None'
                                                    : String(option).replace(
                                                          'LEVEL_',
                                                          'Level '
                                                      )}
                                            </DropdownItem>
                                        ))}
                                    </DropdownMenu>
                                </Dropdown>
                            ) : (
                                <Chip
                                    variant="flat"
                                    size="sm"
                                    startContent={<Award className="w-3 h-3" />}
                                    className={maroonTheme.chipPill}
                                >
                                    {item.mhpssLevel
                                        ? item.mhpssLevel.replace(
                                              'LEVEL_',
                                              'Level '
                                          )
                                        : 'Not Assessed'}
                                </Chip>
                            )}
                        </TableCell>
                    );
                }

                case 'responderOrganization': {
                    const orgValue =
                        editedOrganization[item.id] !== undefined
                            ? editedOrganization[item.id]
                            : item.responderOrganization || '';

                    return (
                        <TableCell
                            className={`text-center ${
                                editingRow === item.id
                                    ? 'cursor-pointer rounded-xl bg-white/70 hover:bg-white/85 border border-white/60 transition-all duration-200'
                                    : ''
                            }`}
                            onClick={() => {
                                if (editingRow === item.id)
                                    setEditingField('responderOrganization');
                            }}
                        >
                            {editingRow === item.id &&
                            editingField === 'responderOrganization' ? (
                                <Input
                                    size="sm"
                                    value={orgValue}
                                    disabled={isUpdating}
                                    placeholder="Enter organization"
                                    className="min-w-[160px]"
                                    onValueChange={(value) =>
                                        setEditedOrganization((prev) => ({
                                            ...prev,
                                            [item.id]: value,
                                        }))
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            void handleOrganizationChange(
                                                item.id,
                                                orgValue
                                            );
                                        }
                                    }}
                                    onBlur={() =>
                                        void handleOrganizationChange(
                                            item.id,
                                            orgValue
                                        )
                                    }
                                />
                            ) : (
                                <span className="text-sm text-slate-700">
                                    {item.responderOrganization || '—'}
                                </span>
                            )}
                        </TableCell>
                    );
                }

                case 'mhpssCertificateFileUrl':
                    return (
                        <TableCell className="text-center">
                            {item.mhpssCertificateFileUrl ? (
                                <a
                                    href={item.mhpssCertificateFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-[#7A0C1E] underline underline-offset-4"
                                >
                                    View Certificate
                                </a>
                            ) : (
                                <span className="text-sm text-slate-400">
                                    —
                                </span>
                            )}
                        </TableCell>
                    );

                case 'region': {
                    const regionValue =
                        editedRegion[item.id] !== undefined
                            ? editedRegion[item.id]
                            : item.region || null;

                    return (
                        <TableCell
                            className={`w-[140px] text-center ${
                                editingRow === item.id
                                    ? 'cursor-pointer rounded-xl bg-white/70 hover:bg-white/85 border border-white/60 transition-all duration-200'
                                    : ''
                            }`}
                            onClick={() => {
                                if (editingRow === item.id)
                                    setEditingField('region');
                            }}
                        >
                            {editingRow === item.id &&
                            editingField === 'region' ? (
                                <Dropdown
                                    placement="bottom-start"
                                    shouldFlip={false}
                                >
                                    <DropdownTrigger>
                                        <Button
                                            size="sm"
                                            variant="light"
                                            disabled={isUpdating}
                                            className="bg-white/60 backdrop-blur-sm border border-white/60 shadow-sm"
                                        >
                                            {regionValue || 'No region'}
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        disabledKeys={
                                            isUpdating ? regionOptions : []
                                        }
                                        onAction={(key) => {
                                            const value = String(key);
                                            void handleRegionChange(
                                                item.id,
                                                value === 'NONE' ? null : value
                                            );
                                        }}
                                        className="bg-white/95 backdrop-blur-sm max-h-[260px] overflow-y-auto"
                                    >
                                        {regionOptions.map((region) => (
                                            <DropdownItem
                                                key={region}
                                                textValue={region}
                                            >
                                                {region === 'NONE'
                                                    ? 'No region'
                                                    : region}
                                            </DropdownItem>
                                        ))}
                                    </DropdownMenu>
                                </Dropdown>
                            ) : (
                                <span className="text-sm text-slate-700 whitespace-nowrap">
                                    {item.region || 'No region'}
                                </span>
                            )}
                        </TableCell>
                    );
                }

                case 'actions':
                    return (
                        <TableCell>
                            <div className="flex justify-center gap-2">
                                <Tooltip
                                    content={
                                        editingRow === item.id
                                            ? 'Cancel Edit'
                                            : 'Edit User'
                                    }
                                >
                                    <Button
                                        isIconOnly
                                        variant="light"
                                        size="sm"
                                        className={`${maroonTheme.actionBtnBase} ${maroonTheme.actionEdit}`}
                                        onPress={() => {
                                            if (editingRow === item.id) {
                                                setEditingRow(null);
                                                setEditingField(null);
                                            } else {
                                                setEditingRow(item.id);
                                            }
                                        }}
                                    >
                                        {editingRow === item.id ? (
                                            <XCircle className="w-4 h-4" />
                                        ) : (
                                            <Edit3 className="w-4 h-4" />
                                        )}
                                    </Button>
                                </Tooltip>

                                <Tooltip content="Delete User">
                                    <Button
                                        isIconOnly
                                        variant="light"
                                        size="sm"
                                        className={`${maroonTheme.actionBtnBase} ${maroonTheme.actionDelete}`}
                                        onPress={() =>
                                            openDeleteConfirm(
                                                item.id,
                                                item.name,
                                                item.email
                                            )
                                        }
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                            </div>
                        </TableCell>
                    );

                case 'createdAt':
                    return (
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium text-slate-800">
                                    {new Date(
                                        item.createdAt
                                    ).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {new Date(
                                        item.createdAt
                                    ).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                    })}
                                </span>
                            </div>
                        </TableCell>
                    );

                default:
                    return (
                        <TableCell className="text-slate-700">
                            {item[columnKey as keyof User]?.toString()}
                        </TableCell>
                    );
            }
        },
        [
            editingRow,
            isUpdating,
            editingField,
            editedRole,
            editedMhpssLevel,
            editedOrganization,
            editedRegion,
            handleRoleChange,
            handleMhpssLevelChange,
            handleOrganizationChange,
            handleRegionChange,
            openDeleteConfirm,
        ]
    );

    return (
        <div className={`min-h-screen ${maroonTheme.background}`}>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* HERO */}
                <div
                    className={`rounded-[28px] overflow-hidden ${maroonTheme.shell} mb-6`}
                >
                    <div
                        className={`px-6 py-7 bg-gradient-to-r ${maroonTheme.headerGradient}`}
                    >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                            <div>
                                <h1
                                    className={`text-4xl lg:text-5xl font-black ${maroonTheme.title}`}
                                >
                                    User Controller
                                </h1>
                                <p className={`${maroonTheme.subtitle} mt-2`}>
                                    Manage user roles and MHPSS competency
                                    levels
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <Button
                                    isIconOnly
                                    size="lg"
                                    onPress={() => router.push('/dashboard')}
                                    className="bg-white/15 text-white border border-white/25 backdrop-blur-sm shadow-sm hover:bg-white/25 transition-all rounded-2xl"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <div
                                    className={`flex items-center gap-2 rounded-2xl px-4 py-3 ${maroonTheme.statPill}`}
                                >
                                    <Users className="w-4 h-4 text-white/95" />
                                    <span className="text-white font-semibold">
                                        {data?.count || 0} Total Users
                                    </span>
                                </div>
                                <Button
                                    onPress={onOpen}
                                    size="lg"
                                    startContent={<Info className="w-5 h-5" />}
                                    className={maroonTheme.legendBtn}
                                >
                                    MHPSS Level Legend
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs row */}
                    <div className={`px-6 py-4 ${maroonTheme.tabWrap}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('USERS')}
                                    className={`px-4 py-2 rounded-2xl text-sm font-semibold border transition-all ${
                                        activeTab === 'USERS'
                                            ? maroonTheme.tabActive
                                            : maroonTheme.tabIdle
                                    }`}
                                >
                                    Users
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab('PENDING');
                                        loadPendingRequests();
                                    }}
                                    className={`px-4 py-2 rounded-2xl text-sm font-semibold border transition-all ${
                                        activeTab === 'PENDING'
                                            ? maroonTheme.tabActive
                                            : maroonTheme.tabIdle
                                    }`}
                                >
                                    Pending Requests
                                    {pendingRequests.length
                                        ? ` (${pendingRequests.length})`
                                        : ''}
                                </button>
                            </div>

                            <div className="flex flex-col lg:flex-row lg:items-center gap-3 w-full sm:w-auto">
                                <Input
                                    value={searchTerm}
                                    onValueChange={setSearchTerm}
                                    placeholder="Search name or email..."
                                    size="sm"
                                    variant="bordered"
                                    startContent={
                                        <Search className="w-4 h-4 text-[#7A0C1E]" />
                                    }
                                    classNames={{
                                        base: 'w-full lg:w-[320px]',
                                        inputWrapper:
                                            'bg-white/85 backdrop-blur-sm border-2 border-[#A11B1B]/35 shadow-sm ' +
                                            'hover:border-[#A11B1B]/60 focus-within:border-[#A11B1B] ' +
                                            'focus-within:shadow-[0_0_0_4px_rgba(161,27,27,0.12)] transition-all',
                                        input: 'text-slate-800 placeholder:text-slate-400',
                                    }}
                                />

                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            size="sm"
                                            variant="bordered"
                                            className={`${maroonTheme.filterBtn} w-[160px] justify-between gap-2`}
                                            startContent={
                                                <Shield className="w-4 h-4" />
                                            }
                                        >
                                            Role:{' '}
                                            {roleFilter === 'ALL'
                                                ? 'All'
                                                : roleFilter}
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        aria-label="Filter by role"
                                        className={maroonTheme.dropdownMenu}
                                        selectionMode="single"
                                        selectedKeys={
                                            new Set([String(roleFilter)])
                                        }
                                        onAction={(key) =>
                                            setRoleFilter(
                                                String(key) as UserType | 'ALL'
                                            )
                                        }
                                        items={[
                                            { key: 'ALL', label: 'All' },
                                            ...roleOptions.map((r) => ({
                                                key: String(r),
                                                label: String(r),
                                            })),
                                        ]}
                                    >
                                        {(item) => (
                                            <DropdownItem
                                                key={item.key}
                                                textValue={item.label}
                                                className={
                                                    maroonTheme.dropdownItem
                                                }
                                                startContent={
                                                    item.key === 'ALL' ? (
                                                        <Shield className="w-4 h-4 text-slate-400" />
                                                    ) : (
                                                        getRoleIconColored(
                                                            item.key as UserType
                                                        )
                                                    )
                                                }
                                            >
                                                <span className="font-semibold">
                                                    {item.label}
                                                </span>
                                            </DropdownItem>
                                        )}
                                    </DropdownMenu>
                                </Dropdown>

                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            size="sm"
                                            variant="bordered"
                                            className={`${maroonTheme.filterBtn} w-[140px] justify-between gap-2`}
                                            startContent={
                                                <Award className="w-4 h-4" />
                                            }
                                        >
                                            MHPSS:{' '}
                                            {mhpssFilter === 'ALL'
                                                ? 'All'
                                                : mhpssFilter === 'NONE'
                                                  ? 'None'
                                                  : `Level ${mhpssFilter}`}
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        aria-label="Filter by MHPSS level"
                                        className={maroonTheme.dropdownMenu}
                                        selectionMode="single"
                                        selectedKeys={
                                            new Set([String(mhpssFilter)])
                                        }
                                        onAction={(key) => {
                                            const k = String(key);
                                            if (k === 'ALL')
                                                return setMhpssFilter('ALL');
                                            if (k === 'NONE')
                                                return setMhpssFilter('NONE');
                                            return setMhpssFilter(Number(k));
                                        }}
                                        items={[
                                            { key: 'ALL', label: 'All' },
                                            { key: 'NONE', label: 'None' },
                                            ...[1, 2, 3, 4].map((lvl) => ({
                                                key: String(lvl),
                                                label: `Level ${lvl}`,
                                            })),
                                        ]}
                                    >
                                        {(item) => (
                                            <DropdownItem
                                                key={item.key}
                                                textValue={item.label}
                                                className={
                                                    maroonTheme.dropdownItem
                                                }
                                                startContent={
                                                    item.key === 'ALL' ? (
                                                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                                                    ) : item.key === 'NONE' ? (
                                                        <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                                                    ) : (
                                                        <span
                                                            className={`h-2.5 w-2.5 rounded-full ${
                                                                item.key === '1'
                                                                    ? 'bg-emerald-500'
                                                                    : item.key ===
                                                                        '2'
                                                                      ? 'bg-amber-500'
                                                                      : item.key ===
                                                                          '3'
                                                                        ? 'bg-blue-500'
                                                                        : 'bg-rose-500'
                                                            }`}
                                                        />
                                                    )
                                                }
                                            >
                                                <span className="font-semibold">
                                                    {item.label}
                                                </span>
                                            </DropdownItem>
                                        )}
                                    </DropdownMenu>
                                </Dropdown>

                                {(searchTerm ||
                                    roleFilter !== 'ALL' ||
                                    mhpssFilter !== 'ALL') && (
                                    <Button
                                        size="sm"
                                        variant="light"
                                        className="text-[#7A0C1E]"
                                        startContent={
                                            <XCircle className="w-4 h-4" />
                                        }
                                        onPress={() => {
                                            setSearchTerm('');
                                            setRoleFilter('ALL');
                                            setMhpssFilter('ALL');
                                        }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <Card className={maroonTheme.innerPanel}>
                    <CardBody className="p-4 sm:p-6">
                        {activeTab === 'USERS' ? (
                            <>
                                <Table
                                    aria-label="User Management Table"
                                    classNames={{
                                        wrapper: 'shadow-none bg-transparent',
                                        th: maroonTheme.th,
                                        td: maroonTheme.td,
                                    }}
                                >
                                    <TableHeader columns={tableCols}>
                                        {(column) => (
                                            <TableColumn
                                                key={column.key}
                                                className={`text-center text-sm sm:text-md ${
                                                    column.key === 'email'
                                                        ? 'w-[240px]'
                                                        : column.key ===
                                                            'region'
                                                          ? 'w-[120px]'
                                                          : ''
                                                }`}
                                            >
                                                {column.name}
                                            </TableColumn>
                                        )}
                                    </TableHeader>
                                    <TableBody
                                        emptyContent={
                                            <div className="text-center py-14">
                                                <div className="flex flex-col items-center gap-3">
                                                    <h3 className="text-xl font-semibold text-slate-800">
                                                        No Users Found
                                                    </h3>
                                                </div>
                                            </div>
                                        }
                                        loadingContent={
                                            <div className="flex justify-center py-12">
                                                <Spinner
                                                    size="lg"
                                                    color="danger"
                                                />
                                            </div>
                                        }
                                        loadingState={loadingState}
                                    >
                                        {filteredUsers.map((item) => (
                                            <TableRow
                                                key={item.id}
                                                className={maroonTheme.rowHover}
                                            >
                                                {(columnKey) =>
                                                    renderCell(item, columnKey)
                                                }
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {pages > 0 && (
                                    <div className="flex w-full justify-center pt-6 border-t border-white/60">
                                        <Pagination
                                            isCompact
                                            showControls
                                            showShadow
                                            color="danger"
                                            page={page}
                                            total={pages}
                                            onChange={setPage}
                                            classNames={{
                                                wrapper:
                                                    maroonTheme.paginationWrap,
                                                item: maroonTheme.paginationItem,
                                                cursor: maroonTheme.paginationCursor,
                                                prev: maroonTheme.paginationNav,
                                                next: maroonTheme.paginationNav,
                                                ellipsis:
                                                    'text-slate-400 hover:text-[#7A0C1E] transition-colors duration-200',
                                            }}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <div className="text-xl font-black text-slate-900">
                                            Pending Role Requests
                                        </div>
                                        <div className="text-sm text-slate-600">
                                            Approve or reject role upgrade
                                            requests.
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="bordered"
                                        className={maroonTheme.ghostBtn}
                                        onPress={loadPendingRequests}
                                        isDisabled={pendingLoading}
                                    >
                                        Refresh
                                    </Button>
                                </div>

                                {pendingMessage ? (
                                    <div className="text-sm text-[#7A0C1E] bg-[#B91C1C]/10 border border-[#B91C1C]/20 rounded-2xl p-3">
                                        {pendingMessage}
                                    </div>
                                ) : null}

                                {pendingLoading ? (
                                    <div className="flex justify-center py-10">
                                        <Spinner size="lg" color="danger" />
                                    </div>
                                ) : pendingRequests.length === 0 ? (
                                    <div className="text-sm text-slate-600">
                                        No pending requests.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {pendingRequests.map((r) => (
                                            <div
                                                key={r.id}
                                                className="rounded-3xl p-4 bg-white/75 border border-white/50 shadow-sm hover:shadow-md transition-all"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-slate-900 truncate">
                                                            {r.user?.name ||
                                                                'Unnamed'}{' '}
                                                            <span className="font-normal text-slate-500">
                                                                ({r.user?.email}
                                                                )
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-2 items-center">
                                                            <Chip
                                                                size="sm"
                                                                variant="flat"
                                                                className="bg-slate-100 text-slate-700"
                                                            >
                                                                From:{' '}
                                                                {r.fromRole}
                                                            </Chip>
                                                            <Chip
                                                                size="sm"
                                                                variant="flat"
                                                                className="bg-[#B91C1C]/10 text-[#7A0C1E] border border-[#B91C1C]/20"
                                                            >
                                                                To: {r.toRole}
                                                            </Chip>
                                                            {r.requestedMhpssLevel ? (
                                                                <Chip
                                                                    size="sm"
                                                                    variant="flat"
                                                                    className="bg-amber-100 text-amber-700 border border-amber-200"
                                                                >
                                                                    MHPSS:{' '}
                                                                    {
                                                                        r.requestedMhpssLevel
                                                                    }
                                                                </Chip>
                                                            ) : null}
                                                            {r.requestedResponderOrganization ? (
                                                                <Chip
                                                                    size="sm"
                                                                    variant="flat"
                                                                    className="bg-sky-100 text-sky-700 border border-sky-200"
                                                                >
                                                                    Org:{' '}
                                                                    {
                                                                        r.requestedResponderOrganization
                                                                    }
                                                                </Chip>
                                                            ) : null}
                                                            {r.requestedMhpssCertificateFileUrl ? (
                                                                <a
                                                                    href={
                                                                        r.requestedMhpssCertificateFileUrl
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm text-[#7A0C1E] underline underline-offset-4"
                                                                >
                                                                    View
                                                                    Certificate
                                                                </a>
                                                            ) : null}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-2">
                                                            Submitted:{' '}
                                                            {new Date(
                                                                r.createdAt
                                                            ).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                pendingLoading
                                                            }
                                                            onClick={() =>
                                                                openRequestConfirm(
                                                                    r.id,
                                                                    r.user
                                                                        ?.name ||
                                                                        null,
                                                                    'REJECT'
                                                                )
                                                            }
                                                            className="px-4 py-2 rounded-2xl text-sm font-semibold border border-slate-200 bg-white/90 hover:bg-slate-50 disabled:opacity-60 shadow-sm hover:shadow-md transition-all"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                pendingLoading
                                                            }
                                                            onClick={() =>
                                                                openRequestConfirm(
                                                                    r.id,
                                                                    r.user
                                                                        ?.name ||
                                                                        null,
                                                                    'APPROVE'
                                                                )
                                                            }
                                                            className="px-4 py-2 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-[#2A060D] via-[#7A0C1E] to-[#B91C1C] hover:opacity-95 disabled:opacity-60 shadow-md hover:shadow-lg transition-all"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardBody>
                </Card>

                <Modal
                    isOpen={requestConfirmOpen}
                    onClose={() => {
                        if (pendingLoading) return;
                        setRequestConfirmOpen(false);
                        setSelectedRequestId(null);
                        setSelectedRequestUserName(null);
                        setSelectedRequestAction(null);
                    }}
                >
                    <ModalContent>
                        <ModalHeader className="font-bold">
                            Confirm Request Action
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-1 text-slate-700">
                                <p>
                                    Are you sure you want to{' '}
                                    <span className="font-bold text-[#7B122F]">
                                        {selectedRequestAction === 'APPROVE'
                                            ? 'APPROVE'
                                            : 'REJECT'}
                                    </span>{' '}
                                    this pending request?
                                </p>
                                <p className="font-semibold text-slate-900">
                                    {selectedRequestUserName || 'Unknown User'}
                                </p>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={() => {
                                    setRequestConfirmOpen(false);
                                    setSelectedRequestId(null);
                                    setSelectedRequestUserName(null);
                                    setSelectedRequestAction(null);
                                }}
                                isDisabled={pendingLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-[#7B122F] text-white"
                                onPress={confirmRequestAction}
                                isLoading={pendingLoading}
                            >
                                Confirm
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                <Modal
                    isOpen={deleteConfirmOpen}
                    onClose={() => {
                        if (isDeleting) return;
                        setDeleteConfirmOpen(false);
                        setSelectedUserId(null);
                        setSelectedUserName(null);
                        setSelectedUserEmail(null);
                    }}
                >
                    <ModalContent>
                        <ModalHeader className="font-bold">
                            Confirm Action
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-1 text-slate-700">
                                <p>
                                    Are you sure you want to{' '}
                                    <span className="font-bold text-[#7B122F]">
                                        DELETE
                                    </span>{' '}
                                    this user:
                                </p>
                                <p className="font-semibold text-slate-900">
                                    {selectedUserName || 'Unknown User'}
                                </p>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={() => {
                                    setDeleteConfirmOpen(false);
                                    setSelectedUserId(null);
                                    setSelectedUserName(null);
                                    setSelectedUserEmail(null);
                                }}
                                isDisabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-[#7B122F] text-white"
                                onPress={handleDeleteUser}
                                isLoading={isDeleting}
                            >
                                Confirm
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                <MHPSSLevel isOpen={isOpen} onOpenChange={onOpenChange} />
            </div>
        </div>
    );
};

export default UserTable;
