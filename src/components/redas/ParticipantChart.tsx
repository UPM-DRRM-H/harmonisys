import type { AggregatedData } from '@/types/Redas';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

const shadeColor = (hex: string, amt: number) => {
    // amt: negative = darker, positive = lighter
    let col = hex.replace('#', '');
    if (col.length === 3)
        col = col
            .split('')
            .map((c) => c + c)
            .join('');

    const num = parseInt(col, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amt));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

const Bar3D = (props: any) => {
    const { x, y, width, height, fill } = props;
    if (height <= 0) return null;

    // depth controls "3D" thickness
    const dx = 10;
    const dy = 7;

    const front = { x, y, w: width, h: height };

    // Top face points
    const top = [
        [front.x, front.y],
        [front.x + dx, front.y - dy],
        [front.x + front.w + dx, front.y - dy],
        [front.x + front.w, front.y],
    ];

    // Side face points (right)
    const side = [
        [front.x + front.w, front.y],
        [front.x + front.w + dx, front.y - dy],
        [front.x + front.w + dx, front.y - dy + front.h],
        [front.x + front.w, front.y + front.h],
    ];

    const topFill = shadeColor(fill, 35); // lighter
    const sideFill = shadeColor(fill, -35); // darker

    const pointsToStr = (pts: number[][]) =>
        pts.map(([px, py]) => `${px},${py}`).join(' ');

    return (
        <g>
            {/* side */}
            <polygon
                points={pointsToStr(side)}
                fill={sideFill}
                opacity={0.95}
            />
            {/* top */}
            <polygon points={pointsToStr(top)} fill={topFill} opacity={0.95} />
            {/* front */}
            <rect
                x={front.x}
                y={front.y}
                width={front.w}
                height={front.h}
                fill={fill}
                opacity={0.92}
            />
        </g>
    );
};

const ParticipantCharts = ({ data }: { data: AggregatedData }) => {
    const chartRefs = useRef<(HTMLDivElement | null)[]>([]);
    const hasAnimatedRef = useRef<boolean[]>([]);
    const [chartKeys, setChartKeys] = useState<number[]>([0, 0]);

    const triggerAnimate = (i: number) => {
        if (hasAnimatedRef.current[i]) return;

        hasAnimatedRef.current[i] = true;
        setChartKeys((prev) => {
            const next = [...prev];
            next[i] = (next[i] ?? 0) + 1;
            return next;
        });
    };

    useEffect(() => {
        const refs = chartRefs.current;

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const idx = Number(
                        (entry.target as HTMLElement).dataset.index ?? -1
                    );
                    if (idx < 0) return;

                    if (entry.isIntersecting) {
                        triggerAnimate(idx);
                    }
                });
            },
            { threshold: 0.55, rootMargin: '0px 0px -20% 0px' }
        );

        refs.forEach((el) => el && io.observe(el));

        return () => io.disconnect();
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {[
                {
                    title: 'Gender Distribution',
                    data: [
                        {
                            name: 'Male',
                            value: data.totalMale,
                            color: '#FFBB28',
                        },
                        {
                            name: 'Female',
                            value: data.totalFemale,
                            color: '#0088FE',
                        },
                    ],
                },
                {
                    title: 'Demographic Breakdown',
                    data: [
                        {
                            name: 'Youth',
                            value: data.totalYouth,
                            color: '#fb2c36',
                        },
                        {
                            name: 'SC',
                            value: data.totalSC,
                            color: '#efb100',
                        },
                        {
                            name: 'PWD',
                            value: data.totalPWD,
                            color: '#00c951',
                        },
                        {
                            name: 'Others',
                            value:
                                data.totalParticipants -
                                (data.totalYouth +
                                    data.totalSC +
                                    data.totalPWD),
                            color: '#62748e',
                        },
                    ],
                },
            ].map((chartData, index) => (
                <div
                    key={index}
                    ref={(el) => {
                        chartRefs.current[index] = el;
                    }}
                    data-index={index}
                >
                    <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                        <CardHeader className="text-center">
                            <h3 className="w-full text-xl font-bold text-slate-800 text-center items-center gap-2">
                                {chartData.title}
                            </h3>
                        </CardHeader>
                        <CardBody className="p-6">
                            <div className="h-72 sm:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        key={chartKeys[index]}
                                        data={chartData.data}
                                        margin={{
                                            top: 22,
                                            right: 28,
                                            left: 0,
                                            bottom: 10,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e5e7eb"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            tick={{
                                                fill: '#475569',
                                                fontSize: 13,
                                            }}
                                            axisLine={{ stroke: '#cbd5e1' }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{
                                                fill: '#475569',
                                                fontSize: 13,
                                            }}
                                            axisLine={{ stroke: '#cbd5e1' }}
                                            tickLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            formatter={(value) => [
                                                `${value}`,
                                                'Count',
                                            ]}
                                            contentStyle={{
                                                backgroundColor:
                                                    'rgba(255,255,255,0.96)',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '10px',
                                                boxShadow:
                                                    '0 8px 20px rgba(0,0,0,0.12)',
                                            }}
                                        />
                                        <Bar
                                            dataKey="value"
                                            shape={<Bar3D />}
                                            animationDuration={900}
                                            animationEasing="ease-out"
                                        >
                                            {chartData.data.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                    />
                                                )
                                            )}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            ))}
        </div>
    );
};

export default ParticipantCharts;
