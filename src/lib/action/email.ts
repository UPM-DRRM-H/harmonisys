'use server';
import nodemailer from 'nodemailer';

const EMAIL_USERNAME = process.env.EMAIL_USERNAME!;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD!;
const EMAIL_RECEIVER = process.env.EMAIL_RECEIVER!;

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendMail({
    email,
    text,
}: {
    email: string;
    text: string;
}) {
    console.log(
        '[sendMail] attempting to send to:',
        process.env.EMAIL_RECEIVER
    );
    console.log('[sendMail] from:', process.env.SMTP_USER);

    // await transporter.verify();

    const info = await transporter.sendMail({
        from: `"Harmonisys" <${process.env.SMTP_USER}>`, // match SMTP_FROM pattern
        to: process.env.EMAIL_RECEIVER,
        replyTo: email,
        subject: 'User Inquiry/Report',
        text: `${text}\n\nFROM: ${email}`,
        html: `<p>${text.replace(/\n/g, '<br>')}</p><p><strong>FROM:</strong> ${email}</p>`,
    });

    console.log('[sendMail] success, messageId:', info.messageId);
    return info;
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Reset your password',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb;">
        <h2 style="color: #111827; margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #6b7280; margin-bottom: 24px;">
          We received a request to reset your password. Click the button below to choose a new one.
          This link expires in <strong>1 hour</strong>.
        </p>
        <a
          href="${resetUrl}"
          style="display: inline-block; background: #facc15; color: #111827; font-weight: bold; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 15px;"
        >
          Reset Password
        </a>
        <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
          If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #d1d5db; font-size: 12px;">
          Or copy this link into your browser:<br />
          <span style="color: #6b7280; word-break: break-all;">${resetUrl}</span>
        </p>
      </div>
    `,
    });
}
