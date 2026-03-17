'use client';

import useSWR from 'swr';
import type { Game } from '@/lib/types';

interface ScheduleResponse {
  games: Game[];
  hasLive: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useSchedule(startDate: string, endDate: string) {
  const url = `/api/schedule?startDate=${startDate}&endDate=${endDate}`;

  const { data, error, isLoading, mutate } = useSWR<ScheduleResponse>(url, fetcher, {
    // Refresh every 30 seconds if there are live games, otherwise 5 minutes
    refreshInterval: (data) => (data?.hasLive ? 30_000 : 300_000),
    revalidateOnFocus: true,
    dedupingInterval: 10_000,
  });

  return {
    games: data?.games ?? [],
    hasLive: data?.hasLive ?? false,
    isLoading,
    error,
    mutate,
  };
}
