'use client';

import useSWR from 'swr';
import type { Game, ExcitementResult } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useExcitement(game: Game | null) {
  const url =
    game && game.state === 'post' && game.score
      ? `/api/excitement/${game.espnId}?home=${game.homeTeam.id}&away=${game.awayTeam.id}&date=${encodeURIComponent(game.date)}&homeScore=${game.score.home}&awayScore=${game.score.away}`
      : null;

  const { data, isLoading } = useSWR<{ excitement: ExcitementResult | null }>(url, fetcher, {
    // Excitement scores are immutable — cache forever, no refresh
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    dedupingInterval: 86_400_000, // 24h
  });

  return {
    excitement: data?.excitement ?? null,
    isLoading: !!url && isLoading,
  };
}
