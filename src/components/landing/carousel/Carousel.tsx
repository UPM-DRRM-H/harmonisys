'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@heroui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CarouselCard from './CarouselCard';
import CardContent from './CardContent';
import { carouselElements } from '@/constants';
import type { CarouselItem } from '@/types';

type CarouselProps = {
    isAuthenticated?: boolean;
};

const Carousel = ({ isAuthenticated = false }: CarouselProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState<1 | -1>(1); // 1 = next, -1 = prev
    const [isMobile, setIsMobile] = useState(false);
    const [autoSlideKey, setAutoSlideKey] = useState(0);
    const [dragStartX, setDragStartX] = useState<number | null>(null);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 639px)'); // < sm
        const onChange = () => setIsMobile(mq.matches);

        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    const scrollPrev = () => {
        setAutoSlideKey((prev) => prev + 1);
        setDirection(-1);
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? carouselElements.length - 1 : prevIndex - 1
        );
    };

    const scrollNext = () => {
        setAutoSlideKey((prev) => prev + 1);
        setDirection(1);
        setCurrentIndex((prevIndex) =>
            prevIndex === carouselElements.length - 1 ? 0 : prevIndex + 1
        );
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setDirection(1);
            setCurrentIndex((prevIndex) =>
                prevIndex === carouselElements.length - 1 ? 0 : prevIndex + 1
            );
        }, 4000);

        return () => clearInterval(interval);
    }, [autoSlideKey]);

    const getVisibleItems = useCallback((): CarouselItem[] => {
        if (isMobile) {
            const item = carouselElements[currentIndex];
            return [
                { ...item, relativePosition: 0, carouselIndex: currentIndex },
            ];
        }

        return carouselElements.map((item, index) => {
            let relativePosition = index - currentIndex;

            if (relativePosition > carouselElements.length / 2) {
                relativePosition -= carouselElements.length;
            }

            if (relativePosition < -carouselElements.length / 2) {
                relativePosition += carouselElements.length;
            }

            return {
                ...item,
                relativePosition,
                carouselIndex: index,
            };
        });
    }, [currentIndex, isMobile]);

    const handleDragEnd = (clientX: number) => {
        if (dragStartX === null) return;

        const diff = dragStartX - clientX;

        if (Math.abs(diff) > 60) {
            if (diff > 0) scrollNext();
            else scrollPrev();
        }

        setDragStartX(null);
    };

    return (
        <section
            id="tools"
            className="relative overflow-x-hidden overflow-y-hidden bg-white text-slate-900"
        >
            <div className="relative container mx-auto px-6 w-full max-w-7xl pt-14 pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-6">
                    <div className="w-full sm:max-w-none text-center sm:text-left">
                        <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight text-slate-900 bg-gradient-to-r from-[#7A0F1E] via-[#8B1538] to-[#A11A2F] bg-clip-text text-transparent">
                            Harmonized DRRM-H
                        </h2>

                        <p className="mt-3 text-sm sm:text-base lg:text-lg text-black font-medium">
                            Disaster Risk Reduction and Management in Health
                            tools designed for preparedness, response, and
                            recovery.
                        </p>
                    </div>

                    {/* Controls (desktop) */}
                    <div className="hidden sm:flex items-center gap-3 pt-2">
                        <Button
                            isIconOnly
                            variant="bordered"
                            size="lg"
                            onPress={scrollPrev}
                            className="
                rounded-xl bg-[#8B1538] text-white
                shadow-md hover:bg-[#7A0F1E] hover:shadow-lg transition-all
              "
                            aria-label="Previous item"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>

                        <Button
                            isIconOnly
                            variant="solid"
                            size="lg"
                            onPress={scrollNext}
                            className="
                rounded-xl bg-[#8B1538] text-white
                shadow-md hover:bg-[#7A0F1E] hover:shadow-lg transition-all
              "
                            aria-label="Next item"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Carousel */}
                <div className="relative mt-10">
                    {/* ✅ allow vertical overflow (prevents top cut), keep horizontal clipping */}
                    <div className="relative overflow-x-hidden overflow-y-visible [perspective:1300px]">
                        {/* a bit more vertical room for hover lift */}
                        <div
                            className="relative h-[34rem] py-8 select-none touch-pan-y [transform-style:preserve-3d]"
                            onPointerDown={(e) => setDragStartX(e.clientX)}
                            onPointerUp={(e) => handleDragEnd(e.clientX)}
                            onPointerCancel={() => setDragStartX(null)}
                        >
                            {getVisibleItems().map((item) => {
                                const rp = item.relativePosition as number;

                                const center = rp === 0;
                                const side = Math.abs(rp) === 1;
                                const hidden = Math.abs(rp) > 2;

                                const distance = Math.abs(rp);

                                const rotateY = center
                                    ? 0
                                    : rp === -1
                                      ? -18
                                      : 18;
                                const rotateZ = 0;

                                const translateX = rp * 390;
                                const translateY = 0;
                                const translateZ = center ? 80 : -80;

                                const scale = center
                                    ? 1
                                    : distance === 1
                                      ? 0.82
                                      : 0.65;
                                const opacity = hidden
                                    ? 0
                                    : center
                                      ? 1
                                      : distance === 1
                                        ? 0.55
                                        : 0;
                                const zIndex = center
                                    ? 30
                                    : distance === 1
                                      ? 20
                                      : 0;

                                return (
                                    <div
                                        key={item.carouselIndex}
                                        onClick={() => {
                                            if (rp === -1) scrollPrev();
                                            else if (rp === 1) scrollNext();
                                        }}
                                        className="absolute left-1/2 top-6 w-full sm:w-1/2 lg:w-1/3 px-3 lg:px-4"
                                        style={{
                                            willChange: 'transform, opacity',
                                            transformStyle: 'preserve-3d',
                                            transition:
                                                'transform 900ms cubic-bezier(0.16, 1, 0.3, 1), opacity 900ms ease',
                                            opacity,
                                            zIndex,
                                            pointerEvents: hidden
                                                ? 'none'
                                                : 'auto',
                                            transform: `
                        translateX(-50%)
                        translateX(${translateX}px)
                        translateY(${translateY}px)
                        translateZ(${translateZ}px)
                        rotateY(${rotateY}deg)
                        rotateZ(${rotateZ}deg)
                        scale(${scale})
                      `,
                                            filter: center
                                                ? 'none'
                                                : 'blur(0.3px)',
                                        }}
                                    >
                                        <CarouselCard
                                            onClick={() => {
                                                if (rp === -1) scrollPrev();
                                                else if (rp === 1) scrollNext();
                                            }}
                                            className={`
                        h-[22rem] sm:h-[24rem] select-none transition-all duration-300 ease-out
                        bg-white rounded-3xl shadow-sm border border-slate-200
                        hover:shadow-xl hover:-translate-y-2
                        ${center ? 'ring-2 ring-slate-900/10 shadow-lg' : 'cursor-pointer hover:scale-[1.01]'}
                      `}
                                        >
                                            <CardContent
                                                carouselItem={item}
                                                isAuthenticated={
                                                    isAuthenticated
                                                }
                                            />
                                        </CarouselCard>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* White fades */}
                    <div className="hidden sm:block absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/85 to-transparent pointer-events-none" />
                    <div className="hidden sm:block absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/85 to-transparent pointer-events-none" />
                </div>

                {/* Indicators */}
                <div className="-mt-20 flex justify-center gap-2">
                    {carouselElements.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setDirection(index > currentIndex ? 1 : -1);
                                setCurrentIndex(index);
                            }}
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                                index === currentIndex
                                    ? 'w-10 bg-gradient-to-r from-[#7A0F1E] to-[#A11A2F] shadow-md'
                                    : 'w-6 bg-red-200 hover:bg-red-300'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Mobile controls */}
                <div className="mt-6 flex sm:hidden justify-center items-center gap-3">
                    <Button
                        isIconOnly
                        variant="bordered"
                        size="lg"
                        onPress={scrollPrev}
                        className="bg-white border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all"
                        aria-label="Previous item"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>

                    <Button
                        isIconOnly
                        variant="solid"
                        size="lg"
                        onPress={scrollNext}
                        className="bg-[#8B1538] text-white shadow-sm hover:shadow-md hover:bg-[#7A0F1E] transition-all"
                        aria-label="Next item"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default Carousel;
