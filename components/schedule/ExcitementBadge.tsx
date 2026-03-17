'use client';

import type { ExcitementResult } from '@/lib/types';

interface ExcitementBadgeProps {
  excitement: ExcitementResult | null | undefined;
  loading?: boolean;
}

const gradeConfig = {
  Great: { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-400' },
  Good: { bg: 'bg-blue-500', text: 'text-white', ring: 'ring-blue-400' },
  OK: { bg: 'bg-amber-400', text: 'text-amber-900', ring: 'ring-amber-300' },
  Dull: { bg: 'bg-gray-300', text: 'text-gray-600', ring: 'ring-gray-200' },
};

export function ExcitementBadge({ excitement, loading }: ExcitementBadgeProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (!excitement) return null;

  const cfg = gradeConfig[excitement.grade];

  return (
    <div className="flex flex-col items-center gap-0.5" title={`Excitement: ${excitement.score}/100 (${excitement.grade})`}>
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ring-2 ${cfg.bg} ${cfg.text} ${cfg.ring}`}
      >
        {excitement.score}
      </div>
      <span className={`text-[10px] font-medium ${
        excitement.grade === 'Dull' ? 'text-gray-400' :
        excitement.grade === 'OK' ? 'text-amber-600' :
        excitement.grade === 'Good' ? 'text-blue-600' : 'text-emerald-600'
      }`}>
        {excitement.grade}
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
