import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeEmail } from '@/lib/validation';
import { verificationHash } from '@/lib/otp';
import { sendPasswordResetEmail } from '@/lib/mail/passwordReset';
import { randomBytes } from 'node:crypto';
export async function POST(req: NextRequest) {
    try {
        const email = normalizeEmail((await req.json()).email);
        const user = await prisma.user.findFirst({
            where: {
                email: { equals: email, mode: 'insensitive' },
                active: true,
            },
            select: { email: true },
        });
        const token = randomBytes(32).toString('hex');
        const shouldSend =
            user &&
            (await prisma.$transaction(async (tx) => {
                await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'reset:' + email}))`;
                const recent = await tx.verificationToken.findFirst({
                    where: {
                        identifier: 'reset:' + user.email,
                        expires: { gt: new Date(Date.now() + 3540000) },
                    },
                });
                if (recent) return false;
                await tx.verificationToken.deleteMany({
                    where: { identifier: 'reset:' + user.email },
                });
                await tx.verificationToken.create({
                    data: {
                        identifier: 'reset:' + user.email,
                        token: verificationHash(token),
                        expires: new Date(Date.now() + 3600000),
                    },
                });
                return true;
            }));
        if (shouldSend)
            await sendPasswordResetEmail(user!.email, token).catch(() => {});
        return NextResponse.json({
            success: true,
            message: 'If an account exists, a reset email will be sent.',
        });
    } catch {
        return NextResponse.json(
            { error: 'Enter a valid email address.' },
            { status: 400 }
        );
    }
}
