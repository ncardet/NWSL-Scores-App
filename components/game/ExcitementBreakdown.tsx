'use client';

import type { ExcitementResult } from '@/lib/types';

interface ExcitementBreakdownProps {
  excitement: ExcitementResult;
}

const factorLabels: Record<string, string> = {
  goals: 'Total Goals',
  parity: 'Competitive Balance',
  lateGoals: 'Late / OT Goals',
  shotsOnGoal: 'Shots on Goal',
  redCards: 'Red Cards',
  comeback: 'Comeback',
};

const factorMax: Record<string, number> = {
  goals: 28,
  parity: 25,
  lateGoals: 20,
  shotsOnGoal: 12,
  redCards: 10,
  comeback: 5,
};

const factorColor: Record<string, string> = {
  goals: '#3B82F6',
  parity: '#10B981',
  lateGoals: '#F59E0B',
  shotsOnGoal: '#8B5CF6',
  redCards: '#EF4444',
  comeback: '#F97316',
};

export function ExcitementBreakdown({ excitement }: ExcitementBreakdownProps) {
  const { breakdown, score, grade } = excitement;

  const gradeColor = {
    Great: 'text-emerald-600',
    Good: 'text-blue-600',
    OK: 'text-amber-600',
    Dull: 'text-gray-400',
  }[grade];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900">Excitement Score</h2>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-bold ${gradeColor}`}>{score}</span>
          <span className="text-gray-400 text-sm">/100</span>
          <span className={`text-sm font-medium ml-1 ${gradeColor}`}>· {grade}</span>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(breakdown).map(([key, value]) => {
          const max = factorMax[key] ?? 10;
          const pct = Math.round((value / max) * 100);
          const color = factorColor[key] ?? '#6B7280';

          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{factorLabels[key] ?? key}</span>
                <span className="font-medium text-gray-800 tabular-nums">
                  {value} <span className="text-gray-400 font-normal">/ {max}</span>
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Powered by nwsldata.com event data. Scores reflect match drama, not quality of play.
      </p>
    </div>
  );
}
