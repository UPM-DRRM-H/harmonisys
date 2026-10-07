export default async () => {
    const base = process.env.NEXT_PUBLIC_APP_URL;
    const secret = process.env.CRON_SECRET;
    if (!base || !secret) throw new Error('Email retry configuration is missing.');
    const response = await fetch(new URL('/api/cron/email-deliveries', base), {
        headers: { authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) throw new Error('Email retry endpoint unavailable.');
};
export const config = { schedule: '@hourly' };
