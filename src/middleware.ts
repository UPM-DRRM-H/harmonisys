import NextAuth from 'next-auth';
import authConfig from './lib/auth.edge';
import { privateRoutes } from './routes';
const { auth } = NextAuth(authConfig);
export default auth((req) => {
    const path = req.nextUrl.pathname;
    if (path.startsWith('/api/')) return;
    const privateRoute = privateRoutes.some(
        (route) => path === route || path.startsWith(route.split('/:')[0] + '/')
    );
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    if (req.auth && path.startsWith('/auth'))
        return Response.redirect(new URL('/dashboard', base));
    if (!req.auth && privateRoute) return Response.redirect(new URL('/', base));
});
export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
