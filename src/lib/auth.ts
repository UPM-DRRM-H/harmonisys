import { prisma } from '@/lib/prisma';
import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import authConfig from './auth.config';
import { getAccountById, getUserById } from './authLookup';

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: 'jwt' },
    ...authConfig,
    callbacks: {
        async jwt({ token }) {
            if (!token.sub) return token;

            const existingUser = await getUserById(token.sub);
            if (!existingUser || !existingUser.active) return null;

            const existingAccount = await getAccountById(existingUser.id);

            token.id = existingUser.id;
            token.isOath = !!existingAccount;
            token.name = existingUser.name;
            token.email = existingUser.email;
            token.image = existingUser.image;
            token.role = existingUser.role;
            token.competency = existingUser.competency;
            token.mhpssLevel = existingUser.mhpssLevel;
            token.region = existingUser.region;
            token.fullAddress = existingUser.fullAddress;
            token.responderOrganization = existingUser.responderOrganization;
            token.gender = existingUser.gender;

            return token;
        },
        async session({ session, token }) {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.id,
                    isOath: token.isOath,
                    role: token.role,
                    competency: token.competency,
                    mhpssLevel: token.mhpssLevel,
                    region: token.region,
                    fullAddress: token.fullAddress,
                    responderOrganization: token.responderOrganization,
                    gender: token.gender,
                    image: token.image,
                },
            };
        },
    },
});
