'use client';

import type { NwslGoal } from '@/lib/nwsldata/types';
import type { Game } from '@/lib/types';

export function GoalTimeline({ goals, game }: { goals: NwslGoal[]; game: Game }) {
  if (!goals.length) return null;

  const sorted = [...goals].sort((a, b) => a.minute - b.minute);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#1C1C1E' }}>
      <div className="px-5 pt-5 pb-3">
        <span style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 600 }}>Goals</span>
      </div>
      <div style={{ height: '0.5px', background: '#38383A' }} />

      <div className="px-5 py-4 space-y-0">
        {sorted.map((goal, i) => {
          const isHome = goal.team_id === game.homeTeam.id;
          const team = isHome ? game.homeTeam : game.awayTeam;
          const teamColor = team.color ? `#${team.color.replace('#', '')}` : '#636366';
          const periodBadge = formatPeriod(goal.period, goal.minute);

          return (
            <div key={i}>
              <div className="flex items-center gap-3 py-3">
                <span style={{ color: '#636366', fontSize: 12, fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'right' }}>
                  {goal.minute}'
                </span>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: teamColor }} />
                <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, minWidth: 36 }}>{team.abbreviation}</span>
                <span style={{ color: '#8E8E93', fontSize: 13, flex: 1 }}>{goal.player_name ?? '—'}</span>
                {periodBadge && (
                  <span className="rounded-md px-2 py-0.5" style={{ background: '#2C2C2E', color: '#8E8E93', fontSize: 10, fontWeight: 600 }}>
                    {periodBadge}
                  </span>
                )}
              </div>
              {i < sorted.length - 1 && <div style={{ height: '0.5px', background: '#2C2C2E' }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatPeriod(period: string, minute: number): string | null {
  const p = period?.toLowerCase();
  if (p === 'ot' || p === 'overtime' || p === 'et' || p === 'extra_time' || p === '3' || p === '4') return 'OT';
  if (minute >= 90) return 'Stoppage';
  if (minute >= 76) return 'Late';
  return null;
}
