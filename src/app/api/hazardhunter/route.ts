// app/api/hazardhunter/route.ts
import { NextResponse } from 'next/server';
import { fetchHazardAssessment } from '@/lib/action/hazardhunter';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { latitude, longitude } = body;

        // 1. Bad Request (400)
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return NextResponse.json(
                { error: 'Invalid payload: Latitude and longitude must be valid numbers.' },
                { status: 400 }
            );
        }

        // 2. Fetch the data
        const result = await fetchHazardAssessment(latitude, longitude);

        // 3. Handle GeoRisk Upstream Failures
        if (!result.success) {
            const errorMessage = result.error || '';

            // Gateway Timeout (504)
            if (errorMessage.includes('timed out')) {
                return NextResponse.json(
                    { error: 'Gateway Timeout: GeoRisk service took too long to respond.' },
                    { status: 504 }
                );
            }

            // Bad Gateway (502)
            if (errorMessage.includes('status')) { 
                return NextResponse.json(
                    { error: 'Bad Gateway: GeoRisk service rejected the request or is currently down.' },
                    { status: 502 }
                );
            }

            return NextResponse.json(
                { error: errorMessage },
                { status: 502 } 
            );
        }

        // 4. Success (200 OK)
        return NextResponse.json(result.data, { status: 200 });

    } catch (error: any) {
        // 5. Internal Server Error (500) - Only for actual server crashes
        console.error('Critical internal error in HazardHunter route:', error);
        
        return NextResponse.json(
            { error: 'Internal Server Error: An unexpected issue occurred on our end.' },
            { status: 500 }
        );
    }
}