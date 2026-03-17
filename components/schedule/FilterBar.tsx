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

  const teams = Array.from(
    new Map(games.flatMap((g) => [
      [g.homeTeam.id, g.homeTeam],
      [g.awayTeam.id, g.awayTeam],
    ])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const networks = Array.from(
    new Set(games.flatMap((g) => g.broadcasts.map((b) => b.shortName)))
  ).sort();

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set(key, value) : params.delete(key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const hasFilters = selectedTeam || selectedNetwork;

  const selectStyle: React.CSSProperties = {
    background: '#1C1C1E',
    color: '#FFFFFF',
    border: '0.5px solid #38383A',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 13,
    outline: 'none',
    appearance: 'none' as const,
    WebkitAppearance: 'none',
    minWidth: 110,
  };

  return (
    <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      <select value={selectedTeam} onChange={(e) => update('team', e.target.value)} style={selectStyle}>
        <option value="">All Teams</option>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.abbreviation}</option>)}
      </select>

      <select value={selectedNetwork} onChange={(e) => update('network', e.target.value)} style={selectStyle}>
        <option value="">All Networks</option>
        {networks.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>

      {hasFilters && (
        <button
          onClick={() => { update('team', ''); update('network', ''); }}
          style={{ color: '#0A84FF', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
