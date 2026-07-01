'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import {
    ArrowRight,
    Info,
    Users,
    Brain,
    Target,
    ClipboardCheck,
    Layers,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

type UnahonOverviewProps = {
    name: string;
    subheading?: string;
    description: string;
    subdescription?: string;
    imageUrl: string;
    imageUrls?: string[];

    urls: string[];
    isAuthenticated?: boolean;
    protectedRoutes?: string[];
    userRole?: 'ADMIN' | 'RESPONDER' | 'STANDARD' | string;
};

export default function UnahonOverview({
    name,
    subheading,
    description,
    subdescription,
    imageUrl,
    imageUrls,
    urls,
    isAuthenticated = false,
    protectedRoutes = urls,
    userRole = 'STANDARD',
}: UnahonOverviewProps) {
    const isRouteProtected = (url: string) => protectedRoutes.includes(url);

    const isAdmin = userRole === 'ADMIN';
    const canSeeUnahonDashboard =
        isAdmin || (isAuthenticated && userRole === 'RESPONDER');

    const heroSubtitle =
        subheading ??
        'Explore features and tools designed to support your workflow';

    const dashboardUrl = urls[0] ?? '#';
    const dashboardDisabled =
        !urls?.length || (!isAdmin && !canSeeUnahonDashboard);
    // ✅ Redirect Responder directly to Dashboard
    const router = useRouter();
    // ✅ Only responders redirect. Admin stays on info page.
    const isResponderView =
        isAuthenticated && userRole === 'RESPONDER' && !isAdmin;

    useEffect(() => {
        if (!isResponderView) return;
        if (!dashboardUrl || dashboardUrl === '#') return;

        router.replace(dashboardUrl);
    }, [isResponderView, dashboardUrl, router]);

    // Prevent rendering Overview while redirecting
    if (isResponderView) return null;

    // ✅ Unahon primary red
    const PRIMARY = '#9d1d1d';
    const PRIMARY_HOVER = '#991B1B';

    const cardGlass =
        'relative rounded-3xl overflow-hidden ' +
        'bg-[linear-gradient(to_bottom,rgba(255,255,255,0.72),rgba(157,29,29,0.06))] border border-white/90 ' +
        'shadow-[0_0_0_1.5px_rgba(255,255,255,0.85),0_18px_45px_rgba(0,0,0,0.15)] ' +
        'backdrop-blur-sm ' +
        'transition-shadow duration-300 ' +
        'hover:shadow-[0_0_0_2px_rgba(255,255,255,0.95),0_22px_60px_rgba(0,0,0,0.20)]';

    const featureTile =
        'flex gap-3 rounded-2xl bg-[linear-gradient(to_bottom,rgba(255,255,255,0.78),rgba(157,29,29,0.05))] border border-white/80 ' +
        'shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_8px_18px_rgba(0,0,0,0.08)] ' +
        'px-4 py-3';

    // ✅ normalize images (supports 1 or many)
    const images = useMemo(() => {
        return ['/unahon-1.png', '/unahon-2.png'];
    }, []);

    const [activeIndex, setActiveIndex] = useState(0);
    const hasMultiple = images.length > 1;

    const goPrev = () =>
        setActiveIndex((i) => (i - 1 + images.length) % images.length);
    const goNext = () => setActiveIndex((i) => (i + 1) % images.length);

    return (
        <div className="min-h-dvh w-full bg-gradient-to-br from-rose-50 via-red-50 to-amber-50">
            <div className="container mx-auto px-4 pt-10 pb-10 max-w-7xl">
                {/* HERO */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-3">
                        <h1
                            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight [text-shadow:0_3px_12px_rgba(255,255,255,0.95)]"
                            style={{ color: PRIMARY }}
                        >
                            {name}
                        </h1>

                        <p className="text-base sm:text-lg text-black">
                            {heroSubtitle}
                        </p>
                    </div>

                    {/* Button RIGHT */}
                    <div className="flex lg:justify-end">
                        <Button
                            as={Link}
                            href={dashboardUrl}
                            className="font-bold text-white min-w-[240px] h-12 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02]"
                            size="lg"
                            endContent={<ArrowRight className="w-5 h-5" />}
                            isDisabled={dashboardDisabled && !isAdmin}
                            style={{ backgroundColor: PRIMARY }}
                            onMouseEnter={(e) => {
                                if (dashboardDisabled && !isAdmin) return;
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.backgroundColor = PRIMARY_HOVER;
                            }}
                            onMouseLeave={(e) => {
                                if (dashboardDisabled && !isAdmin) return;
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.backgroundColor = PRIMARY;
                            }}
                        >
                            Unahon Dashboard
                        </Button>
                    </div>
                </div>

                {/* ABOUT + IMAGE */}
                <div className="grid lg:grid-cols-[1fr_460px] gap-8 items-stretch mt-10">
                    {/* LEFT */}
                    <div className="space-y-6">
                        {/* About */}
                        <Card className={cardGlass}>
                            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1.5 ring-white/60" />

                            <CardHeader className="pt-6 pb-2">
                                <div className="w-full px-2 sm:px-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-11 w-11 rounded-2xl flex items-center justify-center shadow"
                                            style={{ backgroundColor: PRIMARY }}
                                        >
                                            <Info className="w-5 h-5 text-white" />
                                        </div>

                                        <div>
                                            <h2
                                                className="text-2xl font-black"
                                                style={{ color: PRIMARY }}
                                            >
                                                About Unahon
                                            </h2>
                                            <div
                                                className="mt-2 h-[2px] w-24 rounded-full"
                                                style={{
                                                    backgroundColor: PRIMARY,
                                                    opacity: 0.6,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="pt-2 space-y-4 px-5 sm:px-7 pb-6">
                                <p className="text-[15.5px] sm:text-[16.5px] text-slate-800 leading-[1.65] [text-align:justify]">
                                    {description}
                                </p>

                                {subdescription ? (
                                    <div className="rounded-2xl border border-white/55 bg-white/50 p-4 shadow-sm">
                                        <div
                                            className="pl-4 text-slate-700 leading-[1.65] text-[14px] sm:text-[15px] [text-align:justify]"
                                            style={{
                                                borderLeft: `4px solid ${PRIMARY}`,
                                            }}
                                        >
                                            {subdescription}
                                        </div>
                                    </div>
                                ) : null}
                            </CardBody>
                        </Card>

                        {/* Key Features */}
                        <Card className={cardGlass}>
                            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1.5 ring-white/60" />

                            <CardHeader className="pt-6 pb-2">
                                <div className="w-full px-2 sm:px-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-11 w-11 rounded-2xl flex items-center justify-center shadow"
                                            style={{ backgroundColor: PRIMARY }}
                                        >
                                            <Layers className="w-5 h-5 text-white" />
                                        </div>

                                        <div>
                                            <h3
                                                className="text-2xl font-black"
                                                style={{ color: PRIMARY }}
                                            >
                                                Key Features
                                            </h3>
                                            <div
                                                className="mt-2 h-[2px] w-20 rounded-full"
                                                style={{
                                                    backgroundColor: PRIMARY,
                                                    opacity: 0.6,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardBody className="pt-2 px-5 sm:px-7 pb-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className={featureTile}>
                                        <div
                                            className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
                                            style={{
                                                backgroundColor: `${PRIMARY}1A`,
                                            }}
                                        >
                                            <Users
                                                className="h-5 w-5"
                                                style={{ color: PRIMARY }}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 leading-tight text-[15px]">
                                                For Non-Mental Health Staff
                                            </p>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                Built for camp staff use.
                                            </p>
                                        </div>
                                    </div>

                                    <div className={featureTile}>
                                        <div
                                            className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
                                            style={{
                                                backgroundColor: `${PRIMARY}1A`,
                                            }}
                                        >
                                            <Brain
                                                className="h-5 w-5"
                                                style={{ color: PRIMARY }}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 leading-tight text-[15px]">
                                                Quick Screening
                                            </p>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                Identify signs of distress.
                                            </p>
                                        </div>
                                    </div>

                                    <div className={featureTile}>
                                        <div
                                            className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
                                            style={{
                                                backgroundColor: `${PRIMARY}1A`,
                                            }}
                                        >
                                            <Target
                                                className="h-5 h-5"
                                                style={{ color: PRIMARY }}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 leading-tight text-[15px]">
                                                Prioritize Resources
                                            </p>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                Allocate help effectively.
                                            </p>
                                        </div>
                                    </div>

                                    <div className={featureTile}>
                                        <div
                                            className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
                                            style={{
                                                backgroundColor: `${PRIMARY}1A`,
                                            }}
                                        >
                                            <ClipboardCheck
                                                className="h-5 w-5"
                                                style={{ color: PRIMARY }}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 leading-tight text-[15px]">
                                                Observation Checklist
                                            </p>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                Guide behavior notes & referral.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* RIGHT: Image Card (Carousel) */}
                    <Card className={`${cardGlass} h-full`}>
                        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1.5 ring-white/60" />

                        <CardBody className="p-2 sm:p-3 h-full">
                            <div className="relative w-full h-full min-h-[460px] rounded-2xl overflow-hidden bg-white/20 border border-white/50">
                                {/* Image */}
                                <Image
                                    src={
                                        images[activeIndex] ||
                                        '/placeholder.svg'
                                    }
                                    alt={`${name} image ${activeIndex + 1}`}
                                    fill
                                    className="object-contain p-1 sm:p-2"
                                    sizes="(max-width: 1024px) 100vw, 460px"
                                    priority
                                />

                                {/* Controls */}
                                {hasMultiple ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={goPrev}
                                            aria-label="Previous image"
                                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10
                                 rounded-xl p-1.5 bg-white/60 border border-white/60
                                 shadow-[0_8px_18px_rgba(0,0,0,0.12)]
                                 hover:bg-white/80 transition"
                                        >
                                            <ChevronLeft
                                                className="w-4 h-4"
                                                style={{ color: PRIMARY }}
                                            />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={goNext}
                                            aria-label="Next image"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10
                                 rounded-xl p-1.5 bg-white/60 border border-white/60
                                 shadow-[0_8px_18px_rgba(0,0,0,0.12)]
                                 hover:bg-white/80 transition"
                                        >
                                            <ChevronRight
                                                className="w-4 h-4"
                                                style={{ color: PRIMARY }}
                                            />
                                        </button>

                                        {/* Dots */}
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 px-2 py-1.5 rounded-full bg-white/45 border border-white/60 backdrop-blur">
                                            {images.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() =>
                                                        setActiveIndex(idx)
                                                    }
                                                    aria-label={`Go to image ${idx + 1}`}
                                                    className="h-2 w-2 rounded-full transition-transform"
                                                    style={{
                                                        backgroundColor:
                                                            idx === activeIndex
                                                                ? PRIMARY
                                                                : 'rgba(0,0,0,0.18)',
                                                        transform:
                                                            idx === activeIndex
                                                                ? 'scale(1.05)'
                                                                : 'scale(1)',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
