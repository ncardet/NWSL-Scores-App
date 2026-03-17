'use client';

import type { NwslGoal } from '@/lib/nwsldata/types';
import type { Game } from '@/lib/types';

interface GoalTimelineProps {
  goals: NwslGoal[];
  game: Game;
}

export function GoalTimeline({ goals, game }: GoalTimelineProps) {
  if (!goals.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-2">Goals</h2>
        <p className="text-sm text-gray-400">No goals recorded</p>
      </div>
    );
  }

  const sorted = [...goals].sort((a, b) => a.minute - b.minute);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Goals</h2>

      {/* Score header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">{game.awayTeam.abbreviation}</p>
          <p className="text-3xl font-bold text-gray-900">{game.score?.away ?? 0}</p>
        </div>
        <div className="text-center text-xs text-gray-400">vs</div>
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">{game.homeTeam.abbreviation}</p>
          <p className="text-3xl font-bold text-gray-900">{game.score?.home ?? 0}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative border-l-2 border-gray-100 ml-4 space-y-4 pl-4">
        {sorted.map((goal, i) => {
          const isHomeGoal = goal.team_id === game.homeTeam.id;
          const teamAbbr = isHomeGoal ? game.homeTeam.abbreviation : game.awayTeam.abbreviation;
          const periodLabel = formatPeriod(goal.period, goal.minute);

          return (
            <div key={i} className="relative">
              <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white bg-gray-400" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 tabular-nums w-8">
                  {goal.minute}&apos;
                </span>
                <span className="text-xs font-semibold text-gray-700">{teamAbbr}</span>
                <span className="text-xs text-gray-400">
                  {goal.player_name ?? 'Unknown'}
                </span>
                {periodLabel && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-auto">
                    {periodLabel}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatPeriod(period: string, minute: number): string | null {
  const p = period?.toLowerCase();
  if (p === 'ot' || p === 'overtime' || p === 'et' || p === 'extra_time' || p === '3' || p === '4') {
    return 'OT';
  }
  if (minute >= 90) return 'Stoppage';
  if (minute >= 76) return 'Late';
  return null;
}
