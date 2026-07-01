import { Card, CardBody, Skeleton } from '@heroui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts';

interface Props {
    locationData: {
        color: string;
        name: string;
        value: number;
    }[];
    loading: boolean;
    className?: string;
}

const IRSCharts = ({ locationData, loading, className }: Props) => {
    const pathname = usePathname();
    const chartWrapRef = useRef<HTMLDivElement | null>(null);
    const wasInViewRef = useRef(false);
    const [chartKey, setChartKey] = useState(0);

    const triggerAnimate = () => {
        setChartKey((k) => k + 1);
    };

    const cleaned = useMemo(
        () =>
            locationData.filter(
                (x) => String(x.name).trim().toLowerCase() !== 'unknown'
            ),
        [locationData]
    );

    const sorted = useMemo(
        () => [...cleaned].sort((a, b) => b.value - a.value),
        [cleaned]
    );

    const top = useMemo(() => sorted.slice(0, 6), [sorted]);

    const total = useMemo(
        () =>
            Math.max(
                sorted.reduce((acc, cur) => acc + cur.value, 0),
                1
            ),
        [sorted]
    );

    const hasData = sorted.length > 0 && total > 0;


    useEffect(() => {
        const el = chartWrapRef.current;
        if (!el) return;

        wasInViewRef.current = false;

        const io = new IntersectionObserver(
            ([entry]) => {
                const isInView = !!entry?.isIntersecting;

                if (isInView && !wasInViewRef.current) {
                    triggerAnimate();
                }
                
                wasInViewRef.current = isInView;
            },
            {
                threshold: 0.35,
                rootMargin: '0px 0px -10% 0px',
            }
        );

        io.observe(el);

        return () => {
            io.disconnect();
        };
    }, [pathname, loading, top.length]);

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-7 bg-[#7B122F] rounded-full" />
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                    Events by Location
                </h2>
            </div>

            <Card
                className={
                    'relative overflow-hidden rounded-3xl bg-white/65 backdrop-blur-sm border border-white/90 ' +
                    '' +
                    'shadow-[0_0_0_1.5px_rgba(255,255,255,0.75),0_18px_45px_rgba(0,0,0,0.18)] ' +
                    'transition-shadow duration-300 hover:shadow-[0_0_0_2px_rgba(255,255,255,0.90),0_22px_55px_rgba(0,0,0,0.20)] ' +
                    (typeof className === 'string' ? className : '')
                }
            >
                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1.5 ring-white/70" />

                <CardBody className="p-6 sm:p-7">
                    {loading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <Skeleton className="w-full h-64 rounded-2xl lg:col-span-1">
                                <div className="h-72" />
                            </Skeleton>
                            <Skeleton className="w-full h-64 rounded-2xl lg:col-span-2">
                                <div className="h-72" />
                            </Skeleton>
                        </div>
                    ) : hasData ? (
                        // ✅ top aligned
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                            {/* LEFT: List (top aligned) */}
                            <div className="lg:col-span-1 pt-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-sm font-black text-slate-900">
                                            Top Locations
                                        </div>
                                        <div className="text-xs text-slate-600">
                                            Highest incident activity
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xs text-slate-600">
                                            Total
                                        </div>
                                        <div className="text-lg font-black text-slate-900 leading-none">
                                            {total}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-4">
                                    {top.map((loc, idx) => {
                                        const pct = Math.round(
                                            (loc.value / total) * 100
                                        );
                                        return (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3"
                                            >
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full ring-4 ring-white/70"
                                                    style={{
                                                        backgroundColor:
                                                            loc.color,
                                                    }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                                            {loc.name}
                                                        </p>
                                                        <p className="text-xs font-bold text-slate-700 whitespace-nowrap">
                                                            {loc.value}
                                                        </p>
                                                    </div>

                                                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-300/70 overflow-hidden">
                                                        <div
                                                            className="h-1.5 rounded-full"
                                                            style={{
                                                                width: `${Math.min(pct, 100)}%`,
                                                                background: `linear-gradient(90deg, ${loc.color}, rgba(255,255,255,0.95))`,
                                                                opacity: 0.95,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* RIGHT: Donut (top aligned to match left) */}
                            <div
                                ref={chartWrapRef}
                                className="relative lg:col-span-2 h-64 lg:min-h-[16rem] pt-1"
                            >
                                <div className="relative w-full h-full rounded-2xl border border-white/55 bg-white/20 flex items-center justify-center overflow-hidden">
                                    <div className="w-full h-full">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <PieChart key={chartKey}>
                                                <Tooltip
                                                    formatter={(v: any) => [
                                                        `${v} events`,
                                                        'Count',
                                                    ]}
                                                    contentStyle={{
                                                        backgroundColor:
                                                            'rgba(255, 255, 255, 0.96)',
                                                        border: '1px solid rgba(255,255,255,0.95)',
                                                        borderRadius: '12px',
                                                        boxShadow:
                                                            '0 10px 25px rgba(0, 0, 0, 0.12)',
                                                    }}
                                                />

                                                {/* Depth layer */}
                                                <Pie
                                                    data={top}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="52%"
                                                    innerRadius={62}
                                                    outerRadius={92}
                                                    startAngle={90}
                                                    endAngle={-270}
                                                    stroke="rgba(255,255,255,0.12)"
                                                    strokeWidth={2}
                                                    isAnimationActive={false}
                                                    animationDuration={900}
                                                    animationEasing="ease-out"
                                                >
                                                    {top.map((entry, index) => (
                                                        <Cell
                                                            key={`depth-${index}`}
                                                            fill={entry.color}
                                                            opacity={0.35}
                                                        />
                                                    ))}
                                                </Pie>

                                                {/* Main donut */}
                                                <Pie
                                                    data={top}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={62}
                                                    outerRadius={92}
                                                    paddingAngle={3}
                                                    startAngle={90}
                                                    endAngle={-270}
                                                    stroke="rgba(255,255,255,0.55)"
                                                    strokeWidth={2}
                                                    isAnimationActive={true}
                                                    animationDuration={900}
                                                    animationEasing="ease-out"
                                                >
                                                    {top.map((entry, index) => (
                                                        <Cell
                                                            key={`slice-${index}`}
                                                            fill={entry.color}
                                                            opacity={0.95}
                                                        />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-xs text-slate-600 font-semibold">
                                                Total Events
                                            </div>
                                            <div className="text-3xl font-black text-slate-900 leading-none">
                                                {total}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-72 flex flex-col items-center justify-center text-slate-500">
                            <div className="text-6xl mb-4">📊</div>
                            <h3 className="text-xl font-semibold mb-2">
                                No Location Data
                            </h3>
                            <p className="text-center max-w-md">
                                No events with location data found. Start by
                                reporting incidents to see location analytics.
                            </p>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default IRSCharts;
