import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import type { Game } from '@/lib/types';
import { GameCard } from './GameCard';

interface MatchdayGroupProps {
  date: string;
  games: Game[];
}

function formatDateLabel(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEE, MMM d');
  } catch { return dateStr; }
}

export function MatchdayGroup({ date, games }: MatchdayGroupProps) {
  const hasLive = games.some((g) => g.state === 'in');

  return (
    <section>
      {/* Sticky section header */}
      <div className="sticky top-12 z-20 px-4 py-2 flex items-center gap-2"
        style={{ background: 'rgba(0,0,0,0.90)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <span style={{ color: '#8E8E93', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {formatDateLabel(date)}
        </span>
        {hasLive && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#FF453A' }} />
            <span style={{ color: '#FF453A', fontSize: 11, fontWeight: 600 }}>Live</span>
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="px-4 flex flex-col gap-3 pb-2">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  );
}
