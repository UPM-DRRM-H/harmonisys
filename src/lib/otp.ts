import {
    createHmac,
    randomInt,
    randomBytes,
    timingSafeEqual,
} from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { normalizeEmail, WorkflowError } from '@/lib/validation';

export function verificationHash(value: string): string {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error('Authentication secret is missing.');
    return createHmac('sha256', secret).update(value).digest('hex');
}
function equals(left: string, right: string) {
    const a = Buffer.from(left),
        b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
}
// One transaction serializes each email's sends/verifications across app instances.
export async function generateOtp(input: string) {
    const email = normalizeEmail(input),
        code = String(randomInt(100000, 1000000));
    await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${email}))`;
        const existing = await tx.registrationOtp.findUnique({
            where: { email },
        });
        const now = new Date(),
            sameWindow =
                existing &&
                now.getTime() - existing.windowStartedAt.getTime() < 3600000;
        if (existing && now.getTime() - existing.lastSentAt.getTime() < 60000)
            throw new WorkflowError(
                'Wait 60 seconds before requesting another code.',
                429
            );
        if (sameWindow && existing.sendCount >= 5)
            throw new WorkflowError(
                'Too many verification emails. Try again in one hour.',
                429
            );
        const data = {
            codeHash: verificationHash(email + ':' + code),
            expiresAt: new Date(now.getTime() + 600000),
            attempts: 0,
            lastSentAt: now,
            sendCount: sameWindow ? existing!.sendCount + 1 : 1,
            windowStartedAt: sameWindow ? existing!.windowStartedAt : now,
            proofHash: null,
            proofExpiresAt: null,
        };
        await tx.registrationOtp.upsert({
            where: { email },
            create: { email, ...data },
            update: data,
        });
    });
    return code;
}
export async function verifyOtp(input: string, code: string) {
    const email = normalizeEmail(input);
    if (typeof code !== 'string' || !/^\d{6}$/.test(code.trim()))
        return { ok: false as const, reason: 'invalid' };
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${email}))`;
        const entry = await tx.registrationOtp.findUnique({ where: { email } });
        if (!entry || entry.expiresAt <= new Date() || entry.proofHash)
            return { ok: false as const, reason: 'expired' };
        if (entry.attempts >= 5)
            return { ok: false as const, reason: 'max_attempts' };
        if (
            !equals(entry.codeHash, verificationHash(email + ':' + code.trim()))
        ) {
            await tx.registrationOtp.update({
                where: { email },
                data: { attempts: { increment: 1 } },
            });
            return { ok: false as const, reason: 'invalid' };
        }
        const verificationToken = randomBytes(32).toString('hex');
        await tx.registrationOtp.update({
            where: { email },
            data: {
                proofHash: verificationHash(verificationToken),
                proofExpiresAt: new Date(Date.now() + 600000),
                codeHash: '',
                attempts: 5,
            },
        });
        return { ok: true as const, verificationToken };
    });
}
export async function consumeVerification(
    tx: Prisma.TransactionClient,
    email: string,
    token: string
) {
    if (!/^[a-f0-9]{64}$/.test(token))
        throw new WorkflowError('Verify your email before registering.', 403);
    const result = await tx.registrationOtp.deleteMany({
        where: {
            email,
            proofHash: verificationHash(token),
            proofExpiresAt: { gt: new Date() },
        },
    });
    if (result.count !== 1)
        throw new WorkflowError(
            'Email verification expired or was already used. Request a new code.',
            403
        );
}
export async function cancelFailedOtp(email: string, code: string) {
    await prisma.registrationOtp.updateMany({
        where: {
            email: normalizeEmail(email),
            codeHash: verificationHash(normalizeEmail(email) + ':' + code),
        },
        data: { expiresAt: new Date(0) },
    });
}
