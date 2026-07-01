'use client';

import { footerLinks } from '@/constants';
import { Facebook, Linkedin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Divider } from '@heroui/react';

const TERMS_AND_PRIVACY_URL =
    process.env.NEXT_PUBLIC_TERMS_AND_PRIVACY_URL || '/';

type FooterProps = {
    isAuthenticated?: boolean;
};

const Footer = ({ isAuthenticated = false }: FooterProps) => {
    const partnerLogos = [
        { src: '/upm-bd.png', alt: 'UPM', href: 'https://www.facebook.com/UPManilaOfficial' },
        { src: '/upmcph-bd.png', alt: 'UPM-CPH', href: 'https://www.facebook.com/UPCPH' },
        { src: '/drrmh-bd.png', alt: 'DRRMH', href: 'https://www.facebook.com/UPSimulationCenter' },
        { src: '/dostPhivolcs-bd.png', alt: 'DOST PHIVOLCS', href: 'https://www.facebook.com/PHIVOLCS' },
        { src: '/DOST-bd.png', alt: 'DOST', href: 'https://www.dost.gov.ph/' },
        { src: '/pchrd-bd.png', alt: 'PCHRD', href: 'https://www.facebook.com/dostpchrd' },
    ];

    return (
        <footer
            className="
        text-white
        bg-gradient-to-b
        from-[#3A0F1E]
        via-[#2A0B16]
        to-[#18060C]
        border-t border-white/5
      "
        >
            <div className="container mx-auto px-6 py-14 lg:py-16">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-3 gap-10 lg:gap-8">
                        {/* Brand */}
                        <div>
                            <h3 className="text-2xl font-black mb-5 tracking-wide">
                                HARMONISYS.PH
                            </h3>

                            <p className="text-rose-100/80 mb-6 leading-relaxed">
                                Empowering communities through smart disaster
                                response and health management solutions.
                            </p>

                            <p className="text-xs uppercase tracking-widest text-white mb-3">
                                Partners
                            </p>

                            <div className="flex items-center gap-[2px]">
                                {partnerLogos.map((logo, index) => (
                                    <a
                                        key={index}
                                        href={logo.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="
  w-12 h-12
  flex items-center justify-center
  transition-transform
  hover:scale-105
"
                                    >
                                        <Image
                                            src={logo.src}
                                            alt={logo.alt}
                                            width={48}
                                            height={48}
                                            className={`
  object-contain
  w-7 h-7
  drop-shadow-[0_0_2px_rgba(255,255,255,0.6)]
`}
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Links */}
                        <div className="lg:col-span-2">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
                                {footerLinks.map((section) => (
                                    <div key={section.title}>
                                        <h4 className="text-sm uppercase tracking-widest text-white mb-4">
                                            {section.title}
                                        </h4>

                                        <ul className="space-y-3">
                                            {section.links.map((link) => (
                                                <li key={link.title}>
                                                    <Link
                                                        href={link.url}
                                                        className={`
    text-rose-100/80
    hover:text-white hover:underline underline-offset-4
    transition
    ${section.title === 'Tools' && !isAuthenticated ? 'opacity-80' : ''}
  `}
                                                    >
                                                        {link.title}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Divider className="my-8 bg-white/10" />

                    {/* Bottom */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6">
                            <p className="text-white text-sm">
                                © {new Date().getFullYear()} DOST DRRM-H. All
                                rights reserved.
                            </p>

                            <div className="flex gap-4 text-sm">
                                <Link
                                    href={TERMS_AND_PRIVACY_URL}
                                    className="text-white hover:text-rose-200 hover:underline"
                                >
                                    Privacy Policy
                                </Link>
                                <Link
                                    href={TERMS_AND_PRIVACY_URL}
                                    className="text-white hover:text-rose-200 hover:underline"
                                >
                                    Terms of Service
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
