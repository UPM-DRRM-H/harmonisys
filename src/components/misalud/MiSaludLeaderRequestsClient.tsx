'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from 'next-auth';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Skeleton,
} from '@heroui/react';
import { CheckCircle2, XCircle, Users, Clock3 } from 'lucide-react';

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

type TeamInfo = {
    id: string;
    name: string;
};

interface Props {
    session: Session | null;
}

const MiSaludLeaderRequestsClient = ({ session }: Props) => {
    const queryClient = useQueryClient();

    const { data: leaderRequestsData, isLoading: loading } = useQuery<{
        requests: MiSaludRequest[];
        team: TeamInfo | null;
    }>({
        queryKey: ['misalud-leader-requests'],
        queryFn: async () => {
            const response = await fetch('/api/misalud/leader/requests');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch requests');
            }

            return {
                requests: result.requests || [],
                team: result.team || null,
            };
        },
        staleTime: 2 * 60 * 1000,
    });

    const requests = leaderRequestsData?.requests || [];
    const team = leaderRequestsData?.team || null;

    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleApprove = async (id: string) => {
        try {
            setProcessingId(id);

            const res = await fetch(`/api/misalud/leader/requests/${id}`, {
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

            await queryClient.invalidateQueries({
                queryKey: ['misalud-leader-requests'],
            });
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

    const handleReject = async (id: string) => {
        const rejectionReason = window.prompt(
            'Enter rejection reason (optional):'
        );

        try {
            setProcessingId(id);

            const res = await fetch(`/api/misalud/leader/requests/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'REJECT',
                    rejectionReason: rejectionReason || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to reject request');
            }

            await queryClient.invalidateQueries({
                queryKey: ['misalud-leader-requests'],
            });
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

    return (
        <div className="min-h-screen bg-emerald-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <Card className="mb-8 bg-white/70 backdrop-blur-sm shadow-lg border border-white/20 overflow-hidden rounded-[28px]">
                    <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600">
                        <div className="p-6">
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-black text-white mb-2">
                                    Team Requests
                                </h1>
                                <p className="text-white/85 text-lg">
                                    Review join requests for your Mi Salud
                                    team
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="mb-6 flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-100">
                        <Users className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">
                            {team
                                ? `${team.name} Requests`
                                : 'Pending Team Requests'}
                        </h2>
                        <p className="text-slate-600">
                            Approve or reject team member join requests
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {Array.from({ length: 3 }).map((_, index) => (
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
                        ))}
                    </div>
                ) : requests.length === 0 ? (
                    <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/20 rounded-2xl">
                        <CardBody className="p-12 text-center">
                            <Clock3 className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">
                                No Pending Requests
                            </h3>
                            <p className="text-slate-600">
                                There are currently no team member requests
                                waiting for review.
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

                                        <Chip color="warning" variant="flat">
                                            Pending Leader Review
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
                                                Team Member
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                                Submitted
                                            </p>
                                            <p className="font-bold text-slate-800">
                                                {new Date(
                                                    request.createdAt
                                                ).toLocaleDateString()}
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
                                                processingId === request.id
                                            }
                                            onPress={() =>
                                                handleReject(request.id)
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
                                                processingId === request.id
                                            }
                                            onPress={() =>
                                                handleApprove(request.id)
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
            </div>
        </div>
    );
};

export default MiSaludLeaderRequestsClient;
