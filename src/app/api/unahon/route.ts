import { withAccess } from '@/lib/apiAccess';
import { NextResponse } from 'next/server';
import { getUnahonFormsGroupedByClient } from '@/lib/action/unahon';

async function handleGET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const search = searchParams.get('search');
    const assessmentType = searchParams.get('assessmentType');
    const dateFilter = searchParams.get('dateFilter');

    const pageNumber = Number.parseInt(page as string, 10) || 1;
    const limitNumber = Number.parseInt(limit as string, 10) || 10;

    const filters = {
        search: search || undefined,
        assessmentType: assessmentType || undefined,
        dateFilter: dateFilter || undefined,
    };

    const forms = await getUnahonFormsGroupedByClient(
        pageNumber,
        limitNumber,
        filters
    );

    if (forms.error) {
        return NextResponse.json(
            { error: 'Failed to fetch data' },
            { status: 500 }
        );
    }

    return NextResponse.json(forms);
}

export const GET = withAccess(handleGET, ['ADMIN', 'RESPONDER']);
