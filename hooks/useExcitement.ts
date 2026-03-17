'use client';

import useSWR from 'swr';
import type { Game, ExcitementResult } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const IMMUTABLE_SWR = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: 86_400_000, // 24h
};

// Actual excitement score for completed games (ESPN keyEvents + boxscore)
export function useExcitement(game: Game | null) {
  const url = game && game.state === 'post'
    ? `/api/excitement/${game.espnId}`
    : null;

  const { data, isLoading } = useSWR<{ excitement: ExcitementResult | null }>(
    url, fetcher, IMMUTABLE_SWR
  );

  return {
    excitement: data?.excitement ?? null,
    isLoading: !!url && isLoading,
  };
}

// Projected excitement score for upcoming games (ESPN season goal rates)
export function useProjectedExcitement(game: Game | null) {
  const url = game && game.state === 'pre'
    ? `/api/excitement/projected?home=${game.homeTeam.id}&away=${game.awayTeam.id}`
    : null;

  const { data, isLoading } = useSWR<{ excitement: ExcitementResult | null }>(
    url, fetcher, {
      ...IMMUTABLE_SWR,
      dedupingInterval: 21_600_000, // 6h — team stats change slowly
    }
  );

  return {
    excitement: data?.excitement ?? null,
    isLoading: !!url && isLoading,
  };
}
