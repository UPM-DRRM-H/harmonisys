'use client';
import { CountBars, ActivityTrend } from '@/components/charts/ReadableCharts';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardBody,
    CardHeader,
    Chip,
    Progress,
    Skeleton,
} from '@heroui/react';
import { Button } from '@heroui/react';
import {
    ArrowLeft,
    AlertTriangle,
    TrendingUp,
    Activity,
    BarChart3,
    MapPin,
    Target,
    Shield,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    LineChart,
    Line,
    Legend,
} from 'recharts';
import { colorTypes, Incident } from '@/types';
import { parseIncidentDates } from '@/lib/action/irs';
import RecentIncidents from './EventsDetailSections/RecentIncidents';

interface EventPageProps {
    teamDeployed: string;
}

interface MonthlyIncidentData {
    month: string;
    total: number;
}

interface TooltipPayload {
    name: string;
    value: number;
    color: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
}

const EventDetailPage = ({ teamDeployed }: EventPageProps) => {
    const router = useRouter();

    const [incidentsData, setIncidentsData] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchIncidentsData = async () => {
        try {
            const response = await fetch('/api/irs/incidents');
            if (!response.ok) throw new Error('Failed to fetch incidents data');
            const data = await response.json();
            setIncidentsData(data.map(parseIncidentDates));
        } catch (error) {
            console.error('Error fetching incidents data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncidentsData();
    }, []);

    const teamIncidents = useMemo(() => {
        return incidentsData.filter(
            (incident) => incident.teamDeployed === teamDeployed
        );
    }, [incidentsData, teamDeployed]);

    const categoryChartData = useMemo(() => {
        const categoryCount = teamIncidents.reduce(
            (acc, incident) => {
                acc[incident.category] = (acc[incident.category] || 0) + 1;
                return acc;
            },
            {} as { [key: string]: number }
        );

        return Object.entries(categoryCount).map(([category, count]) => ({
            category:
                category.length > 15
                    ? category.substring(0, 15) + '...'
                    : category,
            fullCategory: category,
            count,
        }));
    }, [teamIncidents]);

    const timelineChartData = useMemo(() => {
        const monthlyData = teamIncidents.reduce(
            (acc, incident) => {
                const date = new Date(incident.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                if (!acc[monthKey]) {
                    acc[monthKey] = { month: monthKey, total: 0 };
                }

                acc[monthKey].total++;
                return acc;
            },
            {} as { [key: string]: MonthlyIncidentData }
        );

        return Object.values(monthlyData).sort((a, b) =>
            a.month.localeCompare(b.month)
        );
    }, [teamIncidents]);

    const locationChartData = useMemo(() => {
        const locationCount = teamIncidents.reduce(
            (acc, incident) => {
                acc[incident.location] = (acc[incident.location] || 0) + 1;
                return acc;
            },
            {} as { [key: string]: number }
        );

        return Object.entries(locationCount)
            .map(([location, count]) => ({
                location:
                    location.length > 20
                        ? location.substring(0, 20) + '...'
                        : location,
                fullLocation: location,
                count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [teamIncidents]);

    const getOverallRiskScore = () => {
        if (teamIncidents.length === 0)
            return { score: 0, label: 'No Data', color: 'default' };

        const riskScore = Math.min((teamIncidents.length / 10) * 100, 100);

        if (riskScore >= 75)
            return { score: riskScore, label: 'High Risk', color: 'danger' };
        if (riskScore >= 50)
            return { score: riskScore, label: 'Medium Risk', color: 'warning' };
        if (riskScore >= 25)
            return { score: riskScore, label: 'Low Risk', color: 'primary' };
        return { score: riskScore, label: 'Minimal Risk', color: 'success' };
    };

    const riskScore = getOverallRiskScore();

    const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
        if (active && payload && payload.length) {
            return (
                <Card className="p-3 shadow-lg border">
                    <CardBody className="p-0">
                        <div className="space-y-1">
                            <p className="font-semibold text-sm">{label}</p>
                            {payload.map((entry, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between items-center"
                                >
                                    <span
                                        className="text-xs"
                                        style={{ color: entry.color }}
                                    >
                                        {entry.name}:
                                    </span>
                                    <span className="text-xs font-medium">
                                        {entry.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <Skeleton className="w-32 h-10 rounded-lg">
                                <div className="h-10" />
                            </Skeleton>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <Skeleton className="w-8 h-8 rounded">
                                <div className="h-8" />
                            </Skeleton>
                            <Skeleton className="w-64 h-8 rounded-lg">
                                <div className="h-8" />
                            </Skeleton>
                        </div>
                        <Skeleton className="w-80 h-4 rounded-lg">
                            <div className="h-4" />
                        </Skeleton>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Card
                                key={index}
                                className="bg-gradient-to-r from-gray-50 to-gray-100"
                            >
                                <CardBody className="flex flex-row items-center gap-3">
                                    <Skeleton className="w-10 h-10 rounded-lg">
                                        <div className="h-10" />
                                    </Skeleton>
                                    <div className="flex-1">
                                        <Skeleton className="w-20 h-3 rounded mb-1">
                                            <div className="h-3" />
                                        </Skeleton>
                                        <Skeleton className="w-12 h-6 rounded">
                                            <div className="h-6" />
                                        </Skeleton>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>

                    <Card className="mb-8">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-5 h-5 rounded">
                                    <div className="h-5" />
                                </Skeleton>
                                <Skeleton className="w-40 h-6 rounded-lg">
                                    <div className="h-6" />
                                </Skeleton>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <Card key={index} className="border">
                                        <CardBody>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <Skeleton className="w-48 h-6 rounded-lg mb-2">
                                                        <div className="h-6" />
                                                    </Skeleton>
                                                    <Skeleton className="w-full h-4 rounded-lg mb-2">
                                                        <div className="h-4" />
                                                    </Skeleton>
                                                </div>
                                                <Skeleton className="w-16 h-6 rounded-full">
                                                    <div className="h-6" />
                                                </Skeleton>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {Array.from({ length: 4 }).map(
                                                    (_, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Skeleton className="w-3 h-3 rounded">
                                                                <div className="h-3" />
                                                            </Skeleton>
                                                            <Skeleton className="w-20 h-3 rounded">
                                                                <div className="h-3" />
                                                            </Skeleton>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 pt-6">
                    <div className="mb-2 flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Team: {teamDeployed} - Incident Analysis
                                </h1>
                            </div>
                            <p className="mt-2 text-gray-600">
                                Aggregated incident data and risk analysis
                            </p>
                        </div>

                        <Button
                            variant="solid"
                            className="bg-rose-800 text-white hover:bg-rose-900 shrink-0"
                            startContent={<ArrowLeft className="w-4 h-4" />}
                            onPress={() => router.push('/incidents')}
                        >
                            Back to See Incidents
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-gradient-to-r from-red-50 to-red-100">
                        <CardBody className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-red-500 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Incidents
                                </p>
                                <p className="text-2xl font-bold text-red-700">
                                    {teamIncidents.length}
                                </p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
                        <CardBody className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-lg">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Locations
                                </p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {
                                        new Set(
                                            teamIncidents.map((i) => i.location)
                                        ).size
                                    }
                                </p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
                        <CardBody className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-purple-500 rounded-lg">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <Chip
                                    size="sm"
                                    color={riskScore.color as colorTypes}
                                    variant="flat"
                                >
                                    {riskScore.label}
                                </Chip>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {teamIncidents.length > 0 && (
                    <RecentIncidents
                        teamIncidents={teamIncidents}
                        loading={loading}
                    />
                )}

                {/* Risk Score */}
                <Card className="mb-8 border border-red-100 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-red-600" />
                            <h2 className="text-xl font-semibold text-gray-900">
                                Overall Risk Assessment
                            </h2>
                        </div>
                    </CardHeader>
                    <CardBody className="px-6 pb-6 pt-2">
                        <div className="w-full space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">
                                    Risk Score
                                </span>
                                <span className="text-2xl font-bold text-red-600">
                                    {riskScore.score.toFixed(0)}%
                                </span>
                            </div>
                            <Progress
                                size="lg"
                                value={riskScore.score}
                                color={riskScore.color as colorTypes}
                                showValueLabel={false}
                                className="w-full"
                                aria-labelledby="progress"
                                aria-valuenow={riskScore.score}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            />
                            <p className="text-sm text-gray-600 flex items-center gap-2 pt-1">
                                <BarChart3 className="w-4 h-4 text-red-500" />
                                Based on {teamIncidents.length} incidents
                                reported by this team
                            </p>
                        </div>
                    </CardBody>
                </Card>

                {/* Charts */}
                {teamIncidents.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Category Breakdown */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-red-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Incident Categories
                                    </h2>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className="w-full min-w-0">
                                    <CountBars
                                        data={categoryChartData.map((r) => ({
                                            name: r.fullCategory
                                                .toLowerCase()
                                                .replace(/_/g, ' '),
                                            value: r.count,
                                        }))}
                                        unit="incidents"
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        {/* Timeline */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-red-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Incident Timeline
                                    </h2>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className="w-full h-[400px]">
                                    <ActivityTrend
                                        rows={timelineChartData.map((r) => ({
                                            label: r.month,
                                            total: r.total,
                                        }))}
                                        series={[
                                            {
                                                key: 'total',
                                                label: 'Incidents',
                                            },
                                        ]}
                                    />
                                </div>
                            </CardBody>
                        </Card>

                        {/* Top Locations */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-red-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Top Incident Locations
                                    </h2>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className="w-full min-w-0">
                                    <CountBars
                                        data={locationChartData.map((r) => ({
                                            name: r.fullLocation,
                                            value: r.count,
                                        }))}
                                        unit="incidents shown"
                                    />
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                ) : (
                    <Card className="mb-8">
                        <CardBody className="text-center py-12">
                            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No Incidents Found
                            </h3>
                            <p className="text-gray-500">
                                No incident data available for Team{' '}
                                {teamDeployed}
                            </p>
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default EventDetailPage;
