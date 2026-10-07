import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import ChatWidgetLoader from '@/components/chatbot/ChatWidgetLoader';
import PwaExperience from '@/components/pwa/PwaExperience';
import QueryProvider from '@/components/providers/QueryProvider';

const geistSans = localFont({
    src: './fonts/GeistVF.woff',
    variable: '--font-geist-sans',
    weight: '100 900',
});
const geistMono = localFont({
    src: './fonts/GeistMonoVF.woff',
    variable: '--font-geist-mono',
    weight: '100 900',
});

export const metadata: Metadata = {
    title: 'Harmonisys',
    applicationName: 'Harmonisys',
    manifest: '/manifest.webmanifest',
    appleWebApp: {
        capable: true,
        title: 'Harmonisys',
        statusBarStyle: 'default',
    },
    icons: { icon: '/icons/app-192.png', apple: '/icons/apple-touch-icon.png' },
    description:
        'An integrated web-based platform for Disaster Risk Reduction and Management (DRRM) that incorporates multiple DRRM-H tools.',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: '#77152d',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
            >
                <QueryProvider>
                    {children}
                    <ChatWidgetLoader />
                    <PwaExperience />
                </QueryProvider>
            </body>
        </html>
    );
}
