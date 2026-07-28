'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { ExternalLink, ArrowRight, Activity, Layers } from 'lucide-react';

const REDASOverview = dynamic(() => import('./redas/REDASOverview'));
const IRSOverview = dynamic(() => import('./irs/IRSOverview'));
const UnahonOverview = dynamic(() => import('./unahon/UnahonOverview'));
const MiSaludOverview = dynamic(() => import('./misalud/MiSaludOverview'));
const HazardHunterOverview = dynamic(
    () => import('./hazardhunter/HazardHunterOverview')
);

interface ToolOverviewProps {
    name: string;
    subheading?: string;
    description: string;
    subdescription?: string;
    imageUrl: string;
    urls: string[];
    isAuthenticated?: boolean;
    protectedRoutes?: string[];
    userRole?: 'ADMIN' | 'RESPONDER' | 'STANDARD' | string; // ✅ ADD THIS
}

// Theme configuration for different tools
const getToolTheme = (toolName: string) => {
    const name = toolName.toLowerCase();

    if (name.includes('hazard')) {
        return {
            // Background: soft earth tones
            background:
                'bg-gradient-to-br from-stone-50 via-amber-50 to-orange-50',

            // Title gradient: dark soil → clay brown
            headerGradient: 'from-[#3B2F2F] via-[#5A3E2B] to-[#7C4A2D]',

            // Primary CTA (main feature button)
            primaryGradient: 'from-[#5A3E2B] to-[#7C4A2D]',
            primaryHoverGradient: 'from-[#4A3223] to-[#6B3F28]',

            // Icons (About / Available Features)
            secondaryGradient: 'from-[#6B3F28] to-[#8B5E34]',
            tertiaryGradient: 'from-[#7C4A2D] to-[#A16207]',

            // Accent chip (subtle sand tone)
            chipColor: 'bg-amber-100 text-[#5A3E2B]',

            // Left border accent in description
            accentColor: 'border-amber-300',
        };
    }

    if (name.includes('irs') || name.includes('incident')) {
        return {
            background: 'bg-gradient-to-br from-rose-50 via-red-50 to-amber-50',
            headerGradient: 'from-[#4A0A18] via-[#6B0F25] to-[#8B1538]',
            primaryGradient: 'from-[#8B1538] to-[#A61C45]',
            primaryHoverGradient: 'from-[#7A1231] to-[#94183E]',
            secondaryGradient: 'from-[#6B0F25] to-[#8B1538]',
            tertiaryGradient: 'from-[#8B1538] to-[#B42352]',
            chipColor: 'bg-[#8B1538]/10 text-[#8B1538]',
            accentColor: 'border-[#8B1538]/20',
        };
    }

    if (name.includes('unahon')) {
        return {
            // Background: soft red wash (very minimal yellow)
            background: 'bg-gradient-to-br from-rose-50 via-red-50 to-red-100',

            // Title gradient: strong red → dark red
            headerGradient: 'from-[#7A0C1E] via-[#991B1B] to-[#7F1D1D]',

            // Primary CTA (features button)
            primaryGradient: 'from-[#991B1B] to-[#B91C1C]',
            primaryHoverGradient: 'from-[#7F1D1D] to-[#991B1B]',

            // Icons (About / Features)
            secondaryGradient: 'from-[#7F1D1D] to-[#991B1B]',
            tertiaryGradient: 'from-[#991B1B] to-[#B91C1C]',

            // Accent chip (very subtle yellow)
            chipColor: 'bg-yellow-100 text-[#7A0C1E]',

            // Left border accent in description
            accentColor: 'border-red-300',
        };
    }

    if (
        name.includes('misalud') ||
        name.includes('mi-salud') ||
        name.includes('mi salud')
    ) {
        return {
            background:
                'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50',
            headerGradient: 'from-[#065F46] via-[#047857] to-[#059669]',
            primaryGradient: 'from-[#059669] to-[#10B981]',
            primaryHoverGradient: 'from-[#047857] to-[#059669]',
            secondaryGradient: 'from-[#047857] to-[#059669]',
            tertiaryGradient: 'from-[#10B981] to-[#34D399]',
            chipColor: 'bg-emerald-100 text-[#065F46]',
            accentColor: 'border-emerald-300',
        };
    }

    // Default theme (MiSalud style for health-related tools)
    return {
        background: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50',
        headerGradient: 'from-emerald-800 via-teal-700 to-cyan-800',
        primaryGradient: 'from-emerald-600 to-teal-600',
        primaryHoverGradient: 'from-emerald-700 to-teal-700',
        secondaryGradient: 'from-teal-500 to-cyan-500',
        tertiaryGradient: 'from-cyan-500 to-blue-500',
        chipColor: 'bg-emerald-100 text-emerald-700',
        accentColor: 'border-emerald-200',
    };
};

const ToolOverview = ({
    name,
    subheading,
    description,
    subdescription,
    imageUrl,
    urls,
    isAuthenticated = false,
    protectedRoutes = urls,
    userRole,
}: ToolOverviewProps) => {
    if (name.toLowerCase() === 'redas') {
        return (
            <REDASOverview
                description={description}
                urls={urls}
                isAuthenticated={isAuthenticated}
                userRole={userRole}
            />
        );
    }

    if (
        name.toLowerCase().includes('irs') ||
        name.toLowerCase().includes('incident')
    ) {
        return (
            <IRSOverview
                name={name}
                subheading={subheading}
                description={description}
                imageUrl={imageUrl}
                urls={urls}
                isAuthenticated={isAuthenticated}
                protectedRoutes={protectedRoutes}
                userRole={userRole} // ✅ ADD THIS
            />
        );
    }

    if (name.toLowerCase().includes('unahon')) {
        return (
            <UnahonOverview
                name={name}
                subheading={subheading}
                description={description}
                subdescription={subdescription}
                imageUrl={imageUrl}
                urls={urls}
                isAuthenticated={isAuthenticated}
                protectedRoutes={protectedRoutes}
                userRole={userRole}
            />
        );
    }

    // ✅ ADD THIS (MiSalud uses the new IRS-style layout)
    if (
        name.toLowerCase().includes('misalud') ||
        name.toLowerCase().includes('mi-salud') ||
        name.toLowerCase().includes('mi salud')
    ) {
        return (
            <MiSaludOverview
                name={name}
                subheading={subheading}
                description={description}
                subdescription={subdescription}
                imageUrl={imageUrl}
                urls={urls}
                isAuthenticated={isAuthenticated}
                protectedRoutes={protectedRoutes}
            />
        );
    }

    // ✅ ADD THIS BLOCK FOR HAZARDHUNTER
    if (name.toLowerCase().includes('hazard')) {
        return (
            <HazardHunterOverview
                name={name}
                subheading={subheading}
                description={description}
                subdescription={subdescription}
                imageUrl={imageUrl}
                urls={urls}
                isAuthenticated={isAuthenticated}
                protectedRoutes={protectedRoutes}
            />
        );
    }

    if (!subheading) {
        subheading =
            'Explore powerful features and capabilities designed for your workflow';
    }

    const isRouteProtected = (url: string) => protectedRoutes.includes(url);
    const theme = getToolTheme(name);

    return (
        <div className={`min-h-screen ${theme.background}`}>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header Section */}
                <Card className="mb-8 bg-white/70 backdrop-blur-sm shadow-lg border border-white/20">
                    <CardBody className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                                <h1
                                    className={`text-3xl lg:text-4xl font-black leading-snug bg-gradient-to-r ${theme.headerGradient} bg-clip-text text-transparent pb-1 mb-4`}
                                >
                                    {name}
                                </h1>
                                <p className="text-slate-600 text-lg">
                                    {subheading}
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Image Section */}
                    <Card className="bg-white/60 backdrop-blur-sm shadow-lg border border-white/20">
                        <CardBody className="p-0">
                            <div className="flex items-center justify-center h-full min-h-[360px] sm:min-h-[420px]">
                                <div className="relative w-[260px] sm:w-[320px] lg:w-[380px] aspect-square">
                                    <Image
                                        src={
                                            imageUrl ||
                                            '/placeholder.svg?height=600&width=600'
                                        }
                                        alt={`${name} Preview`}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 320px, 380px"
                                        priority
                                    />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Content Section */}
                    <div className="space-y-6">
                        {/* About Section */}
                        <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/20">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-2 bg-gradient-to-r ${theme.secondaryGradient} rounded-lg shadow-lg`}
                                    >
                                        <Layers className="w-5 h-5 text-white" />
                                    </div>
                                    <h2
                                        className={`text-2xl font-bold bg-gradient-to-r ${theme.headerGradient} bg-clip-text text-transparent`}
                                    >
                                        About
                                    </h2>
                                </div>
                            </CardHeader>
                            <CardBody className="pt-0">
                                <div className="space-y-4">
                                    <p className="text-slate-700 leading-relaxed text-justify">
                                        {description}
                                    </p>
                                    {subdescription && (
                                        <p
                                            className={`text-slate-600 leading-relaxed text-justify border-l-4 ${theme.accentColor} pl-4 bg-gradient-to-r from-white/50 to-transparent py-2 rounded-r-lg`}
                                        >
                                            {subdescription}
                                        </p>
                                    )}
                                </div>
                            </CardBody>
                        </Card>

                        {/* Features Section */}
                        <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/20">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-2 bg-gradient-to-r ${theme.tertiaryGradient} rounded-lg shadow-lg`}
                                    >
                                        <Activity className="w-5 h-5 text-white" />
                                    </div>
                                    <h3
                                        className={`text-2xl font-bold bg-gradient-to-r ${theme.headerGradient} bg-clip-text text-transparent`}
                                    >
                                        Available Features
                                    </h3>
                                </div>
                            </CardHeader>
                            <CardBody className="pt-0 overflow-visible">
                                <div
                                    className="grid gap-4 relative"
                                    style={{ zIndex: 1000 }}
                                >
                                    {urls.map((url, index) => {
                                        const isProtected =
                                            isRouteProtected(url);
                                        const isAccessible =
                                            !isProtected || isAuthenticated;
                                        const routeName = url
                                            .split('/')
                                            .at(-1)!
                                            .replace(/[-_]/g, ' ')
                                            .replace(/\b\w/g, (l) =>
                                                l.toUpperCase()
                                            );

                                        return (
                                            <div
                                                key={url}
                                                className="relative group z-10 hover:z-20"
                                            >
                                                {isAccessible ? (
                                                    <Button
                                                        as={Link}
                                                        href={url}
                                                        className={`w-full justify-between h-14 font-semibold transition-all duration-500 transform hover:-translate-y-0.5 hover:scale-[1.01] shadow-lg hover:shadow-2xl relative z-10 hover:z-30 ${
                                                            index === 0
                                                                ? `bg-gradient-to-r ${theme.primaryGradient} hover:${theme.primaryHoverGradient} text-white`
                                                                : `bg-white/80 backdrop-blur-sm border ${theme.accentColor} hover:bg-gradient-to-r hover:from-white/90 hover:to-white/70 text-slate-700 hover:${theme.accentColor.replace('border-', 'border-2 border-')}`
                                                        }`}
                                                        startContent={
                                                            <ExternalLink className="w-5 h-5" />
                                                        }
                                                        endContent={
                                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                                                        }
                                                    >
                                                        <span className="text-lg">
                                                            {routeName.toUpperCase()}
                                                        </span>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        className="w-full justify-between h-14 font-semibold bg-slate-100 text-slate-400 cursor-not-allowed opacity-60 relative z-10"
                                                        disabled
                                                        startContent={
                                                            <ExternalLink className="w-5 h-5" />
                                                        }
                                                        endContent={
                                                            <ArrowRight className="w-5 h-5" />
                                                        }
                                                    >
                                                        <span className="text-lg">
                                                            {routeName.toUpperCase()}
                                                        </span>
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolOverview;
