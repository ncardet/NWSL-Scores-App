import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import type { Game } from '@/lib/types';
import { GameCard } from './GameCard';

interface MatchdayGroupProps {
  date: string; // YYYY-MM-DD
  games: Game[];
}

function formatDateLabel(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return `Today — ${format(date, 'EEEE, MMMM d')}`;
    if (isTomorrow(date)) return `Tomorrow — ${format(date, 'EEEE, MMMM d')}`;
    if (isYesterday(date)) return `Yesterday — ${format(date, 'EEEE, MMMM d')}`;
    return format(date, 'EEEE, MMMM d');
  } catch {
    return dateStr;
  }
}

export function MatchdayGroup({ date, games }: MatchdayGroupProps) {
  const hasLive = games.some((g) => g.state === 'in');

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {formatDateLabel(date)}
        </h2>
        {hasLive && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Live
          </span>
        )}
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <div className="flex flex-col gap-2">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}
