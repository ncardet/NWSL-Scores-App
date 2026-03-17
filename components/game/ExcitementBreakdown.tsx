'use client';

import type { ExcitementResult } from '@/lib/types';

interface ExcitementBreakdownProps {
  excitement: ExcitementResult;
}

const actualLabels: Record<string, string> = {
  goals: 'Total Goals',
  parity: 'Competitive Balance',
  lateGoals: 'Late / OT Goals',
  shotsOnGoal: 'Shots on Target',
  redCards: 'Red Cards',
  comeback: 'Comeback',
};

const projectedLabels: Record<string, string> = {
  goals: 'Expected Goals',
  parity: 'Expected Balance',
  lateGoals: 'Late Goals (avg)',
  shotsOnGoal: 'Expected Shots',
  redCards: 'Red Cards (avg)',
  comeback: 'Comeback (avg)',
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
  const { breakdown, score, grade, isProjected, confidence, h2hGames } = excitement;
  const labels = isProjected ? projectedLabels : actualLabels;

  const gradeColor = {
    Great: 'text-emerald-600',
    Good: 'text-blue-600',
    OK: 'text-amber-600',
    Dull: 'text-gray-400',
  }[grade];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-base font-semibold text-gray-900">
          {isProjected ? 'Projected Excitement' : 'Excitement Score'}
        </h2>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-bold ${gradeColor}`}>
            {isProjected ? '~' : ''}{score}
          </span>
          <span className="text-gray-400 text-sm">/100</span>
          <span className={`text-sm font-medium ml-1 ${gradeColor}`}>· {grade}</span>
        </div>
      </div>

      {isProjected && (
        <p className="text-xs text-gray-400 mb-4">
          {confidence === 'high'
            ? `Based on ${h2hGames ?? ''}2026 season goal rates — high confidence`
            : confidence === 'medium'
            ? 'Based on 2026 season goal rates — medium confidence'
            : 'Based on 2026 season goal rates — limited data, low confidence'}
        </p>
      )}
      {!isProjected && <div className="mb-4" />}

      <div className="space-y-3">
        {Object.entries(breakdown).map(([key, value]) => {
          const max = factorMax[key] ?? 10;
          const pct = Math.round((value / max) * 100);
          const color = factorColor[key] ?? '#6B7280';

          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{labels[key] ?? key}</span>
                <span className="font-medium text-gray-800 tabular-nums">
                  {value} <span className="text-gray-400 font-normal">/ {max}</span>
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isProjected ? 'opacity-70' : ''}`}
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        {isProjected
          ? 'Projection uses 2026 season goal rates. Drama factors (late goals, red cards, comebacks) use league averages.'
          : 'Based on ESPN match data: goals, timing, shots on target, and red cards.'}
      </p>
    </div>
  );
}
