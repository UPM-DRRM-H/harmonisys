import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { generateOtp } from '@/lib/otp';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// Add this line right after
await transporter.verify();
console.log('SMTP connected successfully');

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { success: false, message: 'Email is required.' },
                { status: 400 }
            );
        }

        const code = generateOtp(email);

        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Your verification code',
            html: `
                <div style="font-family:sans-serif;max-width:480px;margin:auto">
                    <h2 style="color:#1a1a1a">Verify your email</h2>
                    <p>Use the code below to complete your registration. It expires in <strong>10 minutes</strong>.</p>
                    <div style="
                        font-size:2.5rem;
                        font-weight:700;
                        letter-spacing:0.35em;
                        text-align:center;
                        padding:24px 0;
                        color:#b45309;
                    ">${code}</div>
                    <p style="color:#6b7280;font-size:0.875rem">
                        If you didn't request this, you can safely ignore this email.
                    </p>
                </div>
            `,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[send-otp]', err);
        return NextResponse.json(
            { success: false, message: 'Failed to send OTP. Try again.' },
            { status: 500 }
        );
    }
}
