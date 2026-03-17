'use client';

import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import type { Game } from '@/lib/types';
import { TeamCrest } from '@/components/schedule/TeamCrest';
import { BroadcastList } from '@/components/schedule/BroadcastBadge';
import { ExcitementBreakdown } from './ExcitementBreakdown';
import { GoalTimeline } from './GoalTimeline';
import { useExcitement, useProjectedExcitement } from '@/hooks/useExcitement';
import type { NwslGoal } from '@/lib/nwsldata/types';

interface GameDetailProps {
  game: Game;
  goals?: NwslGoal[];
}

export function GameDetail({ game, goals = [] }: GameDetailProps) {
  const isPost = game.state === 'post';
  const isLive = game.state === 'in';
  const isPre = game.state === 'pre';
  const { excitement: actualExcitement, isLoading: actualLoading } = useExcitement(isPost ? game : null);
  const { excitement: projectedExcitement, isLoading: projectedLoading } = useProjectedExcitement(isPre ? game : null);
  const excitement = isPost ? actualExcitement : projectedExcitement;
  const isLoading = isPost ? actualLoading : projectedLoading;

  const kickoffTime = (() => {
    try {
      return format(parseISO(game.date), "EEEE, MMMM d, yyyy 'at' h:mm a");
    } catch {
      return game.date;
    }
  })();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Back link */}
      <Link href="/schedule" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Schedule
      </Link>

      {/* Match card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {/* Status */}
        <div className="text-center mb-4">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              LIVE {game.clock && `· ${game.clock}'`}
            </span>
          )}
          {isPost && <span className="text-sm text-gray-400 uppercase tracking-wide">Final</span>}
          {game.state === 'pre' && <span className="text-sm text-gray-500">{kickoffTime}</span>}
        </div>

        {/* Teams and score */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <TeamCrest team={game.awayTeam} size={56} />
            <div className="text-center">
              <p className="font-semibold text-gray-900 text-sm">{game.awayTeam.name}</p>
              <p className="text-xs text-gray-400">Away</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(isPost || isLive) && game.score ? (
              <>
                <span className="text-5xl font-bold text-gray-900 tabular-nums">{game.score.away}</span>
                <span className="text-2xl text-gray-300">–</span>
                <span className="text-5xl font-bold text-gray-900 tabular-nums">{game.score.home}</span>
              </>
            ) : (
              <span className="text-2xl font-medium text-gray-300">vs</span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <TeamCrest team={game.homeTeam} size={56} />
            <div className="text-center">
              <p className="font-semibold text-gray-900 text-sm">{game.homeTeam.name}</p>
              <p className="text-xs text-gray-400">Home</p>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
          {game.state === 'pre' && (
            <MetaRow label="Kickoff" value={kickoffTime} />
          )}
          {game.venue && <MetaRow label="Venue" value={game.venue} />}
          {game.city && <MetaRow label="Location" value={game.city} />}
          {game.broadcasts.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400 w-20 flex-shrink-0">Watch on</span>
              <BroadcastList broadcasts={game.broadcasts} />
            </div>
          )}
        </div>
      </div>

      {/* Excitement breakdown */}
      {(isPost || isPre) && (
        isLoading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
            <div className="h-4 w-32 bg-gray-100 rounded mb-4" />
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-6 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        ) : excitement ? (
          <ExcitementBreakdown excitement={excitement} />
        ) : null
      )}

      {/* Goal timeline */}
      {isPost && goals.length > 0 && (
        <GoalTimeline goals={goals} game={game} />
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-gray-400 w-20 flex-shrink-0">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}
