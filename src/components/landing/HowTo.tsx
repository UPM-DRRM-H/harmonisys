'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardBody, Chip } from '@heroui/react';
import Image from 'next/image';
import { Info, Activity, HeartPulse, Siren, BarChart3 } from 'lucide-react';

const About = () => {
    const features = [
        { label: 'Real-time disaster monitoring', icon: Activity },
        { label: 'Community health tracking', icon: HeartPulse },
        { label: 'Emergency response coordination', icon: Siren },
        { label: 'Data-driven insights', icon: BarChart3 },
    ];

    const slides = useMemo(
        () => [
            { src: '/irs_main.jpg', alt: 'HowTo slide 1', scale: 1.1 },
            { src: '/redas_main.png', alt: 'HowTo slide 2' },
            { src: '/unahon_main.png', alt: 'HowTo slide 3' },
            { src: '/mi-salud_main.png', alt: 'HowTo slide 4' },
            { src: '/hazardhunter_main.png', alt: 'HowTo slide 5' },
        ],
        []
    );

    // we append a clone of the first slide at the end
    const extendedSlides = useMemo(() => [...slides, slides[0]], [slides]);

    const [active, setActive] = useState(0);
    const [isAnimating, setIsAnimating] = useState(true);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetAutoplay = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            setIsAnimating(true);
            setActive((p) => {
                if (p >= slides.length) return p; // ⛔ stop at clone
                return p + 1;
            });
        }, 4500);
    }, [slides.length]);

    const goNext = useCallback(() => {
        // manual click -> reset the timer
        resetAutoplay();

        // prevent going beyond clone while waiting for snap-back
        if (active >= slides.length) return;

        setIsAnimating(true);
        setActive((p) => (p >= slides.length ? p : p + 1));
    }, [active, slides.length, resetAutoplay]);

    const goPrev = () => {
        resetAutoplay();
        setIsAnimating(true);
        setActive((p) => (p === 0 ? slides.length - 1 : p - 1));
    };

    useEffect(() => {
        resetAutoplay();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [active, resetAutoplay]);

    return (
        <section className="relative overflow-hidden bg-gradient-to-r from-[#5B0A0A] via-[#7A1111] to-[#A11B1B] text-white shadow-lg border-b border-white/10">
            {/* Subtle texture */}
            <div className="pointer-events-none absolute inset-0 opacity-10">
                <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:48px_48px]" />
            </div>

            <div className="relative container mx-auto px-6 w-full max-w-7xl py-24">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Content */}
                    <div className="space-y-8 min-w-0">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md shadow-sm mb-3">
                                <Info className="w-4 h-4 text-[#FFF523]" />
                                <span className="text-xs font-bold tracking-[0.18em] uppercase text-white/90">
                                    Our Mission
                                </span>
                            </div>

                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight break-words">
                                Empowering Communities Through{' '}
                                <span className="text-[#FFF523] drop-shadow-sm">
                                    Smart Disaster Response
                                </span>
                            </h2>

                            <p className="mt-6 text-base sm:text-lg text-white leading-relaxed">
                                Our Disaster Risk Reduction and Management in
                                Health (DRRM-H) web application streamlines
                                reporting, data analysis, and communication
                                during emergency drills and real-world events.
                            </p>

                            <p className="mt-4 text-base sm:text-lg text-white leading-relaxed">
                                With easy-to-use tools and real-time insights,
                                we enable local authorities and health teams to
                                safeguard public health and enhance preparedness
                                across communities.
                            </p>
                        </div>

                        {/* Features List with icons (2 columns) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                            {features.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="h-9 w-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur-sm">
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-white/95 font-medium">
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Visual */}
                    <div className="relative mt-8 flex justify-center lg:justify-end">
                        <div className="relative w-full max-w-[510px] mx-auto lg:mx-0 lg:w-fit">
                            {/* Bigger card */}
                            <Card className="bg-white border-0 overflow-hidden rounded-3xl shadow-2xl w-full sm:w-[470px] md:w-[510px]">
                                <CardBody className="p-0 relative w-full aspect-[1/1.1]">
                                    {/* Slider */}
                                    <div className="absolute inset-0 overflow-hidden">
                                        <div
                                            className={`absolute inset-0 flex ${
                                                isAnimating
                                                    ? 'transition-transform duration-700 ease-in-out'
                                                    : ''
                                            }`}
                                            style={{
                                                transform: `translateX(-${active * 100}%)`,
                                            }}
                                            onTransitionEnd={() => {
                                                if (active === slides.length) {
                                                    setIsAnimating(false);
                                                    setActive(0);
                                                    requestAnimationFrame(
                                                        () => {
                                                            requestAnimationFrame(
                                                                () =>
                                                                    setIsAnimating(
                                                                        true
                                                                    )
                                                            );
                                                        }
                                                    );
                                                }
                                            }}
                                        >
                                            {extendedSlides.map((s, idx) => (
                                                <div
                                                    key={`${s.src}-${idx}`}
                                                    className="flex-[0_0_100%] min-w-0 h-full"
                                                >
                                                    {/* IMPORTANT:
                    px creates the left/right "lane" for buttons */}
                                                    <div className="relative w-full h-full flex items-center justify-center px-14 py-5">
                                                        <div
                                                            className="relative w-full h-full drop-shadow-[0_12px_25px_rgba(0,0,0,0.35)]"
                                                            style={{ transform: `scale(${(s as any).scale ?? 1})` }}
                                                        >
                                                            <Image
                                                                src={s.src}
                                                                alt={s.alt}
                                                                fill
                                                                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 70vw, 510px"
                                                                className="object-contain object-center"
                                                                priority={
                                                                    idx === 0
                                                                }
                                                                loading={
                                                                    idx === 0
                                                                        ? 'eager'
                                                                        : 'lazy'
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Arrows (move closer to edges) */}
                                    <button
                                        type="button"
                                        aria-label="Previous slide"
                                        onClick={goPrev}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10
                     w-10 h-10 rounded-full bg-white/85 hover:bg-white
                     shadow-lg border border-black/5 flex items-center justify-center transition"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-slate-800" />
                                    </button>

                                    <button
                                        type="button"
                                        aria-label="Next slide"
                                        onClick={goNext}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10
                     w-10 h-10 rounded-full bg-white/85 hover:bg-white
                     shadow-lg border border-black/5 flex items-center justify-center transition"
                                    >
                                        <ChevronRight className="w-5 h-5 text-slate-800" />
                                    </button>

                                    {/* Dots */}
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                                        {slides.map((_, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                aria-label={`Go to slide ${i + 1}`}
                                                onClick={() => {
                                                    resetAutoplay();
                                                    setActive(i);
                                                }}
                                                className={`h-2.5 rounded-full transition-all ${
                                                    i ===
                                                    (active === slides.length
                                                        ? 0
                                                        : active)
                                                        ? 'w-8 bg-[#7A1111]'
                                                        : 'w-2.5 bg-slate-300/80 hover:bg-slate-400'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>

                            {/* glow behind card */}
                            <div className="absolute -z-10 inset-0 blur-3xl bg-red-300/20 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
