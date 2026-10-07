import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export async function GET() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({status:'ready',database:'connected'}, {headers:{'Cache-Control':'no-store'}});
    } catch {
        return NextResponse.json({status:'unavailable',database:'unavailable'}, {status:503,headers:{'Cache-Control':'no-store'}});
    }
}
