import { NextResponse } from 'next/server';
import { withAccess } from '@/lib/apiAccess';
import { fetchRedasData } from '@/lib/redasData';
async function handleGET(request: Request) {
    const params = new URL(request.url).searchParams;
    const sheet = params.get('sheetName');
    if (
        !sheet ||
        ![
            'Participants',
            'Trainings',
            'EDM Trainings',
            'Thesis Collaborations',
            'Testimonials',
        ].includes(sheet)
    )
        return NextResponse.json(
            { error: 'Choose a supported REDAS dataset.' },
            { status: 400 }
        );
    if (sheet === 'Trainings' && !params.get('label'))
        return NextResponse.json(
            { error: 'A training label is required.' },
            { status: 400 }
        );
    try {
        return NextResponse.json(await fetchRedasData(params));
    } catch {
        return NextResponse.json(
            {
                error: 'REDAS training data is unavailable. Please try again later.',
            },
            { status: 503 }
        );
    }
}
export const GET = withAccess(handleGET);
