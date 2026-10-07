'use client';
import { CountBars } from '@/components/charts/ReadableCharts';
type Props = {
    topLocations: { name: string; value: number; color: string }[];
    barChartKey: number;
    locInView: boolean;
    shortLabel: (value: any, max?: number) => string;
};
export default function IRSLocationBarChart({ topLocations }: Props) {
    return (
        <CountBars
            data={topLocations.map(({ name, value }) => ({ name, value }))}
            unit="incidents shown"
        />
    );
}
