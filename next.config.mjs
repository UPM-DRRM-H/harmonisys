import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: __dirname,
    // Hosted functions use the Linux engine; keep the Windows engine local.
    outputFileTracingExcludes: {
        '/*': ['**/query_engine-windows.dll.node'],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    async headers() {
        return [
            {
                source: '/sw.js',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/javascript; charset=utf-8',
                    },
                    {
                        key: 'Cache-Control',
                        value: 'no-cache, no-store, must-revalidate',
                    },
                    { key: 'Service-Worker-Allowed', value: '/' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                ],
            },
            {
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'private, no-store, max-age=0',
                    },
                ],
            },
            {
                source: '/manifest.webmanifest',
                headers: [
                    { key: 'Content-Type', value: 'application/manifest+json' },
                ],
            },
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'drive.google.com',
            },
        ],
    },
};

export default nextConfig;
