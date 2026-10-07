import Google from 'next-auth/providers/google';
import type { NextAuthConfig } from 'next-auth';
// JWT validation in middleware uses no database client or Node-only hashing code.
const config: NextAuthConfig = {
    providers: [Google],
    session: { strategy: 'jwt' },
    trustHost: true,
};
export default config;
