import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/otp';
export async function POST(req: NextRequest) {
    try {
        const { email, code } = await req.json();
        if (typeof email !== 'string' || typeof code !== 'string')
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email and six-digit code are required.',
                },
                { status: 400 }
            );
        const result = await verifyOtp(email, code);
        if (!result.ok)
            return NextResponse.json(
                {
                    success: false,
                    message:
                        result.reason === 'max_attempts'
                            ? 'Too many attempts. Request a new code.'
                            : result.reason === 'expired'
                              ? 'Code expired. Request a new code.'
                              : 'Invalid code.',
                },
                { status: 400 }
            );
        return NextResponse.json({
            success: true,
            verificationToken: result.verificationToken,
        });
    } catch {
        return NextResponse.json(
            {
                success: false,
                message: 'Verification failed. Please try again.',
            },
            { status: 400 }
        );
    }
}
