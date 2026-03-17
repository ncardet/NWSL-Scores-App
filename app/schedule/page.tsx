import { Suspense } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { fetchGamesForRange } from '@/lib/espn/client';
import { SchedulePage } from '@/components/schedule/SchedulePage';
import type { Game } from '@/lib/types';

export const metadata = {
  title: 'NWSL Schedule 2026',
  description: 'National Women\'s Soccer League 2026 season schedule, scores, and broadcast info',
};

export default async function SchedulePageRoute() {
  // Server-render this week's games for fast initial load
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const initialStartDate = format(weekStart, 'yyyy-MM-dd');
  const initialEndDate = format(weekEnd, 'yyyy-MM-dd');

  let initialGames: Game[] = [];
  try {
    initialGames = await fetchGamesForRange(weekStart, weekEnd);
  } catch (err) {
    console.error('Failed to fetch initial games:', err);
  }

  return (
    <Suspense fallback={null}>
      <SchedulePage
        initialGames={initialGames}
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
      />
    </Suspense>
  );
}
