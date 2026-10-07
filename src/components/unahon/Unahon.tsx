'use client';

import { CountBars } from '@/components/charts/ReadableCharts';
import { getUnahonFormsSummary } from '@/lib/action/unahon';
import type { UnahonDashboardProps, UnahonSummary, UnahonProps } from '@/types';
import { Skeleton, Card, CardBody, CardHeader, Button } from '@heroui/react';
import {
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LabelList,
} from 'recharts';

import {
    BellRing,
    AlertTriangle,
    ShieldCheck,
    FileText,
    ArrowLeft,
} from 'lucide-react';
import { AssessmentType } from '@prisma/client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import UnahonForm from '@/components/unahon/UnahonForm';
import Link from 'next/link';

const Unahon = ({ session }: UnahonDashboardProps) => {
    const {
        data: unahonDashboardData,
        isLoading,
        isError: summaryError,
        refetch: refetchUnahonDashboard,
    } = useQuery({
        queryKey: ['unahon-dashboard', session?.user?.id, session?.user?.role],
        queryFn: async () => {
            const [summaryData, pendingRes] = await Promise.all([
                getUnahonFormsSummary(),
                fetch('/api/unahon/reassess/pending'),
            ]);

            const pendingData = await pendingRes.json();

            return {
                summary: summaryData,
                hasPendingReassessment:
                    pendingRes.ok && pendingData.hasPending ? true : false,
                pendingRequest:
                    pendingRes.ok && pendingData.hasPending
                        ? pendingData.pendingRequest
                        : null,
            };
        },
        staleTime: 2 * 60 * 1000,
    });

    const summary = unahonDashboardData?.summary ?? null;
    const hasPendingReassessment =
        unahonDashboardData?.hasPendingReassessment ?? false;
    const pendingRequest = unahonDashboardData?.pendingRequest ?? null;

    const [showManagement, setShowManagement] = useState(true);

    const [isUnahonView, setIsUnahonView] = useState<boolean>(false);
    const [isReassessment, setIsReassessment] = useState<boolean>(false);

    const [currentUnahonProps, setCurrentUnahonProps] = useState<UnahonProps>({
        session: session!,
        isViewOnly: false,
        isReassessment: false,
    });

    const router = useRouter();
    useEffect(() => {
        router.prefetch('/unahon/form');
    }, [router]);

    const userRole = session?.user?.role;
    const isResponderView = userRole === 'RESPONDER';

    // ✅ Unahon red theme tokens
    const BG = 'bg-gradient-to-br from-rose-50 via-red-50 to-amber-50';
    const TITLE_GRADIENT = 'from-[#7A0C1E] via-[#991B1B] to-[#B91C1C]';
    const ACCENT_BAR = 'from-[#991B1B] to-[#B91C1C]';

    // ✅ Better-looking Go Back (light red, cleaner)
    const GO_BACK =
        'h-12 bg-white/70 backdrop-blur-sm border border-[#B91C1C]/25 text-[#7A0C1E] ' +
        'hover:bg-[#B91C1C]/10 hover:border-[#B91C1C]/40 font-semibold ' +
        'transition-all duration-500 ' +
        'shadow-md hover:shadow-xl transform hover:-translate-y-1 hover:scale-105';

    const displaySummary = summary;

    // ✅ Header gradient card + pill buttons (red theme)
    const HERO_CARD =
        'rounded-3xl overflow-hidden border border-white/20 ' +
        'bg-gradient-to-r from-[#7A0C1E] via-[#991B1B] to-[#B91C1C] ' +
        'shadow-[0_18px_45px_rgba(0,0,0,0.22)]';

    const HERO_TITLE = 'text-white';
    const HERO_SUBTITLE = 'text-white/85';

    // pill glass (like your green sample, but red)
    const HERO_BTN_BASE =
        'h-12 px-6 rounded-2xl font-semibold ' +
        'backdrop-blur-sm transition-all duration-300 ' +
        'shadow-[0_10px_24px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.22)] ' +
        'transform hover:-translate-y-0.5';

    const HERO_BTN_OUTLINE =
        HERO_BTN_BASE +
        ' bg-white/10 text-white border border-white/35 hover:bg-white/15';

    const HERO_BTN_SOLID =
        HERO_BTN_BASE +
        ' bg-white text-[#7A0C1E] border border-white/20 hover:bg-white/90';

    const handleManagementStateChange = (isViewing: boolean) => {
        setShowManagement(!isViewing);
    };

    const handleUnahonStateChange = (
        isViewing: boolean,
        isReassessing: boolean,
        props?: UnahonProps
    ) => {
        setIsUnahonView(isViewing);
        setIsReassessment(isReassessing);
        if (props) {
            setCurrentUnahonProps(props);
        }
    };

    const handleReturnToManagement = async () => {
        setIsUnahonView(false);
        setIsReassessment(false);
        setCurrentUnahonProps({
            session: session!,
            isViewOnly: false,
            isReassessment: false,
        });

        await refetchUnahonDashboard();
    };

    const handleStartReassessment = () => {
        const location = session?.user?.region || 'Unknown';

        setCurrentUnahonProps({
            session: session!,
            isViewOnly: false,
            isReassessment: true,
            clientConfidentialForm: {
                client: pendingRequest?.client || '',
                userId: session!.user.id!,
                location,
                date: new Date(),
                affiliation:
                    pendingRequest?.affiliation ||
                    (session?.user as any)?.responderOrganization ||
                    '',
                assessmentType: AssessmentType.RE_ASSESSMENT,
                availablePatientIds: [],
            },
        });

        setIsReassessment(true);
    };

    if (isUnahonView || isReassessment) {
        if (summaryError)
            return (
                <div
                    role="alert"
                    className="mx-auto my-10 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6"
                >
                    <h1 className="font-bold text-amber-950">
                        Assessment summary could not be loaded
                    </h1>
                    <p className="mt-2 text-sm text-amber-900">
                        Check your connection and retry. An unavailable source
                        is not a zero count.
                    </p>
                    <button
                        onClick={() => void refetchUnahonDashboard()}
                        className="mt-4 rounded-lg bg-[#77152d] px-4 py-2 text-sm text-white"
                    >
                        Retry assessment summary
                    </button>
                </div>
            );
        return (
            <UnahonForm
                {...currentUnahonProps}
                onReturnToManagement={handleReturnToManagement}
            />
        );
    }

    if (isLoading) {
        return (
            <div className={`min-h-screen ${BG}`}>
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <Card className={`mb-8 ${HERO_CARD}`}>
                        <CardBody className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <h1
                                        className={`text-4xl lg:text-5xl font-black mb-2 ${HERO_TITLE}`}
                                    >
                                        Unahon Dashboard
                                    </h1>
                                    <p className={`text-lg ${HERO_SUBTITLE}`}>
                                        Comprehensive overview of assessment
                                        data and analytics
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                                    {!isResponderView && (
                                        <Button
                                            as={Link}
                                            href="/overview/unahon"
                                            variant="bordered"
                                            startContent={
                                                <ArrowLeft className="w-4 h-4 text-white" />
                                            }
                                            className={HERO_BTN_OUTLINE}
                                        >
                                            Go Back
                                        </Button>
                                    )}

                                    <Skeleton className="h-12 w-[180px] rounded-2xl" />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <div
                                className={`w-1 h-8 bg-gradient-to-b ${ACCENT_BAR} rounded-full`}
                            />
                            Assessment Summary
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <Card
                                    key={index}
                                    className="shadow-lg border border-white/20 bg-white/70 backdrop-blur-sm ring-2 ring-white/70"
                                >
                                    <CardBody className="p-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Skeleton className="w-14 h-14 rounded-xl" />
                                            <div className="flex-1">
                                                <Skeleton className="w-32 h-6 rounded-lg mb-2" />
                                                <Skeleton className="w-24 h-4 rounded-lg" />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <Skeleton className="w-16 h-12 rounded-lg mb-2" />
                                            <Skeleton className="w-12 h-6 rounded-lg" />
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <Skeleton className="w-full h-2 rounded-full" />
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <div
                                className={`w-1 h-8 bg-gradient-to-b ${ACCENT_BAR} rounded-full`}
                            />
                            Assessment Distribution
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                                <CardHeader className="text-center">
                                    <h3 className="w-full text-xl font-bold text-slate-800 text-center">
                                        Assessment Type
                                    </h3>
                                </CardHeader>
                                <CardBody className="p-6">
                                    <Skeleton className="h-80 rounded-lg" />
                                </CardBody>
                            </Card>

                            <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                                <CardHeader className="text-center">
                                    <h3 className="w-full text-xl font-bold text-slate-800 text-center">
                                        Assessment Level
                                    </h3>
                                </CardHeader>
                                <CardBody className="p-6">
                                    <Skeleton className="h-80 rounded-lg" />
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${BG}`}>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* ✅ REMOVED top Go Back button */}

                {showManagement && (
                    <>
                        {hasPendingReassessment && (
                            <Card className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-lg">
                                <CardBody className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-amber-800 mb-2">
                                                Reassessment Required
                                            </h2>
                                            <p className="text-amber-700">
                                                An administrator requested that
                                                you complete a Unahon
                                                reassessment.
                                            </p>
                                        </div>

                                        <Button
                                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                                            size="lg"
                                            onPress={handleStartReassessment}
                                        >
                                            Start Reassessment
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                        {/* Header Section */}
                        <Card className={`mb-8 ${HERO_CARD}`}>
                            <CardBody className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div>
                                        <h1
                                            className={`text-4xl lg:text-5xl font-black mb-2 ${HERO_TITLE}`}
                                        >
                                            Unahon Dashboard
                                        </h1>
                                        <p
                                            className={`text-lg ${HERO_SUBTITLE}`}
                                        >
                                            Comprehensive overview of assessment
                                            data and analytics
                                        </p>
                                    </div>

                                    {/* Actions (Go Back beside Unahon Form) */}
                                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                                        {!isResponderView && (
                                            <Button
                                                as={Link}
                                                href="/overview/unahon"
                                                variant="bordered"
                                                startContent={
                                                    <ArrowLeft className="w-4 h-4 text-white" />
                                                }
                                                className={HERO_BTN_OUTLINE}
                                            >
                                                Go Back
                                            </Button>
                                        )}

                                        <Button
                                            as={Link}
                                            href="/unahon/form"
                                            className={`${HERO_BTN_SOLID} min-w-[180px]`}
                                            size="lg"
                                            endContent={
                                                <FileText className="w-5 h-5" />
                                            }
                                        >
                                            Unahon Form
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Summary Cards */}
                        {displaySummary && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <div
                                        className={`w-1 h-8 bg-gradient-to-b ${ACCENT_BAR} rounded-full`}
                                    />
                                    Assessment Summary
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {[
                                        {
                                            name: 'Red Assessments',
                                            label: 'Critical Attention',
                                            value: displaySummary.redCount,
                                            icon: BellRing,

                                            // IRSOverview-style card
                                            cardBg: 'bg-gradient-to-br from-red-500/15 via-red-500/10 to-red-500/5 to-white/60',
                                            cardBorder:
                                                'border border-red-500/20',

                                            // IRSOverview-style icon wrapper
                                            iconBg: 'bg-red-500/25',
                                            iconColor: 'text-red-600',

                                            // IRSOverview-style bar
                                            barTrack: 'bg-red-500/15',
                                            barFill: 'bg-red-500',
                                        },
                                        {
                                            name: 'Yellow Assessments',
                                            label: 'Needs Attention',
                                            value: displaySummary.yellowCount,
                                            icon: AlertTriangle,

                                            cardBg: 'bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-amber-500/5 to-white/60',
                                            cardBorder:
                                                'border border-amber-500/20',

                                            iconBg: 'bg-amber-500/25',
                                            iconColor: 'text-amber-600',

                                            barTrack: 'bg-amber-500/15',
                                            barFill: 'bg-amber-500',
                                        },
                                        {
                                            name: 'Green Assessments',
                                            label: 'Minimal Attention',
                                            value: displaySummary.greenCount,
                                            icon: ShieldCheck,

                                            cardBg: 'bg-gradient-to-br from-green-500/15 via-green-500/10 to-green-500/5 to-white/60',
                                            cardBorder:
                                                'border border-green-500/20',

                                            iconBg: 'bg-green-500/25',
                                            iconColor: 'text-green-600',

                                            barTrack: 'bg-green-500/15',
                                            barFill: 'bg-green-500',
                                        },
                                        {
                                            name: 'No Assessments',
                                            label: 'No Data',
                                            value: displaySummary.noneCount,
                                            icon: FileText,

                                            cardBg: 'bg-gradient-to-br from-slate-500/12 via-slate-500/8 to-slate-500/5 to-white/60',
                                            cardBorder:
                                                'border border-slate-500/20',

                                            iconBg: 'bg-slate-500/20',
                                            iconColor: 'text-slate-700',

                                            barTrack: 'bg-slate-500/15',
                                            barFill: 'bg-slate-500',
                                        },
                                    ].map(
                                        (
                                            {
                                                name,
                                                label,
                                                value,
                                                cardBg,
                                                cardBorder,
                                                iconBg,
                                                iconColor,
                                                barTrack,
                                                barFill,
                                                icon: Icon,
                                            },
                                            index
                                        ) => (
                                            <Card
                                                key={index}
                                                className={`shadow-lg
${cardBg} ${cardBorder} 
ring-2 ring-white/70`}
                                            >
                                                <CardBody className="p-6">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div
                                                            className={`p-3 rounded-xl ${iconBg} shadow-md`}
                                                        >
                                                            <Icon
                                                                className={`w-5 h-5 ${iconColor}`}
                                                            />
                                                        </div>

                                                        <div>
                                                            <h3 className="text-lg font-semibold text-black">
                                                                {name}
                                                            </h3>
                                                            <p className="text-sm text-black">
                                                                {label}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mb-3">
                                                        <span className="text-4xl font-bold text-slate-900">
                                                            {value}
                                                        </span>
                                                        <span className="text-lg text-black ml-2">
                                                            forms
                                                        </span>
                                                    </div>

                                                    <div
                                                        className={`w-full rounded-full h-2 overflow-hidden ${barTrack}`}
                                                    >
                                                        <div
                                                            className={`h-2 rounded-full ${barFill} transition-all duration-500`}
                                                            style={{
                                                                width: `${Math.min(
                                                                    (value /
                                                                        Math.max(
                                                                            displaySummary.redCount +
                                                                                displaySummary.yellowCount +
                                                                                displaySummary.greenCount +
                                                                                displaySummary.noneCount,
                                                                            1
                                                                        )) *
                                                                        100,
                                                                    100
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Charts Section */}
                        {displaySummary && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <div
                                        className={`w-1 h-8 bg-gradient-to-b ${ACCENT_BAR} rounded-full`}
                                    />
                                    Assessment Distribution
                                </h2>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                    {/* Assessment Type */}
                                    <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                                        <CardHeader className="text-center">
                                            <h3 className="w-full text-xl font-bold text-slate-800 text-center">
                                                Assessment Type
                                            </h3>
                                        </CardHeader>

                                        <CardBody className="p-6">
                                            <div className="min-w-0">
                                                <CountBars
                                                    data={[
                                                        {
                                                            name: 'Initial assessment',
                                                            value: displaySummary.initialAssessment,
                                                            color: '#8B1538',
                                                        },
                                                        {
                                                            name: 'Reassessment',
                                                            value: displaySummary.reassessment,
                                                            color: '#2563EB',
                                                        },
                                                    ]}
                                                    unit="assessments"
                                                />
                                            </div>
                                        </CardBody>
                                    </Card>

                                    {/* Assessment Level */}
                                    <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                                        <CardHeader className="text-center">
                                            <h3 className="w-full text-xl font-bold text-slate-800 text-center">
                                                Assessment Level
                                            </h3>
                                        </CardHeader>

                                        <CardBody className="p-6">
                                            <div className="min-w-0">
                                                <CountBars
                                                    data={[
                                                        {
                                                            name: 'Red',
                                                            value: displaySummary.redCount,
                                                            color: '#BE123C',
                                                        },
                                                        {
                                                            name: 'Yellow',
                                                            value: displaySummary.yellowCount,
                                                            color: '#B7790E',
                                                        },
                                                        {
                                                            name: 'Green',
                                                            value: displaySummary.greenCount,
                                                            color: '#087F62',
                                                        },
                                                        {
                                                            name: 'No flagged category',
                                                            value: displaySummary.noneCount,
                                                            color: '#64748B',
                                                        },
                                                    ]}
                                                    unit="assessments"
                                                />
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Unahon;
