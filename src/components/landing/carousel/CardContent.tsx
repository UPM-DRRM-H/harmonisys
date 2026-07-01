import React from 'react';
import type { CardContentProps } from '@/types';
import { Button } from '@heroui/react';
import Link from 'next/link';
import Image from 'next/image';

const iconMap: Record<string, string> = {
    file: '/iris_logo.png',
    waves: '/redas/REDAS_logo_name.png',
    heart: '/unahon_logo.png',
    activity: '/misalud_logo.png',
    map: '/hazardHunter_logo.png',
};

type CardContentExtraProps = {
    isAuthenticated?: boolean;
};

const CardContent = ({
    carouselItem,
    isAuthenticated = false,
}: CardContentProps & CardContentExtraProps) => {
    if (!carouselItem) return null;

    const iconKey = (carouselItem as any).icon as string | undefined;
    const iconSrc = iconKey && iconMap[iconKey] ? iconMap[iconKey] : '/iris_logo.png';

    return (
        <div className="flex h-full flex-col p-5">
            {/* Header: icon + title */}
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                    className="
            flex h-11 w-11 shrink-0 items-center justify-center
            rounded-xl
            border border-[#8B1538]/25
            bg-gradient-to-br from-[#8B1538]/10 to-[#A11A2F]/10
          "
                >
                    <Image src={iconSrc} alt={carouselItem.title} width={28} height={28} className="h-7 w-7 object-contain" />
                </div>

                {/* Title */}
                <div className="min-w-0 flex-1">
                    <span className="text-[11px] tracking-wider font-extrabold uppercase text-black">
                        Project
                    </span>

                    <h3 className="text-base sm:text-lg font-black leading-snug text-[#7A0F1E]">
                        {carouselItem.title}
                    </h3>
                </div>
            </div>

            {/* Description / bullets */}
            <div className="mt-3 flex-1">
                {Array.isArray((carouselItem as any).bullets) &&
                (carouselItem as any).bullets.length > 0 ? (
                    <ul className="mt-2 space-y-1.5 text-sm text-black/80">
                        {(carouselItem as any).bullets
                            .slice(0, 4)
                            .map((b: string, i: number) => (
                                <li key={i} className="flex gap-2">
                                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#8B1538]" />
                                    <span className="leading-relaxed">{b}</span>
                                </li>
                            ))}
                    </ul>
                ) : (
                    <p className="mt-3 text-sm sm:text-[15px] text-black/80 leading-relaxed line-clamp-7">
                        {carouselItem.description}
                    </p>
                )}
            </div>

            {/* Footer button */}
            <div className="mt-4">
                {isAuthenticated ? (
                    <Button
                        as={Link}
                        href={carouselItem.url}
                        radius="full"
                        size="sm"
                        className="
        w-full h-10 text-sm font-semibold
        bg-gradient-to-r from-[#7A0F1E] to-[#A11A2F]
        text-white shadow-md hover:shadow-lg
        hover:from-[#6A0D1A] hover:to-[#8B1538]
        transition-all
      "
                    >
                        Open Tool
                    </Button>
                ) : (
                    <div className="space-y-2">
                        <Button
                            radius="full"
                            size="sm"
                            disabled
                            className="
          w-full h-10 text-sm font-semibold
          bg-slate-200 text-slate-500
          cursor-not-allowed opacity-80
        "
                        >
                            Open Tool
                        </Button>

                        <p className="text-xs text-slate-500 text-center">
                            Sign in to access this tool
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CardContent;
