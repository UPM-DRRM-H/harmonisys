'use client';

import { Button } from '@heroui/react';
import Link from 'next/link';
import Image from 'next/image';
import type { Session } from 'next-auth';
import { useState } from 'react';
import dynamic from 'next/dynamic';
const AuthModal = dynamic(() => import('@/components/auth/AuthModal'));
import { User } from 'lucide-react';

const Hero = ({ session }: { session: Session | null }) => {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalView, setAuthModalView] = useState<'login' | 'register'>(
        'login'
    );
    const partnerLogos = [
        { src: '/upm.png', alt: 'UPM' },
        { src: '/upmcph.png', alt: 'UPM-CPH' },
        { src: '/drrmh.png', alt: 'DRRMH', scale: 1.05 },
        { src: '/dostPhivolcs.png', alt: 'DOST-PHIVOLCS' },
        { src: '/DOST.png', alt: 'DOST'},
        { src: '/pchrd.png', alt: 'PCHRD' },
    ];

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-red-100 via-white via-40% to-white text-gray-900">
            {/* Background image */}
            <Image
                src="/hero-bg.png"
                alt=""
                fill
                priority
                sizes="100vw"
                className="absolute inset-0 object-cover object-center"
                aria-hidden="true"
            />

            {/* Overlay: white on top, maroon on bottom */}
            <div
                className="absolute inset-0 bg-gradient-to-b
                        from-white/95
                        via-white/85
                        to-[#5B0A0A]/70"
                aria-hidden="true"
            />

            {/* ===== Decorative header background ===== */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px]">
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-transparent" />

                <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(2,6,23,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(2,6,23,0.25)_1px,transparent_1px)] [background-size:56px_56px]" />
            </div>

            <div className="relative container mx-auto px-6 w-full max-w-7xl">
                {/* Top text block */}
                <div className="pt-20 lg:pt-24 text-center">
                    {/* Headline inline*/}
                    <h1
                        className="mt-6 font-black
                        text-[2.2rem]
                        sm:text-[3.9rem]
                        md:text-[4.6rem]
                        lg:text-[5.6rem]
                        tracking-tight leading-[1.05]
                        animate-fadeUp"
                    >
                        <span className="bg-gradient-to-r from-[#5B0A0A] via-[#7A1111] to-[#A11B1B] bg-clip-text text-transparent">
                            HARMONIZED
                        </span>{' '}
                        <span className="bg-gradient-to-r from-[#5B0A0A] via-[#7A1111] to-[#A11B1B] bg-clip-text text-transparent">
                            DRRM-H
                        </span>
                    </h1>

                    <p className="mt-4 text-xl md:text-[1.5rem] text-slate-800 max-w-5xl mx-auto leading-relaxed animate-fadeUp animation-delay-200">
                        A unified system with various tools for disaster
                        preparedness and health management.
                    </p>

                    {/* CTA centered */}
                    <div className="mt-10 flex justify-center animate-fadeUp animation-delay-400">
                        {session?.user ? (
                            <Button
                                as={Link}
                                href="/dashboard"
                                color="primary"
                                size="lg"
                                className="
                                    w-80 h-14
                                    font-semibold text-[16px]
                                    rounded-full
                                    bg-gradient-to-r from-[#7A1111] to-[#A11B1B]
                                    hover:from-[#5B0A0A] hover:to-[#7A1111]
                                    transition-all duration-300
                                    transform hover:scale-[1.04]
                                    shadow-lg hover:shadow-xl
                                    ring-1 ring-white/40
                                "
                                aria-label="Get started — open dashboard"
                            >
                                Get Started
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="solid"
                                size="lg"
                                onPress={() => {
                                    setAuthModalView('login');
                                    setIsAuthModalOpen(true);
                                }}
                                startContent={
                                    <User className="w-5 h-5 text-white mr-1" />
                                }
                                className="
                                    w-80 h-14
                                    rounded-full
                                    font-semibold text-[16px]

                                    bg-gradient-to-r from-[#7A1111] via-[#A11B1B] to-[#C21E1E]
                                    text-white

                                    border border-white/10
                                    shadow-lg shadow-black/30
                                    ring-1 ring-white/20

                                    hover:from-[#5B0A0A]
                                    hover:via-[#7A1111]
                                    hover:to-[#A11B1B]

                                    hover:scale-[1.04]
                                    hover:shadow-xl

                                    transition-all duration-300
                                "
                            >
                                Access DRRM tools
                            </Button>
                        )}
                    </div>
                </div>

                {/* Logos band */}
                <div className="mt-14 pb-28 lg:pb-36">
                    <div className="mx-auto max-w-6xl">
                        <div className="flex flex-wrap xl:flex-nowrap items-center justify-center gap-1 md:gap-2 px-4 py-2">
                            {partnerLogos.map((logo) => (
                                <a
                                    key={logo.alt}
                                    className="
                                group
                                w-[100px] h-[70px]
                                md:w-[115px] md:h-[80px]
                                lg:w-[125px] lg:h-[88px]
                                flex items-center justify-center xl:shrink-0
                            "
                                >
                                    <Image
                                        src={logo.src}
                                        alt={logo.alt}
                                        width={320}
                                        height={220}
                                        className="
                                max-h-full max-w-full object-contain
                                transition-all duration-300 ease-out
                                group-hover:scale-[1]
                                group-hover:drop-shadow-md
                            "
                                        style={{
                                            transform: `scale(${logo.scale || 1})`,
                                        }}
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <AuthModal
                isOpen={isAuthModalOpen}
                onOpenChange={setIsAuthModalOpen}
                defaultView={authModalView}
            />
        </section>
    );
};

export default Hero;
