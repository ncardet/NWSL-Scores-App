'use client';

import type { ExcitementResult } from '@/lib/types';

interface ExcitementBadgeProps {
  excitement: ExcitementResult | null | undefined;
  loading?: boolean;
}

const gradeConfig = {
  Great: { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-400', label: 'text-emerald-600' },
  Good:  { bg: 'bg-blue-500',    text: 'text-white', ring: 'ring-blue-400',    label: 'text-blue-600' },
  OK:    { bg: 'bg-amber-400',   text: 'text-amber-900', ring: 'ring-amber-300', label: 'text-amber-600' },
  Dull:  { bg: 'bg-gray-300',    text: 'text-gray-600', ring: 'ring-gray-200',  label: 'text-gray-400' },
};

const projectedGradeConfig = {
  Great: { bg: 'bg-emerald-50',  text: 'text-emerald-700', ring: 'ring-emerald-300', label: 'text-emerald-600', border: 'border-emerald-300' },
  Good:  { bg: 'bg-blue-50',     text: 'text-blue-700',    ring: 'ring-blue-300',    label: 'text-blue-600',    border: 'border-blue-300' },
  OK:    { bg: 'bg-amber-50',    text: 'text-amber-700',   ring: 'ring-amber-200',   label: 'text-amber-600',   border: 'border-amber-300' },
  Dull:  { bg: 'bg-gray-50',     text: 'text-gray-500',    ring: 'ring-gray-200',    label: 'text-gray-400',    border: 'border-gray-300' },
};

const confidenceLabel: Record<string, string> = {
  high: 'Projected',
  medium: 'Projected',
  low: 'Est.',
};

export function ExcitementBadge({ excitement, loading }: ExcitementBadgeProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
        <div className="w-8 h-2 rounded bg-gray-100 animate-pulse mt-0.5" />
      </div>
    );
  }

  if (!excitement) return null;

  if (excitement.isProjected) {
    return <ProjectedBadge excitement={excitement} />;
  }

  const cfg = gradeConfig[excitement.grade];

  return (
    <div
      className="flex flex-col items-center gap-0.5"
      title={`Excitement: ${excitement.score}/100 (${excitement.grade})`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ring-2 ${cfg.bg} ${cfg.text} ${cfg.ring}`}
      >
        {excitement.score}
      </div>
      <span className={`text-[10px] font-medium ${cfg.label}`}>
        {excitement.grade}
      </span>
    </div>
  );
}

function ProjectedBadge({ excitement }: { excitement: ExcitementResult }) {
  const cfg = projectedGradeConfig[excitement.grade];
  const h2h = excitement.h2hGames ?? 0;
  const conf = excitement.confidence ?? 'low';

  const tooltipLines = [
    `Projected: ${excitement.score}/100 (${excitement.grade})`,
    h2h > 0 ? `Based on ${h2h} past H2H game${h2h !== 1 ? 's' : ''} + current form` : 'Based on team goal rates (no H2H history)',
    conf === 'high' ? 'High confidence' : conf === 'medium' ? 'Medium confidence' : 'Low confidence — limited history',
  ].join('\n');

  return (
    <div
      className="flex flex-col items-center gap-0.5 cursor-default"
      title={tooltipLines}
    >
      {/* Dashed border = projected, not actual */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 border-dashed ${cfg.bg} ${cfg.text} ${cfg.border}`}
      >
        ~{excitement.score}
      </div>
      <span className={`text-[10px] font-medium ${cfg.label}`}>
        {confidenceLabel[conf]}
      </span>
    </div>
  );
}

export function LiveIndicator() {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative w-9 h-9 rounded-full bg-red-500 flex items-center justify-center">
        <span className="text-white font-bold text-[10px] tracking-wide">LIVE</span>
        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
      </div>
    </div>
  );
}
