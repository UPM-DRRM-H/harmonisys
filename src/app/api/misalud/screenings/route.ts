import { withAccess } from '@/lib/apiAccess';
import { archiveRecords } from '@/lib/legacyArchives';
import { NextResponse } from 'next/server';
async function handleGET() {
    try { return NextResponse.json({message:'Ok',data:await archiveRecords('misalud','screenings')}); }
    catch { return NextResponse.json({message:'Archive data is unavailable',data:null},{status:503}); }
}
export const GET = withAccess(handleGET, ['ADMIN']);
