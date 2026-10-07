import { sendCheckedMail, mailFrom } from '@/lib/mail/transport';
export async function sendPasswordResetEmail(email: string, token: string) {
    const url = new URL(
        '/reset-password',
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    );
    url.searchParams.set('token', token);
    await sendCheckedMail({
        from: mailFrom(),
        to: email,
        subject: 'Reset your Harmonisys password',
        text:
            'Use this link within one hour to reset your password: ' +
            url.href +
            ' If you did not request this, ignore the email.',
    });
}
