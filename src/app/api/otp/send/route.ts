import { NextRequest, NextResponse } from 'next/server';
import { generateOtp, cancelFailedOtp } from '@/lib/otp';
import { normalizeEmail, WorkflowError } from '@/lib/validation';
import {
    getMailTransporter,
    sendCheckedMail,
    mailFrom,
} from '@/lib/mail/transport';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
    let email: string | undefined, code: string | undefined;
    try {
        email = normalizeEmail((await req.json()).email);
        // Fail before saving a challenge if sender configuration is missing.
        const transport = getMailTransporter();
        transport.close();
        code = await generateOtp(email);
        await sendCheckedMail({
            from: mailFrom(),
            to: email,
            subject: 'Your Harmonisys verification code',
            text:
                'Your verification code is ' +
                code +
                '. It expires in 10 minutes. If you did not request this, ignore this email.',
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        if (email && code) await cancelFailedOtp(email, code).catch(() => {});
        const status =
            error instanceof WorkflowError ? error.status : email ? 503 : 400;
        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof WorkflowError
                        ? error.message
                        : status === 400
                          ? 'Enter a valid email address.'
                          : 'We could not send the verification email. Please try again later.',
            },
            { status }
        );
    }
}
