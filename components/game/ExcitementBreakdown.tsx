'use client';

import type { ExcitementResult } from '@/lib/types';

const actualLabels: Record<string, string> = {
  goals: 'Goals',
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

const factorMax: Record<string, number> = { goals: 28, parity: 25, lateGoals: 20, shotsOnGoal: 12, redCards: 10, comeback: 5 };

const factorColor: Record<string, string> = {
  goals: '#0A84FF',
  parity: '#30D158',
  lateGoals: '#FF9F0A',
  shotsOnGoal: '#BF5AF2',
  redCards: '#FF453A',
  comeback: '#FF6B00',
};

const gradeColor: Record<string, string> = { Great: '#30D158', Good: '#0A84FF', OK: '#FF9F0A', Dull: '#636366' };

export function ExcitementBreakdown({ excitement }: { excitement: ExcitementResult }) {
  const { breakdown, score, grade, isProjected, confidence } = excitement;
  const labels = isProjected ? projectedLabels : actualLabels;
  const gColor = gradeColor[grade];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#1C1C1E' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-baseline justify-between mb-1">
          <span style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 600 }}>
            {isProjected ? 'Projected Watchability' : 'Match Excitement'}
          </span>
          <div className="flex items-baseline gap-1">
            <span style={{ color: gColor, fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              {isProjected ? '~' : ''}{score}
            </span>
            <span style={{ color: '#636366', fontSize: 13 }}>/100</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: gColor, fontSize: 13, fontWeight: 600 }}>{grade}</span>
          {isProjected && (
            <span style={{ color: '#636366', fontSize: 11 }}>
              {confidence === 'high' ? 'High confidence' : confidence === 'medium' ? 'Medium confidence' : 'Low confidence · limited data'}
            </span>
          )}
        </div>
      </div>

      <div style={{ height: '0.5px', background: '#38383A' }} />

      {/* Factors */}
      <div className="px-5 py-4 space-y-4">
        {Object.entries(breakdown).map(([key, value]) => {
          const max = factorMax[key] ?? 10;
          const pct = Math.min(Math.round((value / max) * 100), 100);
          const color = factorColor[key] ?? '#636366';

          return (
            <div key={key}>
              <div className="flex justify-between mb-1.5">
                <span style={{ color: '#8E8E93', fontSize: 13 }}>{labels[key] ?? key}</span>
                <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {value} <span style={{ color: '#636366', fontWeight: 400 }}>/ {max}</span>
                </span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: '#2C2C2E' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: isProjected ? `${color}99` : color }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: '0.5px', background: '#38383A' }} />
      <div className="px-5 py-3">
        <span style={{ color: '#636366', fontSize: 11 }}>
          {isProjected
            ? 'Based on 2026 season goal rates + league averages for unpredictable factors.'
            : 'Computed from ESPN match data: goals, timing, shots on target, red cards.'}
        </span>
      </div>
    </div>
  );
}
