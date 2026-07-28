'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, Skeleton } from '@heroui/react';
import { ClipboardList } from 'lucide-react';
import MiSaludRegistrationForm from './MiSaludRegistrationForm';

type MembershipResult = {
    status: 'NONE' | 'PENDING' | 'REJECTED' | 'APPROVED';
    membership: {
        requestedRole?: string;
        rejectionReason?: string | null;
    } | null;
    accountName?: string | null;
};

export default function MiSaludRegistrationGate() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);

    const { data, isLoading } = useQuery<MembershipResult>({
        queryKey: ['misalud-membership-gate'],
        queryFn: async () => {
            const res = await fetch('/api/misalud/membership');
            if (!res.ok) throw new Error('Failed to check membership');
            return res.json();
        },
        staleTime: 30 * 1000,
    });

    const handleSuccess = async () => {
        setShowForm(false);
        await queryClient.invalidateQueries({ queryKey: ['misalud-membership-gate'] });
    };

    // After approval the page-level server component needs a hard refresh
    // to re-route to the correct dashboard
    const status = data?.status ?? 'NONE';
    const accountName = data?.accountName ?? '';

    if (isLoading) {
        return (
            <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg rounded-2xl shadow-lg">
                    <CardBody className="p-8 space-y-4">
                        <Skeleton className="h-8 w-48 rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <Skeleton className="h-10 w-32 rounded-xl" />
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
            {/* Registration form overlay */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="bg-white shadow-2xl w-full max-w-xl">
                        <CardHeader className="pb-4 border-b border-slate-200">
                            <div className="flex items-center justify-between w-full">
                                <div>
                                    <h2 className="text-2xl font-bold text-emerald-700">
                                        Mi Salud Registration
                                    </h2>
                                    <p className="text-slate-600 text-sm mt-0.5">
                                        Register as a Team Leader or join an existing team.
                                    </p>
                                </div>
                                <Button
                                    isIconOnly
                                    variant="light"
                                    onPress={() => setShowForm(false)}
                                    aria-label="Close"
                                    className="hover:bg-red-100"
                                >
                                    <svg
                                        className="w-5 h-5 text-slate-400 hover:text-red-500"
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
                                onCancel={() => setShowForm(false)}
                                onSuccess={handleSuccess}
                                defaultName={accountName}
                            />
                        </CardBody>
                    </Card>
                </div>
            )}

            <Card className="w-full max-w-lg rounded-2xl shadow-lg border border-white/20">
                {/* Gradient header strip */}
                <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 rounded-t-2xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl">
                            <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white">Mi Salud</h1>
                    </div>
                </div>

                <CardBody className="p-6 text-center space-y-4">
                    {status === 'NONE' && (
                        <>
                            <h2 className="text-xl font-bold text-emerald-700">
                                Join Mi Salud
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Before accessing the dashboard, you need to register as a
                                Team Leader or join an existing team as a Team Member.
                            </p>
                            <Button
                                onPress={() => setShowForm(true)}
                                className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 text-white font-bold rounded-xl px-8"
                            >
                                Register Now
                            </Button>
                        </>
                    )}

                    {status === 'PENDING' && (
                        <>
                            <div className="text-4xl">⏳</div>
                            <h2 className="text-xl font-bold text-amber-600">
                                Request Pending
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {data?.membership?.requestedRole === 'TEAM_LEADER'
                                    ? 'Your team registration has been submitted and is awaiting admin approval. You will be able to access Mi Salud once approved.'
                                    : 'Your join request is waiting for your team leader to approve it.'}
                            </p>
                            <Button
                                variant="flat"
                                color="warning"
                                onPress={() => {
                                    queryClient.invalidateQueries({
                                        queryKey: ['misalud-membership-gate'],
                                    });
                                    router.refresh();
                                }}
                            >
                                Check Again
                            </Button>
                        </>
                    )}

                    {status === 'REJECTED' && (
                        <>
                            <div className="text-4xl">❌</div>
                            <h2 className="text-xl font-bold text-red-600">
                                Request Not Approved
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Your previous request was not approved. You may submit a new
                                request.
                            </p>
                            {data?.membership?.rejectionReason && (
                                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-left">
                                    <p className="text-xs font-semibold text-red-700 mb-1">
                                        Rejection Reason
                                    </p>
                                    <p className="text-sm text-red-600">
                                        {data.membership.rejectionReason}
                                    </p>
                                </div>
                            )}
                            <Button
                                onPress={() => setShowForm(true)}
                                className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 text-white font-bold rounded-xl px-8"
                            >
                                Submit Again
                            </Button>
                        </>
                    )}

                    {/* Approved — trigger a page refresh so the server re-routes */}
                    {status === 'APPROVED' && (
                        <>
                            <div className="text-4xl">✅</div>
                            <h2 className="text-xl font-bold text-emerald-700">
                                Approved!
                            </h2>
                            <p className="text-slate-600 text-sm">
                                Your membership was approved. Loading your dashboard…
                            </p>
                            <Button
                                color="success"
                                onPress={() => router.refresh()}
                            >
                                Go to Dashboard
                            </Button>
                        </>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
