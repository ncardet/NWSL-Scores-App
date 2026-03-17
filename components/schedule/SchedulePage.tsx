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
      const start = startOfWeek(anchorDate, { weekStartsOn: 1 }); // Monday
      const end = endOfWeek(anchorDate, { weekStartsOn: 1 });
      return { startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') };
    } else if (viewMode === 'month') {
      const start = startOfMonth(anchorDate);
      const end = endOfMonth(anchorDate);
      return { startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') };
    } else {
      // Full season: 2026-03-01 to 2026-11-30
      return { startDate: '2026-03-01', endDate: '2026-11-30' };
    }
  }, [viewMode, anchorDate]);

  // Use SWR for client-side fetching; hydrate with server-rendered initial data
  const isInitialRange = startDate === initialStartDate && endDate === initialEndDate;
  const { games: fetchedGames, isLoading } = useSchedule(startDate, endDate);

  const games = isInitialRange && fetchedGames.length === 0 ? initialGames : fetchedGames;

  // Apply filters from URL
  const selectedTeam = searchParams.get('team') ?? '';
  const selectedNetwork = searchParams.get('network') ?? '';

  const filteredGames = useMemo(() => {
    let result = games;
    if (selectedTeam) {
      result = result.filter(
        (g) => g.homeTeam.id === selectedTeam || g.awayTeam.id === selectedTeam
      );
    }
    if (selectedNetwork) {
      result = result.filter((g) =>
        g.broadcasts.some((b) => b.shortName === selectedNetwork)
      );
    }
    return result;
  }, [games, selectedTeam, selectedNetwork]);

  // Group by date
  const groupedGames = useMemo(() => {
    const groups = new Map<string, Game[]>();
    for (const game of filteredGames) {
      const dateKey = game.date.slice(0, 10);
      if (!groups.has(dateKey)) groups.set(dateKey, []);
      groups.get(dateKey)!.push(game);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredGames]);

  const navigatePrev = () => {
    if (viewMode === 'week') setAnchorDate((d) => subDays(d, 7));
    else if (viewMode === 'month') setAnchorDate((d) => subDays(startOfMonth(d), 1));
  };

  const navigateNext = () => {
    if (viewMode === 'week') setAnchorDate((d) => addDays(d, 7));
    else if (viewMode === 'month') {
      const nextMonth = addDays(endOfMonth(anchorDate), 1);
      setAnchorDate(nextMonth);
    }
  };

  const periodLabel = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
      const end = endOfWeek(anchorDate, { weekStartsOn: 1 });
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    } else if (viewMode === 'month') {
      return format(anchorDate, 'MMMM yyyy');
    }
    return '2026 Season';
  }, [viewMode, anchorDate]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* View mode + navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {(['week', 'month', 'season'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 font-medium capitalize transition-colors ${
                viewMode === mode
                  ? 'bg-[#003087] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {viewMode !== 'season' && (
          <div className="flex items-center gap-2">
            <button
              onClick={navigatePrev}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[160px] text-center">
              {periodLabel}
            </span>
            <button
              onClick={navigateNext}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Next"
            >
              <ChevronRight />
            </button>
          </div>
        )}

        {viewMode === 'season' && (
          <span className="text-sm font-medium text-gray-700">{periodLabel}</span>
        )}
      </div>

      {/* Filters */}
      {games.length > 0 && <FilterBar games={games} />}

      {/* Games */}
      {isLoading && !isInitialRange ? (
        <SkeletonList />
      ) : groupedGames.length === 0 ? (
        <EmptyState hasFilters={!!(selectedTeam || selectedNetwork)} />
      ) : (
        <div className="space-y-8">
          {groupedGames.map(([date, dayGames]) => (
            <MatchdayGroup key={date} date={date} games={dayGames} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <div className="text-4xl mb-3">⚽</div>
      <p className="text-sm">
        {hasFilters ? 'No games match your filters' : 'No games scheduled for this period'}
      </p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-8">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
          {[0, 1, 2].map((j) => (
            <div key={j} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
