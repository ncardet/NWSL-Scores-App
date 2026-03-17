'use client';

import useSWR from 'swr';
import type { Game, ExcitementResult } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const IMMUTABLE_SWR = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: 86_400_000,
};

// Actual excitement score for completed games
export function useExcitement(game: Game | null) {
  const url =
    game && game.state === 'post' && game.score
      ? `/api/excitement/${game.espnId}?home=${game.homeTeam.id}&away=${game.awayTeam.id}&date=${encodeURIComponent(game.date)}&homeScore=${game.score.home}&awayScore=${game.score.away}`
      : null;

  const { data, isLoading } = useSWR<{ excitement: ExcitementResult | null }>(
    url,
    fetcher,
    IMMUTABLE_SWR
  );

  return {
    excitement: data?.excitement ?? null,
    isLoading: !!url && isLoading,
  };
}

// Projected excitement score for upcoming games
export function useProjectedExcitement(game: Game | null) {
  const url =
    game && game.state === 'pre'
      ? `/api/excitement/projected?home=${game.homeTeam.id}&away=${game.awayTeam.id}`
      : null;

  const { data, isLoading } = useSWR<{ excitement: ExcitementResult | null }>(
    url,
    fetcher,
    {
      ...IMMUTABLE_SWR,
      dedupingInterval: 21_600_000, // 6 hours
    }
  );

  return {
    excitement: data?.excitement ?? null,
    isLoading: !!url && isLoading,
  };
}
