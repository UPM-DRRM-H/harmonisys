'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Skeleton,
    Tabs,
    Tab,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    useDisclosure,
    Divider,
} from '@heroui/react';
import {
    BarChart3,
    AlertTriangle,
    Heart,
    MapPin,
    ShieldCheck,
    Clock,
    PieChart,
    Users,
    Lightbulb,
    GlobeIcon,
} from 'lucide-react';
import type { Session } from 'next-auth';
import { UserType } from '@prisma/client';
import type { DashboardStats, DashboardChartsData } from '@/types';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const DashboardCharts = dynamic(() => import('./DashboardCharts'), {
    loading: () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3].map((i) => (
                <Card
                    key={i}
                    className="bg-white/80 backdrop-blur-xl shadow-xl border border-white/60 rounded-3xl"
                >
                    <CardBody className="p-6">
                        <div className="animate-pulse">
                            <div className="h-5 bg-slate-200 rounded-lg w-1/3 mb-4" />
                            <div className="h-56 bg-slate-200 rounded-2xl" />
                        </div>
                    </CardBody>
                </Card>
            ))}
        </div>
    ),
});

const getInitials = (name?: string | null) => {
    if (!name) return 'U';

    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
};

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    cardBg: string;
    cardBorder: string;
    subtitleBg: string;
    subtitleText: string;
    loading?: boolean;
    href?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    color,
    cardBg,
    cardBorder,
    subtitleBg,
    subtitleText,
    loading = false,
    href,
}) => {
    const router = useRouter();

    if (loading) {
        return (
            <Card className="rounded-[28px] bg-white/80 backdrop-blur-xl shadow-xl border border-white/30">
                <CardBody className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-3">
                            <Skeleton className="w-24 h-4 rounded-lg" />
                            <Skeleton className="w-20 h-10 rounded-lg" />
                            <Skeleton className="w-28 h-8 rounded-full" />
                        </div>
                        <Skeleton className="w-14 h-14 rounded-2xl" />
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card
            className={`
                rounded-[28px]
                shadow-lg hover:shadow-xl
                transition-all duration-300
                hover:-translate-y-1
                group cursor-pointer overflow-hidden
                ring-1 ring-white/80
                backdrop-blur-sm
                ${cardBg} ${cardBorder}
            `}
            isPressable={!!href}
            onPress={() => {
                if (href) router.push(href);
            }}
        >
            <CardBody className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/[0.22]" />
                <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/10 blur-2xl" />

                <div className="flex items-start justify-between relative z-10 gap-4">
                    <div className="space-y-4 min-w-0 w-full flex flex-col items-start">
                        <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-[0.18em] leading-tight whitespace-nowrap">
                            {title}
                        </p>

                        <p
                            className={`${
                                title === 'Recent Activity'
                                    ? 'text-xl sm:text-2xl'
                                    : 'text-4xl'
                            } font-black text-slate-900 leading-none whitespace-nowrap group-hover:scale-[1.02] transition-transform duration-300`}
                        >
                            {typeof value === 'number'
                                ? value.toLocaleString()
                                : value}
                        </p>

                        {subtitle ? (
                            <div
                                className={`inline-flex max-w-full items-center rounded-full px-3.5 py-1.5 ${subtitleBg}`}
                            >
                                <span
                                    className={`text-[13px] font-semibold leading-tight whitespace-nowrap ${subtitleText}`}
                                >
                                    {subtitle}
                                </span>
                            </div>
                        ) : null}
                    </div>

                    {/* Icon: hidden on mobile, shown on sm+ */}
                    <div
                        className={`hidden sm:flex shrink-0 p-4 rounded-3xl ${color} shadow-lg group-hover:scale-105 transition-all duration-300`}
                    >
                        {icon}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

interface ToolCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    stats: string;
    trend: string;
    color: string;
    href: string;
    loading?: boolean;
    status: 'operational' | 'warning' | 'error';
}

const ToolCard: React.FC<ToolCardProps> = ({
    title,
    description,
    icon,
    stats,
    trend,
    color,
    href,
    loading = false,
}) => {
    const router = useRouter();

    if (loading) {
        return (
            <Card className="bg-white/80 backdrop-blur-xl shadow-xl border border-white/30 rounded-[28px]">
                <CardBody className="p-6">
                    <div className="flex items-center gap-4 mb-5">
                        <Skeleton className="w-14 h-14 rounded-2xl" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="w-28 h-6 rounded-lg" />
                            <Skeleton className="w-3/4 h-4 rounded-lg" />
                        </div>
                    </div>

                    <Skeleton className="w-full h-4 rounded-lg mb-2" />
                    <Skeleton className="w-4/5 h-4 rounded-lg mb-6" />
                    <Divider className="mb-4" />

                    <div className="flex items-center justify-between">
                        <Skeleton className="w-16 h-8 rounded-lg" />
                        <Skeleton className="w-24 h-4 rounded-lg" />
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card
            className="bg-white/80 backdrop-blur-xl shadow-xl border border-white/30 rounded-[28px] hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
            isPressable
            onPress={() => router.push(href)}
        >
            <CardBody className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/10 group-hover:via-white/5 group-hover:to-white/10 transition-all duration-500" />

                <div className="relative z-10">
                    {/* Top row: icon + title */}
                    <div className="flex items-center gap-4 mb-5">
                        <div
                            className="p-1 rounded-2xl group-hover:scale-105 transition-all duration-300"
                        >
                            {icon}
                        </div>

                        <div className="min-w-0">
                            <h3 className="text-[28px] font-black text-slate-900 leading-none truncate">
                                {title}
                            </h3>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                        {description}
                    </p>

                    <Divider className="mb-4" />

                    {/* Stats */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-slate-900">
                                {stats}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                                {trend}
                            </span>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

interface DashboardProps {
    session: Session | null;
}

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
    const router = useRouter();
    const { isOpen, onOpenChange, onOpen } = useDisclosure();
    const { data: stats = null, isPending: loading } =
        useQuery<DashboardStats | null>({
            queryKey: ['dashboard-stats'],
            queryFn: async () => {
                const response = await fetch('/api/dashboard/stats');
                const result = await response.json();

                if (!result.success) {
                    throw new Error(
                        result.error || 'Failed to fetch dashboard stats'
                    );
                }

                return result.data;
            },
            staleTime: 2 * 60 * 1000,
        });

    const [selectedTab, setSelectedTab] = useState('overview');
    const [avatarError, setAvatarError] = useState(false);
    const [showActivitiesModal, setShowActivitiesModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<{action: string; tool: string; user: string; timestamp: string} | null>(null);

    const [isResponderIdleOpen, setIsResponderIdleOpen] = useState(false);
    const [showResponderTools, setShowResponderTools] = useState(false);

    // Role-based UI
    const role = session?.user?.role as UserType | undefined;
    const isAdmin = role === UserType.ADMIN;
    const isResponder = role === UserType.RESPONDER;
    const isStandard = role === UserType.STANDARD;

    const { data: chartsData = null } = useQuery<DashboardChartsData | null>({
        queryKey: ['dashboard-charts'],
        queryFn: async () => {
            const response = await fetch('/api/dashboard/charts');
            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.error || 'Failed to fetch dashboard charts'
                );
            }

            return result.data;
        },
        enabled: isAdmin && selectedTab === 'analytics',
        staleTime: 5 * 60 * 1000,
    });

    // "My dashboard" view for Responder + Standard
    const isPersonalDashboard = isResponder || isStandard;

    const currentUserEmail = session?.user?.email?.toLowerCase() || '';
    const currentUserName = session?.user?.name?.toLowerCase() || '';

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!isResponder && !isAdmin) return;

        const locationPromptShown = localStorage.getItem('locationPromptShown');
        const storedLocation = localStorage.getItem('userLocation');

        if (locationPromptShown || storedLocation) return;
        if (!navigator.geolocation) return;

        const geoTimer = setTimeout(() => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locationData = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        timestamp: Date.now(),
                    };

                    localStorage.setItem(
                        'userLocation',
                        JSON.stringify(locationData)
                    );
                    localStorage.setItem('locationPromptShown', 'true');
                },
                (error) => {
                    console.error('Error getting location:', error);
                    localStorage.setItem('locationPromptShown', 'true');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000,
                }
            );
        }, 1200);
        return () => clearTimeout(geoTimer);
    }, [isResponder, isAdmin]);

    useEffect(() => {
        if (!isResponder) return;

        let idleTimer: ReturnType<typeof setTimeout>;

        const startIdleTimer = () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                setShowResponderTools(false);
                setIsResponderIdleOpen(true);
            }, 30000); // 30 seconds
        };

        const handleUserActivity = () => {
            if (isResponderIdleOpen) return;
            startIdleTimer();
        };

        const activityEvents: Array<keyof WindowEventMap> = [
            'mousemove',
            'mousedown',
            'keydown',
            'scroll',
            'touchstart',
            'click',
        ];

        startIdleTimer();

        activityEvents.forEach((event) => {
            window.addEventListener(event, handleUserActivity);
        });

        return () => {
            clearTimeout(idleTimer);
            activityEvents.forEach((event) => {
                window.removeEventListener(event, handleUserActivity);
            });
        };
    }, [isResponder, isResponderIdleOpen]);

    const toolTheme = {
        irs: 'bg-gradient-to-br from-[#4A0A18] via-[#6B0F25] to-[#8B1538]',
        unahon: 'bg-gradient-to-br from-[#7A0C1E] via-[#991B1B] to-[#B91C1C]',
        misalud:
            'bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-600',
        hazardhunter:
            'bg-gradient-to-br from-[#5A3A1A] via-[#7B5A3A] to-[#9D7C5A]',
        redas: 'bg-gradient-to-br from-blue-800 via-blue-700 to-sky-600',
    } as const;

    const allTools = [
        {
            title: 'IRS',
            description:
                'Incident Reporting System for emergency drills and real-time incident tracking',
            icon: <Image src="/iris_logo.png" alt="IRS" width={40} height={40} className="w-10 h-10 object-contain" />,
            stats: stats?.overview.totalIncidents.toString() || '0',
            trend: stats?.recent.recentIncidents
                ? `+${stats.recent.recentIncidents} this month`
                : '0 this month',
            color: toolTheme.irs,
            href: '/overview/irs',
            status: 'operational' as const,
        },
        {
            title: 'REDAS',
            description:
                'Rapid Earthquake Damage Assessment System training programs',
            icon: <Image src="/redas/REDAS_logo_name.png" alt="REDAS" width={40} height={40} className="w-10 h-10 object-contain" />,
            stats: stats?.overview.redasTrainingSessions.toString() || '0',
            trend: 'Active training programs',
            color: toolTheme.redas,
            href: '/redas',
            status: 'operational' as const,
        },
        {
            title: 'Unahon',
            description:
                'Mental health screening tool for disaster-affected communities',
            icon: <Image src="/unahon_logo.png" alt="Unahon" width={80} height={80} className="w-16 h-16 object-contain rounded-full" />,
            stats: stats?.overview.totalUnahonAssessments.toString() || '0',
            trend: stats?.recent.recentUnahonAssessments
                ? `+${stats.recent.recentUnahonAssessments} this month`
                : '0 this month',
            color: toolTheme.unahon,
            href: '/unahon',
            status: 'operational' as const,
        },
        {
            title: 'Mi Salud',
            description:
                'Mental and physical health monitoring for disaster responders',
            icon: <Image src="/misalud_logo.png" alt="Mi Salud" width={40} height={40} className="w-10 h-10 object-contain" />,
            stats: stats?.overview.totalQuestionnaires.toString() || '0',
            trend: stats?.recent.recentSubmissions
                ? `+${stats.recent.recentSubmissions} this month`
                : '0 this month',
            color: toolTheme.misalud,
            href: '/misalud',
            status: 'operational' as const,
        },
        {
            title: 'HazardHunter',
            description:
                'Natural hazard assessment and risk analysis for Philippine locations',
            icon: <Image src="/hazardHunter_logo.png" alt="HazardHunter" width={40} height={40} className="w-10 h-10 object-contain" />,
            stats: 'Active',
            trend: 'Real-time monitoring',
            color: toolTheme.hazardhunter,
            href: '/hazardhunter',
            status: 'operational' as const,
        },
    ];

    // Tools visible by role:
    // - Standard: remove Mi Salud
    const tools = allTools.filter((t) => {
        if (isStandard && t.title === 'Mi Salud') return false;
        return true;
    });

    const allQuickActions = [
        {
            title: 'Report Incident',
            description: 'Create new incident report',
            icon: <AlertTriangle className="w-6 h-6" />,
            href: '/irs',
            color: 'bg-gradient-to-r from-[#7A0C1E] to-[#B91C1C] hover:from-[#6B0F25] hover:to-[#991B1B] text-white shadow-xl hover:shadow-2xl',
        },
        {
            title: 'Health Assessment',
            description: 'Mi Salud health screening',
            icon: <Heart className="w-6 h-6" />,
            href: '/misalud',
            color: 'bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl',
        },
        {
            title: 'Hazard Check',
            description: 'Assess location hazards',
            icon: <MapPin className="w-6 h-6" />,
            href: '/hazardhunter',
            color: 'bg-gradient-to-r from-[#5A3A1A] to-[#9D7C5A] hover:from-[#4A3223] hover:to-[#7B5A3A] text-white shadow-xl hover:shadow-2xl',
        },
        {
            title: 'Mental Screening',
            description: 'Start Unahon assessment',
            icon: <ShieldCheck className="w-6 h-6" />,
            href: '/unahon',
            color: 'bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white shadow-xl hover:shadow-2xl',
        },
    ];

    // Quick Actions visible by role:
    // - Standard: remove Health Assessment (Mi Salud)
    const quickActions = allQuickActions.filter((a) => {
        if (isStandard && a.href === '/misalud') return false;
        return true;
    });

    const responderIdleTools = [
        {
            title: 'Report Incident',
            description: 'Create new incident report',
            icon: <AlertTriangle className="w-6 h-6" />,
            href: '/irs',
            color: 'bg-gradient-to-r from-[#7A0C1E] to-[#B91C1C] hover:from-[#6B0F25] hover:to-[#991B1B] text-white shadow-xl hover:shadow-2xl',
        },
        {
            title: 'Mental Screening',
            description: 'Start Unahon assessment',
            icon: <ShieldCheck className="w-6 h-6" />,
            href: '/unahon',
            color: 'bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white shadow-xl hover:shadow-2xl',
        },
        {
            title: 'Health Assessment',
            description: 'Mi Salud health screening',
            icon: <Heart className="w-6 h-6" />,
            href: '/misalud',
            color: 'bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl',
        },
    ];

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formatTimeAgo = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60)
        );

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
    };

    // Best-effort "My recent activities"
    const myRecentActivities =
        stats?.recentActivities?.filter((a) => {
            const activityUser = (a.user || '').toLowerCase();
            if (!activityUser) return false;

            if (currentUserEmail && activityUser.includes(currentUserEmail))
                return true;

            if (currentUserName && activityUser.includes(currentUserName))
                return true;

            return false;
        }) || [];

    const responderMetrics: MetricCardProps[] = [
        {
            title: 'Total Incidents',
            value: stats?.overview.totalIncidents || 0,
            subtitle: 'Submitted reports',
            icon: <AlertTriangle className="w-7 h-7 text-white" />,
            color: 'bg-gradient-to-br from-[#7A0000] via-[#900000] to-[#A50000]',
            cardBg: 'bg-gradient-to-br from-[#B0122B]/8 via-[#B0122B]/4 to-white',
            cardBorder: 'border border-[#B0122B]/20',
            subtitleBg: 'bg-[#B0122B]/8 border border-[#B0122B]/18',
            subtitleText: 'text-[#8E1023]',
        },
        {
            title: 'Mi Salud Records',
            value: stats?.overview.totalQuestionnaires || 0,
            subtitle: 'Health Assessments',
            icon: <Heart className="w-7 h-7 text-white" />,
            color: 'bg-gradient-to-br from-[#900000] via-[#B00000] to-[#C40000]',
            cardBg: 'bg-gradient-to-br from-[#7A0C1E]/8 via-[#7A0C1E]/4 to-white',
            cardBorder: 'border border-[#7A0C1E]/20',
            subtitleBg: 'bg-[#7A0C1E]/8 border border-[#7A0C1E]/18',
            subtitleText: 'text-[#66101E]',
        },
        {
            title: 'Unahon Records',
            value: stats?.overview.totalUnahonAssessments || 0,
            subtitle: 'Submitted Assessments',
            icon: <ShieldCheck className="w-7 h-7 text-white" />,
            color: 'bg-gradient-to-br from-[#B00000] via-[#D00000] to-[#E00000]',
            cardBg: 'bg-gradient-to-br from-[#6B0F25]/8 via-[#6B0F25]/4 to-white',
            cardBorder: 'border border-[#6B0F25]/20',
            subtitleBg: 'bg-[#6B0F25]/8 border border-[#6B0F25]/18',
            subtitleText: 'text-[#5A1023]',
        },
        {
            title: 'Recent Activity',
            value: myRecentActivities.length
                ? formatTimeAgo(myRecentActivities[0].timestamp)
                : '—',
            subtitle: 'Latest action',
            icon: <Clock className="w-7 h-7 text-white" />,
            color: 'bg-gradient-to-br from-[#D00000] via-[#F00000] to-[#FF0000]',
            cardBg: 'bg-gradient-to-br from-[#5B0A0A]/8 via-[#5B0A0A]/4 to-white',
            cardBorder: 'border border-[#5B0A0A]/20',
            subtitleBg: 'bg-[#5B0A0A]/8 border border-[#5B0A0A]/18',
            subtitleText: 'text-[#5B0A0A]',
        },
    ];

    const standardMetrics: MetricCardProps[] = [
        {
            title: 'Total Incidents',
            value: stats?.overview.totalIncidents || 0,
            subtitle: 'Submitted reports',
            icon: <AlertTriangle className="w-7 h-7 text-white" />,
            color: 'bg-gradient-to-br from-[#B0122B] via-[#C4162F] to-[#D62839]',
            cardBg: 'bg-gradient-to-br from-[#B0122B]/8 via-[#B0122B]/4 to-white',
            cardBorder: 'border border-[#B0122B]/20',
            subtitleBg: 'bg-[#B0122B]/8 border border-[#B0122B]/18',
            subtitleText: 'text-[#8E1023]',
        },

        {
            title: 'Recent Activity',
            value: myRecentActivities.length
                ? formatTimeAgo(myRecentActivities[0].timestamp)
                : '—',
            subtitle: 'Latest action',
            icon: <Clock className="w-7 h-7 text-white" />,
            color: 'bg-gradient-to-br from-[#5B0A0A] via-[#741010] to-[#8E1717]',
            cardBg: 'bg-gradient-to-br from-[#5B0A0A]/8 via-[#5B0A0A]/4 to-white',
            cardBorder: 'border border-[#5B0A0A]/20',
            subtitleBg: 'bg-[#5B0A0A]/8 border border-[#5B0A0A]/18',
            subtitleText: 'text-[#5B0A0A]',
        },
    ];

    const adminMetrics = (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
                title="Total Users"
                value={stats?.overview.totalUsers || 0}
                subtitle="Active users"
                icon={<Users className="w-7 h-7 text-white" />}
                color="bg-gradient-to-br from-[#7A0000] via-[#900000] to-[#A50000]"
                cardBg="bg-gradient-to-br from-[#8B1538]/8 via-[#8B1538]/4 to-white"
                cardBorder="border border-[#8B1538]/20"
                subtitleBg="bg-[#8B1538]/8 border border-[#8B1538]/18"
                subtitleText="text-[#6B0F25]"
                loading={loading}
                href="/users"
            />

            <MetricCard
                title="Total Incidents"
                value={stats?.overview.totalIncidents || 0}
                subtitle="Recorded incidents"
                icon={<AlertTriangle className="w-7 h-7 text-white" />}
                color="bg-gradient-to-br from-[#900000] via-[#B00000] to-[#C40000]"
                cardBg="bg-gradient-to-br from-[#B0122B]/8 via-[#B0122B]/4 to-white"
                cardBorder="border border-[#B0122B]/20"
                subtitleBg="bg-[#B0122B]/8 border border-[#B0122B]/18"
                subtitleText="text-[#8E1023]"
                loading={loading}
                href="/irs/incidents/manage"
            />

            <MetricCard
                title="Mi Salud Records"
                value={stats?.overview.totalQuestionnaires || 0}
                subtitle="Health assessments"
                icon={<Heart className="w-7 h-7 text-white" />}
                color="bg-gradient-to-br from-[#B00000] via-[#D00000] to-[#E00000]"
                cardBg="bg-gradient-to-br from-[#7A0C1E]/8 via-[#7A0C1E]/4 to-white"
                cardBorder="border border-[#7A0C1E]/20"
                subtitleBg="bg-[#7A0C1E]/8 border border-[#7A0C1E]/18"
                subtitleText="text-[#66101E]"
                loading={loading}
                href="/misalud/manage"
            />

            <MetricCard
                title="Unahon records"
                value={stats?.overview.totalUnahonAssessments || 0}
                subtitle="Submitted assessments"
                icon={<ShieldCheck className="w-7 h-7 text-white" />}
                color="bg-gradient-to-br from-[#D00000] via-[#F00000] to-[#FF0000]"
                cardBg="bg-gradient-to-br from-[#6B0F25]/8 via-[#6B0F25]/4 to-white"
                cardBorder="border border-[#6B0F25]/20"
                subtitleBg="bg-[#6B0F25]/8 border border-[#6B0F25]/18"
                subtitleText="text-[#5A1023]"
                loading={loading}
                href="/unahon/manage"
            />
        </div>
    );

    const activitiesToShow =
        (isPersonalDashboard ? myRecentActivities : stats?.recentActivities) ||
        [];

    // ✅ metrics grid cols: Standard=3, Responder=4, Admin handled separately
    const metricsGridCols = isStandard ? 'lg:grid-cols-2' : 'lg:grid-cols-4';

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#fff4f4] via-[#ffeaea] to-[#fff7f7]">
            <div className="absolute inset-0 opacity-35">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-200/20 via-transparent to-red-200/20" />
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(127, 29, 29, 0.12) 1px, transparent 0)`,
                        backgroundSize: '22px 22px',
                    }}
                />
            </div>

            <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
                {/* Header */}
                <Card className="mb-8 rounded-[28px] overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-r from-[#5B0A0A] via-[#7A1111] to-[#A11B1B]">
                    <CardBody className="px-8 py-7 relative overflow-hidden">
                        <div
                            className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
                            style={{
                                backgroundImage: `
                                    repeating-radial-gradient(
                                        circle at 0 0,
                                        rgba(255,255,255,0.15),
                                        rgba(255,255,255,0.15) 1px,
                                        transparent 1px,
                                        transparent 2px
                                    )
                                `,
                                backgroundSize: '4px 4px',
                            }}
                        />
                        <div
                            className="pointer-events-none absolute inset-0 opacity-[0.06]"
                            style={{
                                backgroundImage: `
                                    linear-gradient(
                                        135deg,
                                        rgba(255,255,255,0.25),
                                        transparent 60%
                                    )
                                `,
                            }}
                        />
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 lg:gap-5">
                                    <div className="relative shrink-0">
                                        <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm">
                                            {!avatarError &&
                                            session?.user?.image ? (
                                                <Image
                                                    src={session.user.image}
                                                    alt={
                                                        session?.user?.name ||
                                                        'User avatar'
                                                    }
                                                    fill
                                                    sizes="64px"
                                                    className="object-cover"
                                                    onError={() =>
                                                        setAvatarError(true)
                                                    }
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/20 to-white/5 text-lg font-extrabold text-white">
                                                    {getInitials(
                                                        session?.user?.name
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow" />
                                    </div>

                                    <div className="min-w-0">
                                        <h1 className="text-3xl lg:text-5xl font-black text-white leading-tight tracking-[-0.02em]">
                                            {getGreeting()},{' '}
                                            {
                                                (
                                                    session?.user?.name ||
                                                    'User'
                                                ).split(' ')[0]
                                            }
                                            !
                                        </h1>

                                        <p className="text-white/85 text-lg mt-1">
                                            Welcome to your DRRM-H Dashboard
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    className="font-bold bg-white text-[#7A1111] hover:bg-rose-50 min-w-[180px] h-12 px-6 rounded-[18px] shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                                    size="lg"
                                    startContent={
                                        <Lightbulb className="w-5 h-5 text-[#7A0C1E]" />
                                    }
                                    onPress={onOpen}
                                >
                                    Quick Actions
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Metrics */}
                {isAdmin ? (
                    adminMetrics
                ) : (
                    <div
                        className={`grid grid-cols-1 md:grid-cols-2 ${metricsGridCols} gap-6 mb-8`}
                    >
                        {(isResponder ? responderMetrics : standardMetrics).map(
                            (m, idx) => (
                                <MetricCard
                                    key={idx}
                                    title={m.title}
                                    value={m.value}
                                    subtitle={m.subtitle}
                                    icon={m.icon}
                                    color={m.color}
                                    cardBg={m.cardBg}
                                    cardBorder={m.cardBorder}
                                    subtitleBg={m.subtitleBg}
                                    subtitleText={m.subtitleText}
                                    loading={loading}
                                />
                            )
                        )}
                    </div>
                )}

                {/* ✅ Standard: remove Overview/Tabs completely */}
                {!isStandard && (
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
                            cursor: 'bg-gradient-to-r from-[#7A0C1E] to-[#B91C1C] shadow-lg',
                            panel: 'pt-4',
                        }}
                    >
                        <Tab
                            key="overview"
                            title={
                                <div className="flex items-center gap-2 px-2">
                                    <BarChart3 className="w-5 h-5" />
                                    <span className="hidden sm:inline">
                                        Overview
                                    </span>
                                </div>
                            }
                        >
                            <div className="space-y-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <h2 className="text-3xl font-black text-slate-900">
                                            DRRM Tools Status
                                        </h2>
                                        <div className="flex-1 h-px bg-gradient-to-r from-rose-300 to-transparent" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {tools.map((tool, index) => (
                                            <ToolCard
                                                key={index}
                                                {...tool}
                                                loading={loading}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <Card className="bg-white/80 backdrop-blur-xl shadow-2xl border border-rose-100/80 rounded-[28px] overflow-hidden">
                                    <CardHeader className="pb-4 pt-6 px-6">
                                        <div className="flex items-center gap-3 w-full">
                                            <h3 className="text-2xl font-black text-slate-900">
                                                {isPersonalDashboard
                                                    ? 'My Recent Activities'
                                                    : 'Recent Activities'}
                                            </h3>
                                            <div className="flex-1 h-px bg-gradient-to-r from-[#B0122B]/25 to-transparent" />
                                            {/* Mobile view all button */}
                                            <button
                                                className="sm:hidden text-xs font-semibold text-[#7A0C1E] underline underline-offset-2"
                                                onClick={() => setShowActivitiesModal(true)}
                                            >
                                                View all
                                            </button>
                                        </div>
                                    </CardHeader>
                                    <CardBody className="px-6 pb-6">
                                        <div className="space-y-4">
                                            {activitiesToShow.length ? (
                                                activitiesToShow
                                                    .slice(0, 5)
                                                    .map((activity, index) => (
                                                        <div
                                                            key={index}
                                                            onClick={() => setSelectedActivity(activity)}
                                                            className="
                                                            group relative flex items-center gap-4
                                                            rounded-2xl border border-rose-200/70
                                                            bg-gradient-to-r from-[#B0122B]/[0.04] via-white to-white
                                                            px-5 py-5
                                                            transition-all duration-300
                                                            hover:-translate-y-0.5
                                                            hover:shadow-lg
                                                            hover:border-[#B0122B]/25
                                                            cursor-pointer
                                                        "
                                                        >
                                                            <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-gradient-to-b from-[#7A0C1E] to-[#B91C1C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                                            <div className="shrink-0 p-3 rounded-2xl bg-gradient-to-br from-[#FBE4E8] to-[#F6D4DA] shadow-sm border border-rose-100">
                                                                <Clock className="w-5 h-5 text-[#B0122B]" />
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-slate-900 text-[15px] sm:text-[16px] leading-snug">
                                                                    {
                                                                        activity.action
                                                                    }
                                                                </p>
                                                                <p className="text-sm text-slate-600 mt-1 truncate">
                                                                    <span className="font-medium text-[#7A0C1E]">
                                                                        {
                                                                            activity.tool
                                                                        }
                                                                    </span>{' '}
                                                                    •{' '}
                                                                    {
                                                                        activity.user
                                                                    }
                                                                </p>
                                                            </div>

                                                            <div className="shrink-0">
                                                                <div className="px-3 py-1.5 rounded-full bg-[#B0122B]/8 border border-[#B0122B]/12 text-[13px] font-semibold text-[#7A0C1E] whitespace-nowrap">
                                                                    {formatTimeAgo(
                                                                        activity.timestamp
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                            ) : (
                                                <div className="text-center py-10 text-slate-500">
                                                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FBE4E8] to-[#F6D4DA]">
                                                        <Clock className="w-7 h-7 text-[#B0122B]" />
                                                    </div>
                                                    <p className="font-medium">
                                                        No recent activities
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        </Tab>

                        {isAdmin && (
                            <Tab
                                key="analytics"
                                title={
                                    <div className="flex items-center gap-2 px-2">
                                        <PieChart className="w-5 h-5" />
                                        <span className="hidden sm:inline">
                                            Analytics
                                        </span>
                                    </div>
                                }
                            >
                                <DashboardCharts chartsData={chartsData} />
                            </Tab>
                        )}
                    </Tabs>
                )}

                {/* ✅ Standard: still show My Recent Activities (below metrics) */}
                {isStandard && (
                    <Card className="bg-white/80 backdrop-blur-xl shadow-2xl border border-rose-100/80 rounded-[28px] overflow-hidden">
                        <CardHeader className="pb-4 pt-6 px-6">
                            <div className="flex items-center gap-3 w-full">
                                <h3 className="text-2xl font-black text-slate-900">
                                    My Recent Activities
                                </h3>
                                <div className="flex-1 h-px bg-gradient-to-r from-[#B0122B]/25 to-transparent" />
                            </div>
                        </CardHeader>

                        <CardBody className="px-6 pb-6">
                            <div className="space-y-4">
                                {activitiesToShow.length ? (
                                    activitiesToShow
                                        .slice(0, 5)
                                        .map((activity, index) => (
                                            <div
                                                key={index}
                                                onClick={() => setSelectedActivity(activity)}
                                                className="
                                                group relative flex items-center gap-4
                                                rounded-2xl border border-rose-200/70
                                                bg-gradient-to-r from-[#B0122B]/[0.04] via-white to-white
                                                px-5 py-5
                                                transition-all duration-300
                                                hover:-translate-y-0.5
                                                hover:shadow-lg
                                                hover:border-[#B0122B]/25
                                                cursor-pointer
                                            "
                                            >
                                                <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-gradient-to-b from-[#7A0C1E] to-[#B91C1C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                                <div className="shrink-0 p-3 rounded-2xl bg-gradient-to-br from-[#FBE4E8] to-[#F6D4DA] shadow-sm border border-rose-100">
                                                    <Clock className="w-5 h-5 text-[#B0122B]" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-900 text-[15px] sm:text-[16px] leading-snug">
                                                        {activity.action}
                                                    </p>
                                                    <p className="text-sm text-slate-600 mt-1 truncate">
                                                        <span className="font-medium text-[#7A0C1E]">
                                                            {activity.tool}
                                                        </span>{' '}
                                                        • {activity.user}
                                                    </p>
                                                </div>

                                                <div className="shrink-0">
                                                    <div className="px-3 py-1.5 rounded-full bg-[#B0122B]/8 border border-[#B0122B]/12 text-[13px] font-semibold text-[#7A0C1E] whitespace-nowrap">
                                                        {formatTimeAgo(
                                                            activity.timestamp
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="text-center py-10 text-slate-500">
                                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FBE4E8] to-[#F6D4DA]">
                                            <Clock className="w-7 h-7 text-[#B0122B]" />
                                        </div>
                                        <p className="font-medium">
                                            No recent activities
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}

                <Modal
                    isOpen={isResponderIdleOpen}
                    onOpenChange={(open) => {
                        setIsResponderIdleOpen(open);
                        if (!open) {
                            setShowResponderTools(false);
                        }
                    }}
                    size="md"
                    classNames={{
                        backdrop: 'bg-black/40 backdrop-blur-sm',
                        base: 'border-0 bg-white/95 backdrop-blur-xl shadow-2xl',
                        header: 'border-b border-rose-100',
                        body: 'py-6',
                    }}
                >
                    <ModalContent>
                        <ModalHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-rose-100 to-red-100 rounded-xl">
                                    <Lightbulb className="w-6 h-6 text-rose-700" />
                                </div>
                                <h2 className="text-[24px] font-bold text-slate-900">
                                    Are you Responding Now?
                                </h2>
                            </div>
                        </ModalHeader>

                        <ModalBody>
                            {!showResponderTools ? (
                                <div className="space-y-4">
                                    <p className="text-slate-600 text-base">
                                        You’ve been idle for a while. Do you
                                        want quick access to responder tools?
                                    </p>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button
                                            className="bg-gradient-to-r from-[#7A0C1E] to-[#B91C1C] text-white font-bold"
                                            onPress={() =>
                                                setShowResponderTools(true)
                                            }
                                        >
                                            Yes
                                        </Button>

                                        <Button
                                            variant="flat"
                                            className="font-semibold"
                                            onPress={() => {
                                                setIsResponderIdleOpen(false);
                                                setShowResponderTools(false);
                                            }}
                                        >
                                            No
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-slate-600 text-base">
                                        Choose a responder tool to continue.
                                    </p>

                                    <div className="grid grid-cols-1 gap-4">
                                        {responderIdleTools.map(
                                            (action, index) => (
                                                <Button
                                                    key={index}
                                                    className={`${action.color} font-bold h-20 text-left transition-all duration-300 transform hover:scale-[1.02]`}
                                                    onPress={() => {
                                                        router.push(
                                                            action.href
                                                        );
                                                        setIsResponderIdleOpen(
                                                            false
                                                        );
                                                        setShowResponderTools(
                                                            false
                                                        );
                                                    }}
                                                    startContent={
                                                        <div className="p-2 bg-white/20 rounded-lg">
                                                            {action.icon}
                                                        </div>
                                                    }
                                                >
                                                    <div className="flex flex-col items-start">
                                                        <div className="font-bold text-lg">
                                                            {action.title}
                                                        </div>
                                                        <div className="text-sm opacity-90 font-normal">
                                                            {action.description}
                                                        </div>
                                                    </div>
                                                </Button>
                                            )
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            variant="flat"
                                            className="font-semibold"
                                            onPress={() =>
                                                setShowResponderTools(false)
                                            }
                                        >
                                            Back
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </ModalBody>
                    </ModalContent>
                </Modal>

                {/* Quick Actions Modal */}
                <Modal
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                    size="3xl"
                    classNames={{
                        backdrop:
                            'bg-gradient-to-t from-black/50 to-black/10 backdrop-opacity-20',
                        base: 'border-0 bg-white/95 backdrop-blur-xl shadow-2xl',
                        header: 'border-b border-rose-100',
                        body: 'py-6',
                    }}
                >
                    <ModalContent>
                        <ModalHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-rose-100 to-red-100 rounded-xl">
                                    <Lightbulb className="w-6 h-6 text-rose-700" />
                                </div>
                                <h2 className="text-2xl font-black">
                                    Quick Actions
                                </h2>
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {quickActions.map((action, index) => (
                                    <Button
                                        key={index}
                                        className={`${action.color} font-bold h-20 text-left transition-all duration-300 transform hover:scale-[1.02]`}
                                        onPress={() => {
                                            router.push(action.href);
                                            onOpenChange();
                                        }}
                                        startContent={
                                            <div className="p-2 bg-white/20 rounded-lg">
                                                {action.icon}
                                            </div>
                                        }
                                    >
                                        <div className="flex flex-col items-start">
                                            <div className="font-bold text-lg">
                                                {action.title}
                                            </div>
                                            <div className="text-sm opacity-90 font-normal">
                                                {action.description}
                                            </div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </div>

            {/* Mobile Recent Activities Modal */}
            {showActivitiesModal && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowActivitiesModal(false)}
                >
                    <div
                        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[80vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
                            <h3 className="text-xl font-black text-slate-900">
                                {isPersonalDashboard ? 'My Recent Activities' : 'Recent Activities'}
                            </h3>
                            <button
                                onClick={() => setShowActivitiesModal(false)}
                                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            {activitiesToShow.length ? activitiesToShow.slice(0, 10).map((activity, index) => (
                                <div key={index} onClick={() => { setSelectedActivity(activity); setShowActivitiesModal(false); }} className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3 cursor-pointer hover:bg-rose-100/50 transition-colors">
                                    <div className="shrink-0 p-2 rounded-xl bg-gradient-to-br from-[#FBE4E8] to-[#F6D4DA] border border-rose-100">
                                        <Clock className="w-4 h-4 text-[#B0122B]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 text-sm leading-snug">{activity.action}</p>
                                        <p className="text-xs text-slate-600 mt-0.5">
                                            <span className="font-medium text-[#7A0C1E]">{activity.tool}</span> • {activity.user}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">{formatTimeAgo(activity.timestamp)}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-slate-500 py-8 text-sm">No recent activities.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Detail Modal */}
            {selectedActivity && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => setSelectedActivity(null)}
                >
                    <div
                        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-gradient-to-r from-[#5B0A0A] via-[#7A1111] to-[#A11B1B] px-6 py-5 flex items-center justify-between">
                            <h3 className="text-lg font-black text-white">Activity Details</h3>
                            <button onClick={() => setSelectedActivity(null)} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 space-y-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Action</p>
                                    <p className="font-bold text-slate-900">{selectedActivity.action}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Tool</p>
                                    <p className="font-semibold text-[#7A0C1E]">{selectedActivity.tool}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">User</p>
                                    <p className="font-medium text-slate-800">{selectedActivity.user}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Time</p>
                                    <p className="font-medium text-slate-800">{formatTimeAgo(selectedActivity.timestamp)}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{new Date(selectedActivity.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedActivity(null)}
                                className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#7A0C1E] to-[#A11B1B] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
