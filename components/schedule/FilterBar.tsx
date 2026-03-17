'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { Game } from '@/lib/types';

interface FilterBarProps {
  games: Game[];
}

export function FilterBar({ games }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedTeam = searchParams.get('team') ?? '';
  const selectedNetwork = searchParams.get('network') ?? '';

  // Collect unique teams and networks from current game set
  const teams = Array.from(
    new Map(
      games.flatMap((g) => [
        [g.homeTeam.id, g.homeTeam],
        [g.awayTeam.id, g.awayTeam],
      ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const networks = Array.from(
    new Set(games.flatMap((g) => g.broadcasts.map((b) => b.shortName)))
  ).sort();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const hasFilters = selectedTeam || selectedNetwork;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selectedTeam}
        onChange={(e) => updateFilter('team', e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <option value="">All Teams</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <select
        value={selectedNetwork}
        onChange={(e) => updateFilter('network', e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <option value="">All Networks</option>
        {networks.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => {
            updateFilter('team', '');
            updateFilter('network', '');
          }}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
