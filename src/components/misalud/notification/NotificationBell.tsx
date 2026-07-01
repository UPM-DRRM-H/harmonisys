'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { AppNotification, useNotifications } from '../hooks/useNotifications';

const TYPE_STYLES: Record<string, { bg: string; dot: string }> = {
    MISALUD_REQUEST_APPROVED: {
        bg: ' border-emerald-400',
        dot: 'bg-emerald-500',
    },
    MISALUD_REQUEST_REJECTED: {
        bg: ' border-red-400',
        dot: 'bg-red-500',
    },
    MISALUD_TEAM_APPROVED: {
        bg: ' border-emerald-400',
        dot: 'bg-emerald-500',
    },
    MISALUD_TEAM_REJECTED: {
        bg: ' border-red-400',
        dot: 'bg-red-500',
    },
    MISALUD_NEW_REQUEST: {
        bg: ' border-amber-400',
        dot: 'bg-amber-500',
    },
    GENERAL: {
        bg: ' border-slate-300',
        dot: 'bg-slate-400',
    },
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60_000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'Just now';
}

function NotificationItem({
    notif,
    onRead,
    onDelete,
    onNavigate,
}: {
    notif: AppNotification;
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
    onNavigate: (notif: AppNotification) => void;
}) {
    const style = TYPE_STYLES[notif.type] ?? TYPE_STYLES.GENERAL;
    return (
        <div
            className={`relative group flex flex-col gap-0.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-50 ${notif.read ? 'opacity-55' : ''} ${style.bg}`}
            onClick={() => {
                if (!notif.read) onRead(notif.id);
                onNavigate(notif);
            }}
        >
            <div className="flex items-start justify-between gap-2 pr-5">
                <p
                    className={`text-sm leading-snug ${notif.read ? 'text-slate-500 font-normal' : 'text-slate-800 font-semibold'}`}
                >
                    {notif.title}
                </p>
                <span className="text-[11px] text-slate-400 shrink-0 mt-0.5">
                    {timeAgo(notif.createdAt)}
                </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2 pr-5">
                {notif.message}
            </p>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notif.id);
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-all duration-150"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}

export default function NotificationBell({
    className = '',
}: {
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const {
        notifications,
        unreadCount,
        isLoading,
        markRead,
        markAllRead,
        deleteNotif,
    } = useNotifications();

    const updatePosition = useCallback(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const panelWidth = Math.min(380, window.innerWidth - 16);
        const rightSpace = window.innerWidth - rect.right;
        // On mobile the bell is near the right edge so right-align to screen edge
        const left = Math.max(8, rect.right - panelWidth);
        setDropdownStyle({
            position: 'fixed',
            top: rect.bottom + 8,
            left,
            zIndex: 9999,
            width: panelWidth,
        });
    }, []);

    useEffect(() => {
        if (open) updatePosition();
    }, [open, updatePosition]);

    // Close on outside click — but ignore clicks inside the dropdown
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (
                buttonRef.current?.contains(e.target as Node) ||
                dropdownRef.current?.contains(e.target as Node)
            )
                return;
            setOpen(false);
        }
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Close on resize only; removed scroll listener so scrolling inside the dropdown works
    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        window.addEventListener('resize', close);
        return () => {
            window.removeEventListener('resize', close);
        };
    }, [open]);

    function handleNavigate(notif: AppNotification) {
        setOpen(false);
        if (notif.link) router.push(notif.link);
    }

    const dropdown = open ? (
        <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-sm">
                        Notifications
                    </span>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={() => markAllRead()}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors"
                    >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                    </button>
                )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto overscroll-contain">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                        Loading…
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                            <Bell className="w-6 h-6 opacity-40" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-slate-600">
                                All caught up
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                No new notifications
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="p-2 space-y-0.5">
                        {notifications.map((n) => (
                            <NotificationItem
                                key={n.id}
                                notif={n}
                                onRead={markRead}
                                onDelete={deleteNotif}
                                onNavigate={handleNavigate}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    ) : null;

    return (
        <div className={className}>
            <button
                ref={buttonRef}
                onClick={() => setOpen((v) => !v)}
                className={`
                    relative flex items-center justify-center
                    w-10 h-10 rounded-xl
                    transition-all duration-200
                    focus:outline-none
                    ${
                        open
                            ? 'bg-white/25 shadow-inner'
                            : 'bg-white/10 hover:bg-white/20 border border-white/15'
                    }
                `}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
                <Bell
                    className={`w-[18px] h-[18px] text-white ${open ? 'fill-white/80' : ''} transition-all`}
                />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full ring-[2px] ring-white/30 shadow-md">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {typeof document !== 'undefined' &&
                createPortal(dropdown, document.body)}
        </div>
    );
}
