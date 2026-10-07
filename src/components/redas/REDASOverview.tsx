'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button, Skeleton, Card, CardBody, CardHeader } from '@heroui/react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    ArrowRight,
    Map,
    Award,
    Users,
    Video,
    Info,
    Layers,
    BookOpen,
} from 'lucide-react';

import Testimonials from './Testimonials';
import EDMTrainings from './EDMTrainings';
import ThesisCollaborations from './ThesisCollaborations';

import Autoplay from 'embla-carousel-autoplay';
import type { AggregatedData } from '@/types/Redas';
import { REDAS_MODULES, REDAS_AWARDS } from '@/constants';
import ParticipantCharts from './ParticipantChart';

// REDAS Theme Configuration (BLUE)
const redasTheme = {
    background: 'bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-200',
    headerGradient: 'from-blue-900 via-sky-800 to-indigo-900',
    primaryGradient: 'from-blue-600 to-sky-600',
    primaryHoverGradient: 'from-blue-700 to-sky-700',
    secondaryGradient: 'from-sky-600 to-indigo-600',
    tertiaryGradient: 'from-indigo-600 to-cyan-600',
    chipColor: 'bg-blue-100 text-blue-800',
    accentColor: 'border-blue-200',
};

// Combined Navigation Component with arrows and dots in a row
const CombinedNavigation = ({
    canScrollPrev,
    canScrollNext,
    onPrevClick,
    onNextClick,
    totalSlides,
    currentIndex,
    onDotClick,
}: {
    canScrollPrev: boolean;
    canScrollNext: boolean;
    onPrevClick: () => void;
    onNextClick: () => void;
    totalSlides: number;
    currentIndex: number;
    onDotClick: (index: number) => void;
}) => (
    <div className="flex items-center justify-center gap-4 mt-0">
        {/* Previous Button */}
        <Button
            isIconOnly
            size="sm"
            variant="solid"
            onPress={onPrevClick}
            isDisabled={!canScrollPrev}
            className="
        bg-gradient-to-r from-blue-600 to-sky-600 text-white
        hover:from-blue-800 hover:to-sky-700
        active:from-blue-900 active:to-sky-800
        shadow-md transition-colors
        hover:!bg-transparent active:!bg-transparent
        disabled:opacity-50
      "
        >
            <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Dot Indicators */}
        <div className="flex gap-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                    key={index}
                    onClick={() => onDotClick(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentIndex
                            ? 'bg-blue-700 scale-125'
                            : 'bg-blue-300 hover:bg-blue-500'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                />
            ))}
        </div>

        {/* Next Button */}
        <Button
            isIconOnly
            size="sm"
            variant="solid"
            onPress={onNextClick}
            isDisabled={!canScrollNext}
            className="
        bg-gradient-to-r from-blue-600 to-sky-600 text-white
        hover:from-blue-800 hover:to-sky-700
        active:from-blue-900 active:to-sky-800
        shadow-md transition-colors
        hover:!bg-transparent active:!bg-transparent
        disabled:opacity-50
      "
        >
            <ChevronRight className="h-4 w-4" />
        </Button>
    </div>
);

interface REDASOverviewProps {
    description: string;
    urls: string[];
    isAuthenticated?: boolean;
    protectedRoutes?: string[];
    userRole?: 'ADMIN' | 'RESPONDER' | 'STANDARD' | string; // ✅ add
}

const emptyData: AggregatedData = {
    totalParticipants: 0,
    totalMale: 0,
    totalFemale: 0,
    totalYouth: 0,
    totalSC: 0,
    totalPWD: 0,
};

const REDASOverview = ({
    description,
    urls,
    isAuthenticated = false,
    protectedRoutes = urls,
    userRole = 'STANDARD',
}: REDASOverviewProps) => {
    const canSeeRedasAnalytics =
        isAuthenticated && (userRole === 'ADMIN' || userRole === 'RESPONDER');
    const isResponderView = isAuthenticated && userRole === 'RESPONDER';

    const [aggregatedData, setAggregatedData] =
        useState<AggregatedData>(emptyData);
    const [loading, setLoading] = useState(false);
    const [dataError, setDataError] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const autoplayRef = useRef(
        Autoplay({ delay: 3000, stopOnInteraction: false })
    );

    // ✅ IRS-like glass + soft-blue card styles (REDAS theme)
    const cardGlass =
        'relative rounded-3xl overflow-hidden ' +
        'bg-sky-50/65 border border-white/90 ' +
        'shadow-[0_0_0_1.5px_rgba(255,255,255,0.80),0_18px_45px_rgba(0,0,0,0.14)] ' +
        'transition-shadow duration-300 ' +
        'hover:shadow-[0_0_0_2px_rgba(255,255,255,0.92),0_22px_60px_rgba(0,0,0,0.16)]';

    const innerGlass =
        'bg-white/90 border border-white/70 ' +
        'shadow-[0_0_0_1px_rgba(255,255,255,0.55),0_12px_28px_rgba(0,0,0,0.10),0_0_40px_rgba(255,255,255,0.18)]';

    // Embla Carousel hooks with autoplay
    const [emblaRefModules, emblaApiModules] = useEmblaCarousel(
        { loop: true, slidesToScroll: 1 },
        [autoplayRef.current]
    );

    // Navigation states
    const [canScrollPrevModules, setCanScrollPrevModules] = useState(false);
    const [canScrollNextModules, setCanScrollNextModules] = useState(false);

    // Navigation callbacks
    const scrollPrevModules = useCallback(() => {
        if (!emblaApiModules) return;
        emblaApiModules.scrollPrev();
        autoplayRef.current.reset();
    }, [emblaApiModules]);
    const scrollNextModules = useCallback(() => {
        if (!emblaApiModules) return;
        emblaApiModules.scrollNext();
        autoplayRef.current.reset();
    }, [emblaApiModules]);

    const scrollToSlide = useCallback(
        (index: number) => {
            if (!emblaApiModules) return;
            emblaApiModules.scrollTo(index);
            autoplayRef.current.reset();
        },
        [emblaApiModules]
    );

    // Update navigation states and current slide
    const onSelectModules = useCallback(() => {
        if (!emblaApiModules) return;
        setCanScrollPrevModules(emblaApiModules.canScrollPrev());
        setCanScrollNextModules(emblaApiModules.canScrollNext());
        setCurrentSlide(emblaApiModules.selectedScrollSnap());
    }, [emblaApiModules]);

    useEffect(() => {
        if (!emblaApiModules) return;
        onSelectModules();
        emblaApiModules.on('reInit', onSelectModules);
        emblaApiModules.on('select', onSelectModules);
    }, [emblaApiModules, onSelectModules]);

    useEffect(() => {
        if (!canSeeRedasAnalytics) return;

        const fetchData = async () => {
            setLoading(true);
            setDataError(false);
            try {
                const response = await fetch(
                    `/api/redas?sheetName=Participants`
                );
                if (!response.ok) throw new Error('REDAS source unavailable.');
                const result = await response.json();
                if (
                    !result ||
                    ![
                        'totalParticipants',
                        'totalMale',
                        'totalFemale',
                        'totalYouth',
                        'totalSC',
                        'totalPWD',
                    ].every(
                        (key) =>
                            typeof result[key] === 'number' &&
                            Number.isFinite(result[key]) &&
                            result[key] >= 0
                    )
                )
                    throw new Error('REDAS returned an invalid dataset.');
                setAggregatedData(result || emptyData);
            } catch (error) {
                setDataError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [canSeeRedasAnalytics]);

    // Helper function to check if route is protected
    const isRouteProtected = (url: string) => protectedRoutes.includes(url);

    // Define all navigation buttons with their routes
    const navigationButtons = [
        ...urls
            .filter((url) => url !== '/redas')
            .map((url) => ({
                url,
                label: url.split('/').at(-1)!.toLocaleUpperCase(),
            })),
        { url: '/redas/faq', label: 'FAQs' },
    ];

    return (
        <div className={`min-h-screen ${redasTheme.background}`}>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* HERO */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                    {/* LEFT SIDE */}
                    <div className="space-y-3">
                        <h1
                            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight [text-shadow:0_3px_12px_rgba(255,255,255,0.95)]"
                            style={{ color: '#1E3A8A' }}
                        >
                            REDAS
                        </h1>

                        <p className="text-base sm:text-lg text-black">
                            Integrated Tool for Earthquake and
                            Hydrometeorological Hazard Analysis
                        </p>
                    </div>

                    {/* RIGHT SIDE BUTTON */}
                    <div className="flex lg:justify-end gap-3">
                        {isAuthenticated ? (
                            <>
                                {/* GIS button (Responder only) */}
                                {isResponderView && (
                                    <Button
                                        as={Link}
                                        href="/redas/gis"
                                        className="font-bold text-white min-w-[140px] h-12 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02]"
                                        size="lg"
                                        endContent={<Map className="w-5 h-5" />}
                                        style={{ backgroundColor: '#2563EB' }}
                                        onMouseEnter={(e) => {
                                            (
                                                e.currentTarget as HTMLButtonElement
                                            ).style.backgroundColor = '#1D4ED8';
                                        }}
                                        onMouseLeave={(e) => {
                                            (
                                                e.currentTarget as HTMLButtonElement
                                            ).style.backgroundColor = '#2563EB';
                                        }}
                                    >
                                        GIS
                                    </Button>
                                )}

                                {/* Existing REDAS Dashboard button */}
                                <Button
                                    as={Link}
                                    href="/redas"
                                    className="font-bold text-white min-w-[240px] h-12 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02]"
                                    size="lg"
                                    endContent={
                                        <ArrowRight className="w-5 h-5" />
                                    }
                                    style={{ backgroundColor: '#2563EB' }}
                                    onMouseEnter={(e) => {
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.backgroundColor = '#1D4ED8';
                                    }}
                                    onMouseLeave={(e) => {
                                        (
                                            e.currentTarget as HTMLButtonElement
                                        ).style.backgroundColor = '#2563EB';
                                    }}
                                >
                                    REDAS Dashboard
                                </Button>
                            </>
                        ) : (
                            <Button
                                size="lg"
                                isDisabled
                                className="font-bold min-w-[240px] h-12 bg-blue-300 text-white/70 cursor-not-allowed shadow-xl"
                                endContent={<ArrowRight className="w-5 h-5" />}
                            >
                                REDAS Dashboard
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Content Grid (hide for Responder) */}
                {!isResponderView && (
                    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8">
                        {/* Image Section - REDAS Modules Carousel */}
                        <Card className={`${cardGlass}`}>
                            <CardBody className="p-0">
                                <div className="relative w-full aspect-[4/3] md:aspect-[16/10] overflow-hidden rounded-lg bg-blue-50/40 pt-8 pb-8">
                                    <div
                                        className="overflow-hidden rounded-lg h-full"
                                        ref={emblaRefModules}
                                    >
                                        <div className="flex h-full">
                                            {REDAS_MODULES.map((file, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-[0_0_100%] min-w-0"
                                                >
                                                    <div className="relative w-full h-full px-4 pb-2">
                                                        <Image
                                                            src={`/redas/${file}`}
                                                            alt={file
                                                                .replace(
                                                                    'REDAS_',
                                                                    ''
                                                                )
                                                                .replace(
                                                                    '.png',
                                                                    ''
                                                                )}
                                                            fill
                                                            sizes="(max-width: 768px) 100vw, 50vw"
                                                            className="object-contain object-center"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Slide Counter */}
                                    <div className="absolute top-6 right-6 bg-blue-900/45 text-white px-2 py-0.5 rounded-full text-[12px] backdrop-blur-sm">
                                        {currentSlide + 1} /{' '}
                                        {REDAS_MODULES.length}
                                    </div>
                                </div>
                            </CardBody>

                            {/* Carousel Navigation - Outside image overlay */}
                            <div className="flex items-center justify-center gap-4 -mt-4 pb-10">
                                <CombinedNavigation
                                    canScrollPrev={canScrollPrevModules}
                                    canScrollNext={canScrollNextModules}
                                    onPrevClick={scrollPrevModules}
                                    onNextClick={scrollNextModules}
                                    totalSlides={REDAS_MODULES.length}
                                    currentIndex={currentSlide}
                                    onDotClick={scrollToSlide}
                                />
                            </div>
                        </Card>

                        {/* Content Section */}
                        <div className="space-y-5">
                            {/* About Section */}
                            <Card className={`${cardGlass}`}>
                                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1.5 ring-white/60" />

                                <CardHeader className="pt-4 pb-1">
                                    <div className="w-full px-2 sm:px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow">
                                                <Info className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-[#1E3A8A]">
                                                    About REDAS
                                                </h2>
                                                <div className="mt-1.5 h-[2px] w-14 bg-[#2563EB]/60 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="pt-2 space-y-3 px-5 sm:px-6 pb-5">
                                    <p className="text-[14.5px] sm:text-[15.5px] text-slate-800 leading-[1.65] [text-align:justify]">
                                        {description}
                                    </p>
                                </CardBody>
                            </Card>

                            {/* Features Section */}
                            <Card
                                className="relative rounded-3xl overflow-hidden bg-[#1E3A8A]/85 border border-white/25
                shadow-[0_0_0_1.5px_rgba(255,255,255,0.70),0_18px_45px_rgba(0,0,0,0.22)]
                hover:shadow-[0_0_0_2px_rgba(255,255,255,0.85),0_22px_55px_rgba(0,0,0,0.24)]
                transition-shadow duration-300"
                            >
                                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/35" />

                                <CardHeader className="pt-4 pb-1">
                                    <div className="w-full px-2 sm:px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow">
                                                <Layers className="w-4 h-4 text-[#1E3A8A]" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-white">
                                                    Available Features
                                                </h2>
                                                <div className="mt-1.5 h-[1px] w-14 bg-white/90 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="pt-2 space-y-3 px-5 sm:px-6 pb-5">
                                    {navigationButtons.map((button) => {
                                        const isProtected = isRouteProtected(
                                            button.url
                                        );
                                        const isAccessible =
                                            !isProtected || isAuthenticated;

                                        const content = (
                                            <div
                                                className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 ${innerGlass}
                          transition-transform duration-200 hover:-translate-y-0.5`}
                                            >
                                                <div
                                                    className={`h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg ${
                                                        button.url.includes(
                                                            'faq'
                                                        )
                                                            ? 'bg-gradient-to-r from-sky-600 to-blue-600'
                                                            : button.url.includes(
                                                                    'gis'
                                                                )
                                                              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600'
                                                              : 'bg-gradient-to-r from-blue-600 to-sky-600'
                                                    }`}
                                                >
                                                    <ExternalLink className="h-5 w-5 text-white" />
                                                </div>

                                                <div className="flex-1">
                                                    <p className="font-bold text-[#0B2A6F] text-[15.5px] leading-tight">
                                                        {button.label}
                                                    </p>
                                                    <p className="text-[12.5px] text-slate-600 leading-tight">
                                                        {button.url.includes(
                                                            'faq'
                                                        )
                                                            ? 'FAQs & guides'
                                                            : button.url.includes(
                                                                    'gis'
                                                                )
                                                              ? 'Maps & spatial tools'
                                                              : 'Open module'}
                                                    </p>
                                                </div>

                                                <ArrowRight className="w-5 h-5 text-slate-400" />
                                            </div>
                                        );

                                        if (!isAccessible) {
                                            return (
                                                <div
                                                    key={button.url}
                                                    className="w-full cursor-not-allowed opacity-60"
                                                >
                                                    {content}
                                                </div>
                                            );
                                        }

                                        return (
                                            <Link
                                                key={button.url}
                                                href={button.url}
                                                className="block"
                                            >
                                                {content}
                                            </Link>
                                        );
                                    })}
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Awards & Recognitions Section */}
                {!isResponderView && (
                    <section className="mt-12 mb-8">
                        {/* Header (no card background) */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-gradient-to-r from-blue-600 to-sky-600 rounded-lg shadow-lg">
                                <Award className="w-5 h-5 text-white" />
                            </div>

                            <h2
                                className={`text-2xl font-bold bg-gradient-to-r ${redasTheme.headerGradient} bg-clip-text text-transparent`}
                            >
                                Awards & Recognitions
                            </h2>
                        </div>

                        {/* Awards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {REDAS_AWARDS.map((award, i) => (
                                <Card key={i} className={`${cardGlass}`}>
                                    <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1.5 ring-white/60" />
                                    <CardBody className="p-0">
                                        <div className="relative w-full h-[180px] flex items-center justify-center bg-white">
                                            <Image
                                                src={`/redas/${award.img}`}
                                                alt={award.title}
                                                fill
                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                                                className="object-contain p-3"
                                            />
                                        </div>

                                        <div className="p-3">
                                            <p className="text-xs sm:text-sm font-medium text-center text-slate-700 leading-tight">
                                                {award.title}
                                            </p>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Featured Videos Section */}
                {!isResponderView && (
                    <section className="mb-8">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-gradient-to-r from-blue-600 to-sky-600 rounded-lg shadow-lg">
                                <Video className="w-5 h-5 text-white" />
                            </div>

                            <h2
                                className={`text-2xl font-bold bg-gradient-to-r ${redasTheme.headerGradient} bg-clip-text text-transparent`}
                            >
                                Featured Videos
                            </h2>
                        </div>

                        {/* Videos Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="bg-white shadow-md">
                                <CardBody className="p-0">
                                    <div className="w-full aspect-video">
                                        <iframe
                                            className="w-full h-full rounded-lg"
                                            src="https://www.youtube.com/embed/xWRS4hKAtc8"
                                            title="DOST-Siyensikat"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </CardBody>
                            </Card>

                            <Card className="bg-white shadow-md">
                                <CardBody className="p-0">
                                    <div className="w-full aspect-video">
                                        <iframe
                                            className="w-full h-full rounded-lg"
                                            src="https://www.youtube.com/embed/yfXnZTTSa2o"
                                            title="DAP Feature"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    </section>
                )}

                {/* Statistics Section */}
                {canSeeRedasAnalytics && (
                    <section className="mb-8">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-5">
                            <div
                                className={`p-2 bg-gradient-to-r ${redasTheme.primaryGradient} rounded-lg shadow-lg`}
                            >
                                <Users className="w-5 h-5 text-white" />
                            </div>

                            <h2
                                className={`text-2xl font-bold bg-gradient-to-r ${redasTheme.headerGradient} bg-clip-text text-transparent`}
                            >
                                Training Participant Statistics
                            </h2>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {Array.from({ length: 2 }).map((_, index) => (
                                    <Card
                                        key={index}
                                        className="bg-white shadow-md"
                                    >
                                        <CardBody className="p-6">
                                            <Skeleton className="w-48 h-6 rounded-lg mb-4 mx-auto" />
                                            <Skeleton className="w-64 h-64 rounded-full mx-auto" />
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        ) : dataError ? (
                            <p
                                role="alert"
                                className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"
                            >
                                Training statistics could not be loaded.
                                Reconnect and reload this page; unavailable data
                                is not a zero count.
                            </p>
                        ) : (
                            <ParticipantCharts data={aggregatedData} />
                        )}
                    </section>
                )}

                {/* Additional Sections */}
                <div className="space-y-8">
                    {canSeeRedasAnalytics && (
                        <section className="space-y-4 border-1 border-blue-200 rounded-xl shadow-xl bg-white/60 backdrop-blur-sm p-6">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`p-2 bg-gradient-to-r ${redasTheme.primaryGradient} rounded-lg shadow-lg`}
                                >
                                    <Users className="w-5 h-5 text-white" />
                                </div>

                                <h2
                                    className={`text-2xl font-bold bg-gradient-to-r ${redasTheme.headerGradient} bg-clip-text text-transparent`}
                                >
                                    EDM Training Programs
                                </h2>
                            </div>

                            <EDMTrainings />
                        </section>
                    )}

                    {isAuthenticated && (
                        <section className="space-y-4 border-1 border-blue-200 rounded-xl shadow-xl bg-white/60 backdrop-blur-sm p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-blue-600 to-sky-600 rounded-lg shadow-lg">
                                    <BookOpen className="w-5 h-5 text-white" />
                                </div>

                                <h2
                                    className={`text-2xl font-bold bg-gradient-to-r ${redasTheme.headerGradient} bg-clip-text text-transparent`}
                                >
                                    Thesis Collaborations
                                </h2>
                            </div>

                            <ThesisCollaborations />
                        </section>
                    )}
                    {!isResponderView && (
                        <section className="space-y-4 border-1 border-blue-200 rounded-xl shadow-xl bg-white/60 backdrop-blur-sm p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-blue-600 to-sky-600 rounded-lg shadow-lg">
                                    <Award className="w-5 h-5 text-white" />
                                </div>

                                <h2
                                    className={`text-2xl font-bold bg-gradient-to-r ${redasTheme.headerGradient} bg-clip-text text-transparent`}
                                >
                                    Testimonials
                                </h2>
                            </div>

                            <Testimonials />
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default REDASOverview;
