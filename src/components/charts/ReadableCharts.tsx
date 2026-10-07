'use client';
import { ReactNode, ReactElement, useId, useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    BarChart,
    Bar,
} from 'recharts';
import { CHART_COLORS, safeCount, sharePercent } from '@/lib/chartData';
function ClientChart({
    children,
    height,
}: {
    children: ReactElement;
    height: number;
}) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return (
        <div style={{ height }} className="min-w-0 w-full">
            {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    {children}
                </ResponsiveContainer>
            ) : (
                <div
                    role="status"
                    className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500"
                >
                    Preparing chart…
                </div>
            )}
        </div>
    );
}
export type CountItem = { name: string; value: number; color?: string };
export function ChartCard({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {description && (
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    {description}
                </p>
            )}
            <div className="mt-6">{children}</div>
        </section>
    );
}
export function CountBars({
    data,
    total,
    showPercent = true,
    unit = 'records',
}: {
    data: CountItem[];
    total?: number;
    showPercent?: boolean;
    unit?: string;
}) {
    const rows = data.map((r) => ({ ...r, value: safeCount(r.value) }));
    const denominator = total ?? rows.reduce((sum, r) => sum + r.value, 0);
    const id = useId();
    if (!rows.length)
        return (
            <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No matching {unit} to display.
            </p>
        );
    return (
        <div
            className="space-y-5"
            role="img"
            aria-label={rows
                .map((r) => r.name + ': ' + r.value + ' ' + unit)
                .join('; ')}
        >
            {rows.map((row, i) => (
                <div key={row.name + '-' + i}>
                    <div className="mb-2 flex items-start justify-between gap-4">
                        <span className="min-w-0 break-words text-sm font-medium text-slate-700">
                            {row.name}
                        </span>
                        <span className="shrink-0 text-sm tabular-nums">
                            <strong className="text-slate-900">
                                {row.value.toLocaleString()}
                            </strong>
                            {showPercent && (
                                <span className="ml-2 text-slate-500">
                                    {sharePercent(row.value, denominator)}%
                                </span>
                            )}
                        </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                            style={{
                                width:
                                    Math.min(
                                        100,
                                        sharePercent(row.value, denominator)
                                    ) + '%',
                                background:
                                    row.color ||
                                    CHART_COLORS[i % CHART_COLORS.length],
                            }}
                        />
                    </div>
                </div>
            ))}
            <p id={id} className="text-xs text-slate-500">
                {showPercent
                    ? 'Percentages use ' +
                      denominator.toLocaleString() +
                      ' ' +
                      unit +
                      '.'
                    : 'Values are record counts.'}
            </p>
        </div>
    );
}
export function ActivityTrend({
    rows,
    series,
}: {
    rows: Record<string, string | number>[];
    series: { key: string; label: string; color?: string }[];
}) {
    if (!rows.length)
        return (
            <p className="text-sm text-slate-500">No trend data available.</p>
        );
    return (
        <>
            <div
                className="h-[290px] min-w-0 w-full"
                role="img"
                aria-label="Monthly record counts. Exact values are available in the data table below."
            >
                <ClientChart height={290}>
                    <LineChart
                        data={rows}
                        margin={{ top: 10, right: 12, bottom: 10, left: 0 }}
                    >
                        <CartesianGrid
                            stroke="#E2E8F0"
                            strokeDasharray="3 5"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 12 }}
                            minTickGap={28}
                        />
                        <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748B', fontSize: 12 }}
                            width={38}
                            domain={[0, 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: 12,
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 8px 24px #0F172A12',
                            }}
                        />
                        <Legend
                            iconType="circle"
                            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                        />
                        {series.map((s, i) => (
                            <Line
                                key={s.key}
                                type="linear"
                                dataKey={s.key}
                                name={s.label}
                                stroke={
                                    s.color ||
                                    CHART_COLORS[i % CHART_COLORS.length]
                                }
                                strokeWidth={2.5}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                                isAnimationActive={false}
                            />
                        ))}
                    </LineChart>
                </ClientChart>
            </div>
            <details className="mt-4 rounded-xl border border-slate-200">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#77152d]">
                    View exact values
                </summary>
                <div className="overflow-x-auto px-4 pb-4">
                    <table className="w-full text-left text-xs tabular-nums">
                        <caption className="sr-only">
                            Monthly record counts
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col" className="py-2">
                                    Month
                                </th>
                                {series.map((s) => (
                                    <th
                                        key={s.key}
                                        scope="col"
                                        className="px-3 py-2"
                                    >
                                        {s.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr
                                    key={i}
                                    className="border-t border-slate-100"
                                >
                                    <th
                                        scope="row"
                                        className="py-2 font-medium"
                                    >
                                        {row.label}
                                    </th>
                                    {series.map((s) => (
                                        <td key={s.key} className="px-3 py-2">
                                            {Number(
                                                row[s.key] || 0
                                            ).toLocaleString()}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </>
    );
}
export function WellnessResponses({
    rows,
}: {
    rows: {
        question: string;
        questionText: string;
        positive: number;
        neutral: number;
        negative: number;
        total: number;
    }[];
}) {
    return (
        <>
            <div
                className="h-[310px] w-full"
                role="img"
                aria-label="Wellness responses by question. Exact values and full question labels appear below."
            >
                <ClientChart height={310}>
                    <BarChart
                        data={rows}
                        layout="vertical"
                        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                    >
                        <CartesianGrid
                            stroke="#E2E8F0"
                            strokeDasharray="3 5"
                            horizontal={false}
                        />
                        <XAxis
                            type="number"
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="question"
                            width={42}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: 12,
                                border: '1px solid #E2E8F0',
                            }}
                        />
                        <Legend
                            iconType="circle"
                            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                        />
                        <Bar
                            dataKey="positive"
                            name="Positive"
                            stackId="responses"
                            fill="#087F62"
                            maxBarSize={32}
                            isAnimationActive={false}
                        />
                        <Bar
                            dataKey="neutral"
                            name="Neutral"
                            stackId="responses"
                            fill="#B7790E"
                            maxBarSize={32}
                            isAnimationActive={false}
                        />
                        <Bar
                            dataKey="negative"
                            name="Needs attention"
                            stackId="responses"
                            fill="#BE123C"
                            radius={[0, 6, 6, 0]}
                            maxBarSize={32}
                            isAnimationActive={false}
                        />
                    </BarChart>
                </ClientChart>
            </div>
            <details className="mt-4 rounded-xl border">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#77152d]">
                    View questions and counts
                </summary>
                <div className="overflow-x-auto p-4">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr>
                                <th scope="col">Question</th>
                                <th scope="col" className="px-3">
                                    Positive
                                </th>
                                <th scope="col" className="px-3">
                                    Neutral
                                </th>
                                <th scope="col" className="px-3">
                                    Needs attention
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.question} className="border-t">
                                    <th
                                        scope="row"
                                        className="py-3 font-medium"
                                    >
                                        {row.question} · {row.questionText}
                                    </th>
                                    <td className="px-3 tabular-nums">
                                        {row.positive}
                                    </td>
                                    <td className="px-3 tabular-nums">
                                        {row.neutral}
                                    </td>
                                    <td className="px-3 tabular-nums">
                                        {row.negative}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </>
    );
}
