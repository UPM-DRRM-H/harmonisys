import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';

const config: NextAuthConfig = {
    providers: [
        Google,
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const email = credentials?.email as string | undefined;
                const password = credentials?.password as string | undefined;

                if (!email || !password) {
                    console.info('[credentials-authorize] missing_credentials');
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) {
                    console.info('[credentials-authorize] user_not_found');
                    return null;
                }

                if (!user.password) {
                    console.info('[credentials-authorize] password_missing');
                    return null;
                }

                const isValid = await bcrypt.compare(password, user.password);

                if (!isValid) {
                    console.info('[credentials-authorize] password_mismatch');
                    return null;
                }

                console.info('[credentials-authorize] success');
                return user;
            },
        }),
    ],
    trustHost: true,
};

export default config;
