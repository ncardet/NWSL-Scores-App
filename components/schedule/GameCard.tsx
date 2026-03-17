'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import type { Game } from '@/lib/types';
import { TeamCrest } from './TeamCrest';
import { BroadcastList } from './BroadcastBadge';
import { ExcitementBadge, LiveIndicator } from './ExcitementBadge';
import { useExcitement } from '@/hooks/useExcitement';

interface GameCardProps {
  game: Game;
  showExcitement?: boolean;
}

export function GameCard({ game, showExcitement = true }: GameCardProps) {
  const isPost = game.state === 'post';
  const isLive = game.state === 'in';
  const isPre = game.state === 'pre';

  const { excitement, isLoading } = useExcitement(
    showExcitement && isPost ? game : null
  );

  const kickoffTime = (() => {
    try {
      return format(parseISO(game.date), 'h:mm a');
    } catch {
      return '—';
    }
  })();

  return (
    <Link href={`/game/${game.espnId}`} className="block group">
      <div className={`
        relative bg-white border rounded-xl p-4 transition-all duration-150
        hover:shadow-md hover:border-blue-300
        ${isLive ? 'border-red-300 shadow-sm shadow-red-100' : 'border-gray-200'}
      `}>
        {/* Live banner */}
        {isLive && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 rounded-t-xl" />
        )}

        <div className="flex items-center gap-3">
          {/* Excitement / Live indicator */}
          <div className="w-12 flex-shrink-0 flex justify-center">
            {isLive ? (
              <LiveIndicator />
            ) : isPost && showExcitement ? (
              <ExcitementBadge excitement={excitement} loading={isLoading} />
            ) : null}
          </div>

          {/* Matchup */}
          <div className="flex-1 min-w-0">
            {/* Teams row */}
            <div className="flex flex-col gap-1.5">
              {/* Away team */}
              <TeamRow
                team={game.awayTeam}
                score={game.score?.away}
                isWinner={isPost && game.score ? game.score.away > game.score.home : false}
                isLive={isLive}
              />
              {/* Home team */}
              <TeamRow
                team={game.homeTeam}
                score={game.score?.home}
                isWinner={isPost && game.score ? game.score.home > game.score.away : false}
                isLive={isLive}
                isHome
              />
            </div>
          </div>

          {/* Right column: time + broadcast */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1.5 min-w-[80px]">
            {isPre && (
              <span className="text-sm font-medium text-gray-700">{kickoffTime}</span>
            )}
            {isLive && game.clock && (
              <span className="text-sm font-bold text-red-600">{game.clock}&apos;</span>
            )}
            {isPost && (
              <span className="text-xs text-gray-400 uppercase tracking-wide">Final</span>
            )}
            <BroadcastList broadcasts={game.broadcasts} small />
          </div>
        </div>

        {/* Venue */}
        {game.city && (
          <p className="text-[11px] text-gray-400 mt-2 ml-12 truncate">{game.city}</p>
        )}
      </div>
    </Link>
  );
}

interface TeamRowProps {
  team: Game['homeTeam'];
  score?: number;
  isWinner: boolean;
  isLive: boolean;
  isHome?: boolean;
}

function TeamRow({ team, score, isWinner, isLive, isHome }: TeamRowProps) {
  return (
    <div className="flex items-center gap-2">
      <TeamCrest team={team} size={24} />
      <span
        className={`flex-1 text-sm truncate ${
          isWinner ? 'font-bold text-gray-900' : 'font-medium text-gray-600'
        }`}
      >
        {team.abbreviation}
        {isHome && <span className="text-gray-400 text-xs ml-1">(H)</span>}
      </span>
      {score !== undefined && (
        <span
          className={`text-sm tabular-nums ${
            isWinner ? 'font-bold text-gray-900' : isLive ? 'font-semibold text-gray-700' : 'text-gray-500'
          }`}
        >
          {score}
        </span>
      )}
    </div>
  );
}
