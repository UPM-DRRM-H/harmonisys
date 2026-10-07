import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { retryPendingEmails } from '@/lib/mail/outbox';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function GET(request: Request) {
    const secret = process.env.CRON_SECRET;
    const actual = request.headers.get('authorization') || '';
    const expected = secret ? `Bearer ${secret}` : '';
    if (!expected || Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
        !timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))
        return NextResponse.json({error:'Unauthorized'},{status:401});
    try { return NextResponse.json(await retryPendingEmails(3)); }
    catch { return NextResponse.json({error:'Email retry unavailable'},{status:503}); }
}
