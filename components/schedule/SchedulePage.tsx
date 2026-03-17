'use client';

import { useState, useMemo } from 'react';
import { addDays, subDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { useSchedule } from '@/hooks/useSchedule';
import { MatchdayGroup } from './MatchdayGroup';
import { FilterBar } from './FilterBar';
import type { Game } from '@/lib/types';

type ViewMode = 'week' | 'month' | 'season';

interface SchedulePageProps {
  initialGames: Game[];
  initialStartDate: string;
  initialEndDate: string;
}

export function SchedulePage({ initialGames, initialStartDate, initialEndDate }: SchedulePageProps) {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [anchorDate, setAnchorDate] = useState(new Date());

  const { startDate, endDate } = useMemo(() => {
    if (viewMode === 'week') {
      const s = startOfWeek(anchorDate, { weekStartsOn: 1 });
      const e = endOfWeek(anchorDate, { weekStartsOn: 1 });
      return { startDate: format(s, 'yyyy-MM-dd'), endDate: format(e, 'yyyy-MM-dd') };
    }
    if (viewMode === 'month') {
      return { startDate: format(startOfMonth(anchorDate), 'yyyy-MM-dd'), endDate: format(endOfMonth(anchorDate), 'yyyy-MM-dd') };
    }
    return { startDate: '2026-03-01', endDate: '2026-11-30' };
  }, [viewMode, anchorDate]);

  const isInitialRange = startDate === initialStartDate && endDate === initialEndDate;
  const { games: fetched, isLoading } = useSchedule(startDate, endDate);
  const games = isInitialRange && fetched.length === 0 ? initialGames : fetched;

  const selectedTeam = searchParams.get('team') ?? '';
  const selectedNetwork = searchParams.get('network') ?? '';

  const filtered = useMemo(() => {
    let r = games;
    if (selectedTeam) r = r.filter((g) => g.homeTeam.id === selectedTeam || g.awayTeam.id === selectedTeam);
    if (selectedNetwork) r = r.filter((g) => g.broadcasts.some((b) => b.shortName === selectedNetwork));
    return r;
  }, [games, selectedTeam, selectedNetwork]);

  const grouped = useMemo(() => {
    const map = new Map<string, Game[]>();
    for (const g of filtered) {
      const key = g.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const periodLabel = useMemo(() => {
    if (viewMode === 'week') {
      const s = startOfWeek(anchorDate, { weekStartsOn: 1 });
      const e = endOfWeek(anchorDate, { weekStartsOn: 1 });
      return `${format(s, 'MMM d')} – ${format(e, 'MMM d')}`;
    }
    if (viewMode === 'month') return format(anchorDate, 'MMMM yyyy');
    return '2026 Season';
  }, [viewMode, anchorDate]);

  const prev = () => {
    if (viewMode === 'week') setAnchorDate((d) => subDays(d, 7));
    else if (viewMode === 'month') setAnchorDate((d) => subDays(startOfMonth(d), 1));
  };
  const next = () => {
    if (viewMode === 'week') setAnchorDate((d) => addDays(d, 7));
    else if (viewMode === 'month') setAnchorDate(addDays(endOfMonth(anchorDate), 1));
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Controls */}
      <div className="sticky top-12 z-30 px-4 pt-3 pb-2" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        {/* Segmented view toggle */}
        <div className="seg-control mb-3">
          {(['week', 'month', 'season'] as ViewMode[]).map((m) => (
            <button key={m} onClick={() => setViewMode(m)} className={`seg-item${viewMode === m ? ' active' : ''}`}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        {viewMode !== 'season' && (
          <div className="flex items-center justify-between">
            <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#1C1C1E' }}>
              <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                <path d="M8 2L2 8L8 14" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 600 }}>{periodLabel}</span>
            <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#1C1C1E' }}>
              <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                <path d="M2 2L8 8L2 14" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
        {viewMode === 'season' && (
          <div className="text-center" style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 600 }}>{periodLabel}</div>
        )}
      </div>

      {/* Filters */}
      {games.length > 0 && (
        <div style={{ borderBottom: '0.5px solid #38383A' }}>
          <FilterBar games={games} />
        </div>
      )}

      {/* Game list */}
      {isLoading && !isInitialRange ? (
        <SkeletonList />
      ) : grouped.length === 0 ? (
        <EmptyState hasFilters={!!(selectedTeam || selectedNetwork)} />
      ) : (
        <div className="pb-8">
          {grouped.map(([date, dayGames]) => (
            <MatchdayGroup key={date} date={date} games={dayGames} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <span style={{ fontSize: 44 }}>⚽</span>
      <span style={{ color: '#8E8E93', fontSize: 15 }}>
        {hasFilters ? 'No games match your filters' : 'No games this period'}
      </span>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="px-4 pt-4 space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 w-24 rounded" style={{ background: '#2C2C2E' }} />
          {[0, 1, 2].map((j) => (
            <div key={j} className="h-28 rounded-2xl" style={{ background: '#1C1C1E' }} />
          ))}
        </div>
      ))}
    </div>
  );
}
