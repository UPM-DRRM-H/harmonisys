import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validPassword, WorkflowError } from '@/lib/validation';
import { verificationHash } from '@/lib/otp';
import bcrypt from 'bcryptjs';
export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json();
        if (
            typeof token !== 'string' ||
            !/^[a-f0-9]{64}$/.test(token) ||
            !validPassword(password)
        )
            throw new WorkflowError(
                'Provide a valid reset token and password with 8–128 characters, an uppercase letter and a symbol.'
            );
        const hash = await bcrypt.hash(password, 12);
        await prisma.$transaction(async (tx) => {
            const entry = await tx.verificationToken.findFirst({
                where: {
                    token: { in: [verificationHash(token), token] },
                    identifier: { startsWith: 'reset:' },
                    expires: { gt: new Date() },
                },
            });
            if (!entry)
                throw new WorkflowError('Invalid or expired reset link.');
            const consumed = await tx.verificationToken.deleteMany({
                where: {
                    identifier: entry.identifier,
                    token: entry.token,
                    expires: { gt: new Date() },
                },
            });
            if (consumed.count !== 1)
                throw new WorkflowError('Reset link was already used.');
            const updated = await tx.user.updateMany({
                where: { email: entry.identifier.slice(6), active: true },
                data: { password: hash },
            });
            if (!updated.count) throw new WorkflowError('Invalid reset link.');
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json(
            {
                error:
                    e instanceof WorkflowError
                        ? e.message
                        : 'Password reset failed.',
            },
            { status: e instanceof WorkflowError ? e.status : 500 }
        );
    }
}
