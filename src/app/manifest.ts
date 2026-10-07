import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'Harmonisys – DRRM-H',
        short_name: 'Harmonisys',
        description:
            'Connected disaster preparedness, reporting and responder support.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        background_color: '#faf7f5',
        theme_color: '#77152d',
        lang: 'en',
        orientation: 'any',
        categories: ['health', 'productivity', 'utilities'],
        icons: [
            {
                src: '/icons/app-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icons/app-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icons/app-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        shortcuts: [
            {
                name: 'App help',
                url: '/help',
                description: 'Read the app guide',
            },
            { name: 'Report an incident', url: '/overview/irs?open=report' },
            { name: 'HazardHunter', url: '/overview/hazardhunter' },
        ],
        prefer_related_applications: false,
    };
}
