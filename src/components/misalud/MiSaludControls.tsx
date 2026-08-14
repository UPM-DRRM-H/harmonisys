// components/MiSaludControls.tsx
// Adds a live pending-request badge to the "Team Requests" button.
// Drop-in replacement for your existing MiSaludControls.
'use client';

import { Search, Users, Calendar, ClipboardList } from 'lucide-react';
import { usePendingRequestsCount } from './hooks/useNotifications';

interface MiSaludControlsProps {
    searchQuery: string;
    selectedFilter: string;
    selectedView: 'teams' | 'events';
    setSearchQuery: (v: string) => void;
    setSelectedFilter: (v: string) => void;
    setSelectedView: (v: 'teams' | 'events') => void;
    showLeaderActions?: boolean;
    onLeaderRequestsClick?: () => void;
}

export default function MiSaludControls({
    searchQuery,
    selectedFilter,
    selectedView,
    setSearchQuery,
    setSelectedFilter,
    setSelectedView,
    showLeaderActions = false,
    onLeaderRequestsClick,
}: MiSaludControlsProps) {
    // ── Pending badge ──────────────────────────────────────────────────────
    const { data: pendingData } = usePendingRequestsCount();
    const pendingCount = pendingData?.count ?? 0;

    const filters =
        selectedView === 'events'
            ? [
                  { value: 'all', label: 'All' },
                  { value: 'high-severity', label: 'High' },
                  { value: 'critical-severity', label: 'Critical' },
                  { value: 'archive', label: 'Archive' },
              ]
            : [
                  { value: 'all', label: 'All' },
                  { value: 'archive', label: 'Archive' },
              ];

    return (
        <div className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50/60 self-start">
                    <button
                        onClick={() => setSelectedView('teams')}
                        className={`
                            flex items-center gap-2 px-4 py-2 text-sm font-medium
                            transition-all duration-200
                            ${
                                selectedView === 'teams'
                                    ? 'bg-emerald-700 text-white shadow-inner'
                                    : 'text-emerald-700 hover:bg-emerald-100'
                            }
                        `}
                    >
                        <Users className="w-4 h-4" />
                        Teams
                    </button>
                    <button
                        onClick={() => setSelectedView('events')}
                        className={`
                            flex items-center gap-2 px-4 py-2 text-sm font-medium
                            transition-all duration-200
                            ${
                                selectedView === 'events'
                                    ? 'bg-emerald-700 text-white shadow-inner'
                                    : 'text-emerald-700 hover:bg-emerald-100'
                            }
                        `}
                    >
                        <Calendar className="w-4 h-4" />
                        Events
                    </button>
                </div>

                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={
                            selectedView === 'teams'
                                ? 'Search teams or members…'
                                : 'Search events, location, category…'
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="
                            w-full pl-9 pr-4 py-2
                            rounded-xl border border-slate-200
                            bg-white text-sm text-slate-800
                            placeholder:text-slate-400
                            focus:outline-none focus:ring-2 focus:ring-emerald-400
                            transition
                        "
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {filters.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setSelectedFilter(f.value)}
                        className={`
                            px-3 py-1.5 rounded-lg text-xs font-semibold
                            border transition-all duration-200
                            ${
                                selectedFilter === f.value
                                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                            }
                        `}
                    >
                        {f.label}
                    </button>
                ))}

                {showLeaderActions && onLeaderRequestsClick && (
                    <button
                        onClick={onLeaderRequestsClick}
                        className="
                            relative ml-auto
                            flex items-center gap-2 px-4 py-1.5
                            rounded-xl border border-emerald-300
                            bg-emerald-50 text-emerald-700
                            text-xs font-semibold
                            hover:bg-emerald-700 hover:text-white
                            hover:border-emerald-700
                            transition-all duration-200
                        "
                    >
                        <ClipboardList className="w-4 h-4" />
                        Team Requests
                        {/* Pending badge */}
                        {pendingCount > 0 && (
                            <span
                                className="
                                    min-w-[18px] h-[18px] px-1
                                    flex items-center justify-center
                                    bg-red-500 text-white
                                    text-[10px] font-bold rounded-full
                                    ring-2 ring-white
                                "
                            >
                                {pendingCount > 99 ? '99+' : pendingCount}
                            </span>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
