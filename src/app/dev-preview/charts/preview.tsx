'use client';
import { useState } from 'react';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import ParticipantCharts from '@/components/redas/ParticipantChart';
import {
    ChartCard,
    CountBars,
    WellnessResponses,
} from '@/components/charts/ReadableCharts';
import type { DashboardChartsData } from '@/types';
const data: DashboardChartsData = {
    monthlyTrends: {
        labels: [
            'Nov 2025',
            'Dec 2025',
            'Jan 2026',
            'Feb 2026',
            'Mar 2026',
            'Apr 2026',
            'May 2026',
            'Jun 2026',
            'Jul 2026',
            'Aug 2026',
            'Sep 2026',
            'Oct 2026',
        ],
        datasets: [
            {
                label: 'Incidents',
                data: [0, 2, 1, 0, 3, 2, 5, 4, 1, 0, 3, 2],
                borderColor: '#8b1538',
                backgroundColor: '',
            },
            {
                label: 'Assessments',
                data: [1, 0, 2, 2, 3, 1, 0, 4, 2, 5, 2, 1],
                borderColor: '#2563eb',
                backgroundColor: '',
            },
        ],
    },
    distributions: {
        severity: [],
        category: [
            { name: 'SAFETY_HAZARD', value: 8 },
            { name: 'EQUIPMENT_MALFUNCTION', value: 4 },
            { name: 'NEAR_MISS', value: 2 },
        ],
        assessmentType: [
            { name: 'INITIAL_ASSESSMENT', value: 9 },
            { name: 'RE_ASSESSMENT', value: 3 },
        ],
        userRole: [
            { name: 'ADMIN', value: 3 },
            { name: 'RESPONDER', value: 4 },
            { name: 'STANDARD', value: 5 },
        ],
    },
    topLocations: [
        {
            name: 'Barangay sample area, City of San Jose del Monte, Bulacan',
            value: 5,
        },
        { name: 'Quezon City', value: 3 },
    ],
    recentActivity: [],
};
export default function ChartPreview() {
    const [mode, setMode] = useState('data');
    return (
        <main className="mx-auto max-w-6xl space-y-6 bg-slate-50 px-4 py-8 pb-28">
            <h1 className="text-2xl font-bold">Chart verification</h1>
            <p className="text-sm text-slate-600">
                Development only · synthetic data · no user records
            </p>
            <div className="flex flex-wrap gap-2">
                {['data', 'loading', 'empty', 'error'].map((value) => (
                    <button
                        key={value}
                        onClick={() => setMode(value)}
                        className="rounded-lg border bg-white px-4 py-2 text-sm"
                    >
                        Show {value}
                    </button>
                ))}
            </div>
            <DashboardCharts
                chartsData={
                    mode === 'loading' || mode === 'error'
                        ? null
                        : mode === 'empty'
                          ? {
                                ...data,
                                monthlyTrends: {
                                    ...data.monthlyTrends,
                                    datasets: data.monthlyTrends.datasets.map(
                                        (series) => ({
                                            ...series,
                                            data: series.data.map(() => 0),
                                        })
                                    ),
                                },
                                distributions: {
                                    category: [],
                                    severity: [],
                                    assessmentType: [],
                                    userRole: [],
                                },
                                topLocations: [],
                            }
                          : data
                }
                loading={mode === 'loading'}
                error={mode === 'error'}
                onRetry={() => setMode('data')}
            />
            <ParticipantCharts
                data={{
                    totalParticipants: 100,
                    totalMale: 45,
                    totalFemale: 50,
                    totalYouth: 40,
                    totalSC: 20,
                    totalPWD: 10,
                }}
            />
            <ChartCard title="Wellness questions">
                <WellnessResponses
                    rows={[
                        {
                            question: 'Q1',
                            questionText:
                                'Synthetic question about wellness, for display verification only.',
                            positive: 6,
                            neutral: 3,
                            negative: 1,
                            total: 10,
                        },
                        {
                            question: 'Q2',
                            questionText: 'Another synthetic question.',
                            positive: 4,
                            neutral: 2,
                            negative: 4,
                            total: 10,
                        },
                    ]}
                />
            </ChartCard>
        </main>
    );
}
