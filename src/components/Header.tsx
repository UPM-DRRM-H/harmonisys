'use client';

import type React from 'react';
import { footerLinks, headerLinks } from '@/constants';
import { handleSignOut } from '@/lib/action/user';
import { Button } from '@heroui/react';
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    DropdownSection,
    Avatar,
    Badge,
    Chip,
} from '@heroui/react';
import Image from 'next/image';
import Link from 'next/link';
import type { Session } from 'next-auth';
import { MhpssLevel, UserType } from '@prisma/client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const AuthModal = dynamic(() => import('@/components/auth/AuthModal'));

import {
    ChevronDownIcon,
    LogIn,
    MenuIcon,
    XIcon,
    LogOutIcon,
    ClipboardList,
    Waves,
    MapPinned,
    ShieldAlert,
    Phone,
    LayoutGrid,
    User,
    Home,
    Brain,
    Activity as ActivityIcon,
    UserCircle2,
    UserCheck,
    Clock,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import RoleRequestModal from './users/Rolerequestmodal';
import NotificationBell from './misalud/notification/NotificationBell';

interface HeaderProps {
    session: Session | null;
}

const toolIconMap: Record<string, React.ReactNode> = {
    'Incident Reporting System': <Image src="/iris_logo.png" alt="IRS" width={24} height={24} className="w-6 h-6 object-contain" />,
    REDAS: <Image src="/redas/REDAS_logo_name.png" alt="REDAS" width={24} height={24} className="w-6 h-6 object-contain" />,
    Unahon: <Image src="/unahon_logo.png" alt="Unahon" width={32} height={32} className="w-6 h-6 object-contain rounded-full scale-[1.6]" />,
    'Mi Salud': <Image src="/misalud_logo.png" alt="Mi Salud" width={24} height={24} className="w-6 h-6 object-contain" />,
    HazardHunter: <Image src="/hazardHunter_logo.png" alt="HazardHunter" width={24} height={24} className="w-6 h-6 object-contain" />,
};

const headerThemes: Record<string, string> = {
    irs: 'from-[#4A0A18] via-[#6B0F25] to-[#8B1538]',
    unahon: 'from-[#7A0C1E] via-[#991B1B] to-[#B91C1C]',
    misalud: 'from-emerald-800 via-emerald-700 to-emerald-600',
    hazardhunter: 'from-[#5A3A1A] via-[#7B5A3A] to-[#9D7C5A]',
    redas: 'from-blue-800 via-blue-700 to-sky-600',
    dashboard: 'from-[#5B0A0A] via-[#7A1111] to-[#A11B1B]',
    home: 'from-[#4A0707] via-[#6B0F0F] to-[#A11B1B]',
};

const solidThemeByTool: Record<string, string> = {
    irs: '#7b122f',
    redas: '#1d43b9',
    unahon: '#84111d',
    misalud: '#06674b',
    hazardhunter: '#5a3a1a',
    home: '#4A0707',
    dashboard: '#5B0A0A',
};

const toolDropdownBase: Record<string, string> = {
    home: '#77131e',
    irs: '#76112b',
    redas: '#1e4aca',
    unahon: '#90181f',
    misalud: '#077052',
    hazardhunter: '#5e3f1e',
};

function hexToRgb(hex: string) {
    const clean = hex.replace('#', '').trim();
    const full =
        clean.length === 3
            ? clean
                  .split('')
                  .map((c) => c + c)
                  .join('')
            : clean;
    const num = parseInt(full, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function mixWithWhite(hex: string, whiteMix: number) {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${Math.round(r + (255 - r) * whiteMix)} ${Math.round(g + (255 - g) * whiteMix)} ${Math.round(b + (255 - b) * whiteMix)})`;
}

function makeToolDropdownTheme(baseHex: string) {
    return {
        accent: baseHex,
        iconBg: mixWithWhite(baseHex, 0.8),
        hoverBg: mixWithWhite(baseHex, 0.9),
    };
}

const Header: React.FC<HeaderProps> = ({ session }) => {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isToolsExpanded, setToolsExpanded] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalView, setAuthModalView] = useState<'login' | 'register'>(
        'login'
    );

    const [roleRequestOpen, setRoleRequestOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    const [pendingRequest, setPendingRequest] = useState<{
        id: string;
        status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
        toRole: string;
        createdAt?: string;
    } | null>(null);

    const pathname = usePathname();

    const match =
        pathname?.match(/^\/overview\/([^/]+)/) ||
        pathname?.match(/^\/(misalud|irs|unahon|hazardhunter|redas)/);
    const activeTool = pathname?.startsWith('/incidents') ? 'irs' : match?.[1];
    const isDashboard = pathname === '/dashboard';
    const isHome = pathname === '/' || (!activeTool && !isDashboard);

    const headerGradient =
        (activeTool && headerThemes[activeTool]) ||
        (isDashboard && headerThemes.dashboard) ||
        headerThemes.home;

    const solidThemeColor =
        (activeTool && solidThemeByTool[activeTool]) ||
        (isDashboard && solidThemeByTool.dashboard) ||
        solidThemeByTool.home;

    const themeKey =
        activeTool && toolDropdownBase[activeTool] ? activeTool : 'home';
    const toolTheme = makeToolDropdownTheme(
        toolDropdownBase[themeKey] || toolDropdownBase.home
    );

    const toolsCssVars = {
        ['--tool-accent' as any]: toolTheme.accent,
        ['--tool-icon-bg' as any]: toolTheme.iconBg,
        ['--tool-hover-bg' as any]: toolTheme.hoverBg,
    } as React.CSSProperties;

    useEffect(() => {
        if (session?.user?.role !== UserType.STANDARD) return;

        fetch('/api/user/role-request')
            .then((r) => r.json())
            .then((json) => {
                if (json?.success && json.data) {
                    setPendingRequest(json.data);
                }
            })
            .catch(() => {
                /* silent */
            });
    }, [session?.user?.role]);

    const isStandard = mounted && session?.user?.role === UserType.STANDARD;
    const hasPendingRequest = mounted && pendingRequest?.status === 'PENDING';

    const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);

    const getUserInitials = (name: string | null | undefined): string => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((w) => w.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };
    const formatRole = (role: UserType) =>
        role.charAt(0).toUpperCase() + role.toLowerCase().slice(1);
    const formatRoleWithUser = (role: UserType) => `${formatRole(role)} User`;
    const getMhpssDisplay = (mhpssLevel: MhpssLevel | null | undefined) =>
        mhpssLevel ? mhpssLevel.replace('LEVEL_', 'Level ') : 'Not assessed';
    const getMhpssColor = (mhpssLevel: MhpssLevel | null | undefined) => {
        if (mhpssLevel === MhpssLevel.LEVEL_1) return 'secondary' as const;
        if (mhpssLevel === MhpssLevel.LEVEL_2) return 'success' as const;
        if (mhpssLevel === MhpssLevel.LEVEL_3) return 'warning' as const;
        if (mhpssLevel === MhpssLevel.LEVEL_4) return 'danger' as const;
        return 'default' as const;
    };
    const getRoleColor = (role: UserType) => {
        if (role === UserType.ADMIN) return 'danger' as const;
        if (role === UserType.RESPONDER) return 'warning' as const;
        return 'success' as const;
    };

    const navLinks = [
        {
            title: 'Home',
            url: '/',
            icon: <Home className="w-4 h-4 opacity-90" />,
            show: true,
        },
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: <User className="w-4 h-4 opacity-90" />,
            show: mounted && !!session?.user,
        },
        {
            title: 'Tools',
            url: '#',
            icon: <LayoutGrid className="w-4 h-4 opacity-90" />,
            show: true,
        },
        {
            title: 'Contact',
            url: '/contact',
            icon: <Phone className="w-4 h-4 opacity-90" />,
            show: true,
        },
    ];

    return (
        <>
            <header
                className={`
        sticky top-0 z-50 relative overflow-hidden
        bg-gradient-to-r ${headerGradient}
        text-white shadow-2xl shadow-black/45
        border-b border-white/10
        after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-white/15
        backdrop-blur-md bg-opacity-95
      `}
            >
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
                    style={{
                        backgroundImage: `repeating-radial-gradient(circle at 0 0,rgba(255,255,255,0.15),rgba(255,255,255,0.15) 1px,transparent 1px,transparent 2px)`,
                        backgroundSize: '4px 4px',
                    }}
                />
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: `linear-gradient(135deg,rgba(255,255,255,0.25),transparent 60%)`,
                    }}
                />

                <div className="relative z-10">
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-14 md:h-16">
                            <div className="flex-shrink-0 flex items-center gap-2">
                                <Button
                                    as={Link}
                                    href="/"
                                    variant="light"
                                    className="font-bold text-lg tracking-wide text-white hover:!bg-white/10 active:!bg-transparent transition-colors duration-200 py-1 px-2"
                                    startContent={
                                        <Image
                                            src="/Logo 1.png"
                                            alt="Harmonisys Logo"
                                            width={40}
                                            height={40}
                                            className="rounded-lg"
                                        />
                                    }
                                >
                                    <div className="flex flex-col items-start leading-tight">
                                        <span className="font-black text-sm sm:text-base hidden min-[380px]:block">
                                            HARMONISYS.PH
                                        </span>
                                        <span className="text-xs opacity-80 font-normal hidden sm:block">
                                            DRRM-H Platform
                                        </span>
                                    </div>
                                </Button>
                            </div>

                            <nav className="hidden md:flex items-center space-x-1">
                                {navLinks.map((link) => {
                                    if (!link.show) return null;
                                    if (link.title === 'Tools') {
                                        return (
                                            <Dropdown key={link.title}>
                                                <DropdownTrigger>
                                                    <Button
                                                        variant="light"
                                                        className="flex items-center gap-1 px-4 py-2.5 text-white rounded-xl hover:!bg-white/10 active:!bg-transparent data-[pressed=true]:!bg-transparent"
                                                        style={toolsCssVars}
                                                    >
                                                        {link.icon}
                                                        {link.title}
                                                        <ChevronDownIcon className="w-3 h-3 opacity-70" />
                                                    </Button>
                                                </DropdownTrigger>
                                                <DropdownMenu
                                                    aria-label="Tools menu"
                                                    style={toolsCssVars}
                                                    className="min-w-[280px] p-2 bg-white/95 backdrop-blur-md shadow-xl border border-gray-200 rounded-2xl"
                                                >
                                                    <DropdownSection title="DRRM-H Tools">
                                                        {footerLinks[0].links.map(
                                                            (item) => {
                                                                const icon =
                                                                    toolIconMap[
                                                                        item
                                                                            .title
                                                                    ] ?? (
                                                                        <ShieldAlert className="w-4 h-4" />
                                                                    );
                                                                return (
                                                                    <DropdownItem
                                                                        key={
                                                                            item.title
                                                                        }
                                                                        as={
                                                                            Link
                                                                        }
                                                                        href={
                                                                            item.url
                                                                        }
                                                                        aria-label={
                                                                            item.title
                                                                        }
                                                                        className="
            text-gray-900 py-3
            data-[hover=true]:bg-[color:var(--tool-hover-bg)]
            data-[hover=true]:text-[color:var(--tool-accent)]
          "
                                                                        startContent={icon}
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium">
                                                                                {
                                                                                    item.title
                                                                                }
                                                                            </span>
                                                                            <span className="text-xs text-gray-500 mt-1">
                                                                                {item.title ===
                                                                                    'Incident Reporting System' &&
                                                                                    'Real-time incident reporting'}
                                                                                {item.title ===
                                                                                    'REDAS' &&
                                                                                    'Earthquake hazard assessment'}
                                                                                {item.title ===
                                                                                    'Unahon' &&
                                                                                    'Mental health screening'}
                                                                                {item.title ===
                                                                                    'Mi Salud' &&
                                                                                    'Responder wellness tracking'}
                                                                                {item.title ===
                                                                                    'HazardHunter' &&
                                                                                    'Location-based hazard assessment'}
                                                                            </span>
                                                                        </div>
                                                                    </DropdownItem>
                                                                );
                                                            }
                                                        )}
                                                    </DropdownSection>
                                                </DropdownMenu>
                                            </Dropdown>
                                        );
                                    }
                                    return (
                                        <Button
                                            key={link.title}
                                            as={Link}
                                            href={link.url}
                                            variant="light"
                                            className="flex items-center gap-1 px-4 py-2.5 text-white rounded-xl hover:!bg-white/10 active:!bg-transparent"
                                            startContent={link.icon}
                                        >
                                            {link.title}
                                        </Button>
                                    );
                                })}
                            </nav>

                            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                                {mounted && session?.user && <NotificationBell />}
                                {mounted && session?.user ? (
                                    <Dropdown placement="bottom-end">
                                        <DropdownTrigger>
                                            <Button
                                                variant="light"
                                                className="flex items-center gap-3 px-3 py-2.5 text-white rounded-2xl
                          hover:!bg-white/10 active:!bg-transparent
                          data-[pressed=true]:!bg-transparent data-[focus-visible=true]:!bg-transparent
                          border border-white/10 bg-white/5 min-h-[52px]"
                                                aria-label={`User menu for ${session.user.name}`}
                                            >
                                                <Badge
                                                    content={
                                                        hasPendingRequest ? (
                                                            <Clock className="w-2.5 h-2.5" />
                                                        ) : (
                                                            ''
                                                        )
                                                    }
                                                    color={
                                                        hasPendingRequest
                                                            ? 'warning'
                                                            : 'success'
                                                    }
                                                    shape="circle"
                                                    placement="bottom-right"
                                                    size="sm"
                                                >
                                                    <Avatar
                                                        src={
                                                            session.user
                                                                .image ||
                                                            undefined
                                                        }
                                                        name={getUserInitials(
                                                            session.user.name
                                                        )}
                                                        size="sm"
                                                        className="bg-gradient-to-br from-red-400 to-purple-500 text-white ring-2 ring-white/20"
                                                    />
                                                </Badge>

                                                <div className="hidden lg:flex flex-col items-start max-w-[220px] leading-tight shrink-0">
                                                    <span className="text-sm font-semibold truncate text-white">
                                                        {session.user.name ||
                                                            'User'}
                                                    </span>
                                                    {hasPendingRequest ? (
                                                        <span className="mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-semibold bg-amber-400/20 border border-amber-300/30 text-amber-200 whitespace-nowrap">
                                                            <Clock className="w-3 h-3" />{' '}
                                                            Pending Request
                                                        </span>
                                                    ) : (
                                                        <span className="mt-0.3 inline-flex items-center rounded-full px-3 py-[3px] text-[12px] font-medium bg-[#2A060D]/45 border border-white/10 text-white/90 whitespace-nowrap">
                                                            {formatRoleWithUser(
                                                                session.user
                                                                    .role
                                                            )}
                                                        </span>
                                                    )}
                                                </div>

                                                <ChevronDownIcon className="w-4 h-4 opacity-90" />
                                            </Button>
                                        </DropdownTrigger>

                                        <DropdownMenu
                                            aria-label="User menu"
                                            className="min-w-[340px] p-0 bg-white/95 backdrop-blur-md shadow-2xl border border-gray-200 rounded-2xl overflow-hidden"
                                            closeOnSelect={false}
                                            selectionMode="none"
                                        >
                                            <DropdownItem
                                                key="profile"
                                                className="h-auto p-0"
                                                textValue="User profile"
                                            >
                                                <div
                                                    className={`px-5 pt-4 pb-4 bg-gradient-to-r ${headerGradient}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar
                                                            src={
                                                                session.user
                                                                    .image ||
                                                                undefined
                                                            }
                                                            name={getUserInitials(
                                                                session.user
                                                                    .name
                                                            )}
                                                            size="md"
                                                            className="bg-gradient-to-br from-red-400 to-purple-500 text-white ring-2 ring-white/30"
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-white leading-tight truncate">
                                                                {session.user
                                                                    .name ||
                                                                    'User'}
                                                            </div>
                                                            <div className="text-xs text-white/80 truncate">
                                                                {
                                                                    session.user
                                                                        .email
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="px-5 py-4 bg-white">
                                                    <div className="flex flex-wrap gap-2">
                                                        <span
                                                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold bg-gradient-to-r ${headerGradient} text-white border border-white/15`}
                                                        >
                                                            <UserCircle2 className="w-4 h-4 opacity-90" />
                                                            {formatRoleWithUser(
                                                                session.user
                                                                    .role
                                                            )}
                                                        </span>
                                                        <span
                                                            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold bg-white"
                                                            style={{
                                                                color: solidThemeColor,
                                                                border: `1px solid ${solidThemeColor}40`,
                                                            }}
                                                        >
                                                            <ShieldAlert className="w-4 h-4 opacity-80" />
                                                            {getMhpssDisplay(
                                                                session.user
                                                                    .mhpssLevel
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </DropdownItem>

                                            {/* Fixed conditional rendering - always render DropdownItem, hide with CSS when not standard */}
                                            <DropdownItem
                                                key="role-request"
                                                className={
                                                    isStandard
                                                        ? 'px-5 py-0 pb-3 data-[hover=true]:bg-transparent cursor-default'
                                                        : 'hidden h-0 p-0 overflow-hidden'
                                                }
                                                textValue="Request role change"
                                                closeOnSelect={false}
                                            >
                                                {isStandard ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setRoleRequestOpen(
                                                                true
                                                            )
                                                        }
                                                        className={`
                              w-full flex items-center justify-center gap-2
                              rounded-xl border transition-all py-2.5 font-semibold text-sm
                              ${
                                  hasPendingRequest
                                      ? 'border-amber-300 bg-amber-50 text-amber-700 cursor-default'
                                      : 'border-[#A11B1B]/30 bg-[#A11B1B]/5 text-[#7A0C1E] hover:bg-[#A11B1B]/10 hover:border-[#A11B1B]/50'
                              }
                            `}
                                                    >
                                                        {hasPendingRequest ? (
                                                            <>
                                                                <Clock className="w-4 h-4" />
                                                                Role Request
                                                                Pending…
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserCheck className="w-4 h-4" />
                                                                Request
                                                                Responder Role
                                                            </>
                                                        )}
                                                    </button>
                                                ) : null}
                                            </DropdownItem>

                                            <DropdownItem
                                                key="divider"
                                                isDisabled
                                                textValue="divider"
                                                className="h-px p-0 my-0 bg-gray-200 cursor-default"
                                            />

                                            <DropdownItem
                                                key="signout"
                                                className="px-5 pb-5 pt-4 data-[hover=true]:bg-transparent cursor-default"
                                                textValue="Log out"
                                                closeOnSelect={true}
                                            >
                                                <button
                                                    type="button"
                                                    className="w-full flex items-center justify-center gap-2 rounded-xl text-white transition-colors py-3 font-semibold focus:outline-none"
                                                    style={{
                                                        backgroundColor:
                                                            solidThemeColor,
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        (
                                                            e.currentTarget as HTMLButtonElement
                                                        ).style.backgroundColor =
                                                            mixWithWhite(
                                                                solidThemeColor,
                                                                0.1
                                                            );
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        (
                                                            e.currentTarget as HTMLButtonElement
                                                        ).style.backgroundColor =
                                                            solidThemeColor;
                                                    }}
                                                    onClick={() => {
                                                        localStorage.removeItem('locationPromptShown');
                                                        localStorage.removeItem('userLocation');
                                                        handleSignOut();
                                                    }}
                                                >
                                                    <LogOutIcon className="w-4 h-4" />
                                                    Log Out
                                                </button>
                                            </DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="solid"
                                        size="md"
                                        onPress={() => {
                                            setAuthModalView('login');
                                            setIsAuthModalOpen(true);
                                        }}
                                        startContent={
                                            <LogIn className="w-4 h-4 text-[#5B0A0A]" />
                                        }
                                        className="px-5 py-2.5 rounded-xl font-semibold bg-white text-gray-900 border border-[#5B0A0A]/20 shadow-md shadow-black/20 hover:shadow-lg hover:scale-[1.03] hover:bg-white hover:border-red-200 transition-all duration-300 ease-out"
                                    >
                                        <span className="hidden sm:inline bg-gradient-to-r from-[#7A0C1E] via-[#5B0A0A] to-[#3B0505] bg-clip-text text-transparent">
                                            Log In
                                        </span>
                                        <span className="sm:hidden bg-gradient-to-r from-[#7A0C1E] via-[#5B0A0A] to-[#3B0505] bg-clip-text text-transparent">
                                            Sign In
                                        </span>
                                    </Button>
                                )}

                                <div className="md:hidden">
                                    <Button
                                        isIconOnly
                                        variant="light"
                                        onPress={toggleMobileMenu}
                                        aria-label="Toggle mobile menu"
                                        className="text-white hover:bg-black/20 active:bg-transparent"
                                    >
                                        {isMobileMenuOpen ? (
                                            <XIcon className="w-6 h-6" />
                                        ) : (
                                            <MenuIcon className="w-6 h-6" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
                        <div className="px-4 py-3 space-y-2">
                            {navLinks.map((link) => {
                                if (!link.show) return null;
                                if (link.title === 'Tools') {
                                    return (
                                        <div key={link.title}>
                                            <button
                                                onClick={() =>
                                                    setToolsExpanded(
                                                        !isToolsExpanded
                                                    )
                                                }
                                                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-gray-800 hover:bg-gray-100"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {link.icon}
                                                    {link.title}
                                                </div>
                                                <ChevronDownIcon
                                                    className={`w-4 h-4 transition-transform ${isToolsExpanded ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                            {isToolsExpanded && (
                                                <div
                                                    className="mt-1 px-1 space-y-1"
                                                    style={toolsCssVars}
                                                >
                                                    <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold tracking-widest uppercase text-gray-400">
                                                        DRRM-H Tools
                                                    </p>
                                                    {footerLinks[0].links.map(
                                                        (tool) => {
                                                            const icon =
                                                                toolIconMap[
                                                                    tool.title
                                                                ] ?? (
                                                                    <ShieldAlert className="w-4 h-4" />
                                                                );
                                                            return (
                                                                <Link
                                                                    key={
                                                                        tool.title
                                                                    }
                                                                    href={
                                                                        tool.url
                                                                    }
                                                                    onClick={() =>
                                                                        setMobileMenuOpen(
                                                                            false
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                                                                    style={{
                                                                        color: 'var(--tool-accent)',
                                                                    }}
                                                                    onMouseEnter={(
                                                                        e
                                                                    ) => {
                                                                        (
                                                                            e.currentTarget as HTMLAnchorElement
                                                                        ).style.backgroundColor =
                                                                            'var(--tool-hover-bg)';
                                                                    }}
                                                                    onMouseLeave={(
                                                                        e
                                                                    ) => {
                                                                        (
                                                                            e.currentTarget as HTMLAnchorElement
                                                                        ).style.backgroundColor =
                                                                            '';
                                                                    }}
                                                                >
                                                                    {icon}
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="font-medium text-sm text-gray-900 truncate">
                                                                            {
                                                                                tool.title
                                                                            }
                                                                        </span>
                                                                        <span className="text-xs text-gray-500 truncate">
                                                                            {tool.title ===
                                                                                'Incident Reporting System' &&
                                                                                'Real-time incident reporting'}
                                                                            {tool.title ===
                                                                                'REDAS' &&
                                                                                'Earthquake hazard assessment'}
                                                                            {tool.title ===
                                                                                'Unahon' &&
                                                                                'Mental health screening'}
                                                                            {tool.title ===
                                                                                'Mi Salud' &&
                                                                                'Responder wellness tracking'}
                                                                            {tool.title ===
                                                                                'HazardHunter' &&
                                                                                'Location-based hazard assessment'}
                                                                        </span>
                                                                    </div>
                                                                </Link>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return (
                                    <Link
                                        key={link.title}
                                        href={link.url}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-800 hover:bg-gray-100"
                                    >
                                        {link.icon}
                                        {link.title}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </header>

            {session?.user && isStandard && (
                <RoleRequestModal
                    isOpen={roleRequestOpen}
                    onOpenChange={setRoleRequestOpen}
                    session={session}
                    existingRequest={pendingRequest}
                    onSuccess={() => {
                        fetch('/api/user/role-request')
                            .then((r) => r.json())
                            .then((json) => {
                                if (json?.success && json.data)
                                    setPendingRequest(json.data);
                            })
                            .catch(() => {});
                    }}
                />
            )}

            <AuthModal
                isOpen={isAuthModalOpen}
                onOpenChange={setIsAuthModalOpen}
                defaultView={authModalView}
            />
        </>
    );
};

export default Header;
