import { withAccess } from '@/lib/apiAccess';
import { NextResponse } from 'next/server';
import { getUsedPatientIds } from '@/lib/action/unahon';

async function handleGET() {
    const ids = await getUsedPatientIds();
    return NextResponse.json(ids);
}

export const GET = withAccess(handleGET, ['ADMIN', 'RESPONDER']);
