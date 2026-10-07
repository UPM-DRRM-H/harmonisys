export const CHART_COLORS = [
    '#8B1538',
    '#2563EB',
    '#087F62',
    '#A16207',
    '#7C3AED',
    '#0E7490',
];
export function safeCount(value: number) {
    return Number.isFinite(value) && value >= 0 ? value : 0;
}
export function sharePercent(value: number, total: number) {
    return total > 0 ? Math.round((safeCount(value) / total) * 1000) / 10 : 0;
}
export function reportingMonths(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
    }).formatToParts(now);
    const year = Number(parts.find((p) => p.type === 'year')!.value),
        month = Number(parts.find((p) => p.type === 'month')!.value) - 1;
    return Array.from({ length: 12 }, (_, i) => {
        const date = new Date(Date.UTC(year, month - 11 + i, 1));
        return {
            month: date.toISOString().slice(0, 7),
            label: date.toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
                timeZone: 'UTC',
            }),
        };
    });
}
export function reportingMonthKey(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
    }).formatToParts(date);
    return (
        parts.find((p) => p.type === 'year')!.value +
        '-' +
        parts.find((p) => p.type === 'month')!.value
    );
}
export function reportingStart(now = new Date()) {
    return new Date(
        new Date(
            reportingMonths(now)[0].month + '-01T00:00:00.000Z'
        ).getTime() -
            8 * 3600000
    );
}
