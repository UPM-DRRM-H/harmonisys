import nodemailer from 'nodemailer';
export function getMailTransporter() {
    const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS)
        throw new Error('Email delivery is not configured.');
    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });
}
export function mailFrom() {
    return '"Harmonisys" <' + process.env.SMTP_USER + '>';
}
export async function sendCheckedMail(options: nodemailer.SendMailOptions) {
    const transport = getMailTransporter();
    try {
        const result = await transport.sendMail(options);
        if (!result.accepted?.length || result.rejected?.length)
            throw new Error('The mail server rejected the recipient.');
        return result;
    } finally {
        transport.close();
    }
}
