'use client';
import { DashboardChartsData } from '@/types';
import {
    ActivityTrend,
    ChartCard,
    CountBars,
} from '@/components/charts/ReadableCharts';
const label = (value: string) =>
    value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
export default function DashboardCharts({
    chartsData,
    loading = false,
    error = false,
    onRetry,
}: {
    chartsData: DashboardChartsData | null;
    loading?: boolean;
    error?: boolean;
    onRetry?: () => void;
}) {
    if (error)
        return (
            <div
                role="alert"
                className="rounded-2xl border border-amber-200 bg-amber-50 p-6"
            >
                <h2 className="font-bold text-amber-950">
                    Analytics could not be loaded
                </h2>
                <p className="mt-2 text-sm text-amber-900">
                    Check your connection and retry. An unavailable source is
                    not a zero count.
                </p>
                <button
                    onClick={onRetry}
                    className="mt-4 rounded-lg bg-[#77152d] px-4 py-2 text-sm font-semibold text-white"
                >
                    Retry analytics
                </button>
            </div>
        );
    if (!chartsData)
        return (
            <div
                role="status"
                aria-label="Loading analytics"
                className="grid gap-5 lg:grid-cols-2"
            >
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-64 animate-pulse rounded-2xl border bg-slate-100 motion-reduce:animate-none"
                    />
                ))}
                <span className="sr-only">
                    {loading ? 'Loading analytics' : 'Preparing analytics'}
                </span>
            </div>
        );
    const categories = chartsData.distributions.category
        .map((r) => ({ name: label(r.name), value: r.value }))
        .sort((a, b) => b.value - a.value);
    const trends = chartsData.monthlyTrends.labels.map((name, i) => ({
        label: name,
        ...Object.fromEntries(
            chartsData.monthlyTrends.datasets.map((s, j) => [
                'series' + j,
                s.data[i] || 0,
            ])
        ),
    }));
    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Authorized record counts, clear comparisons and exact
                    values.
                </p>
            </div>
            <ChartCard
                title="Monthly activity"
                description="Last 12 calendar months, including the current month · Asia/Manila"
            >
                <ActivityTrend
                    rows={trends}
                    series={chartsData.monthlyTrends.datasets.map((s, j) => ({
                        key: 'series' + j,
                        label: s.label,
                    }))}
                />
            </ChartCard>
            <div className="grid min-w-0 gap-5 lg:grid-cols-2">
                <ChartCard
                    title="Incident categories"
                    description="All authorized incident records, grouped by category"
                >
                    <CountBars data={categories} unit="incidents" />
                </ChartCard>
                <ChartCard
                    title="Top reported locations"
                    description="Top 10 recorded locations; percentages refer to the locations shown"
                >
                    <CountBars
                        data={chartsData.topLocations}
                        unit="incidents shown"
                    />
                </ChartCard>
                <ChartCard
                    title="Assessment types"
                    description="Initial assessments compared with reassessments"
                >
                    <CountBars
                        data={chartsData.distributions.assessmentType.map(
                            (r) => ({ name: label(r.name), value: r.value })
                        )}
                        unit="assessments"
                    />
                </ChartCard>
                <ChartCard
                    title="Active accounts by role"
                    description="Approved active accounts; pending elevation remains Standard"
                >
                    <CountBars
                        data={chartsData.distributions.userRole.map((r) => ({
                            name: label(r.name),
                            value: r.value,
                        }))}
                        unit="active accounts"
                    />
                </ChartCard>
            </div>
        </div>
    );
}
