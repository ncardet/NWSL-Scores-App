'use client';

import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import type { Game } from '@/lib/types';
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

  const { excitement: actual, isLoading: aLoading } = useExcitement(isPost ? game : null);
  const { excitement: projected, isLoading: pLoading } = useProjectedExcitement(isPre ? game : null);
  const excitement = isPost ? actual : projected;
  const excLoading = isPost ? aLoading : pLoading;

  const kickoffFormatted = (() => {
    try { return format(parseISO(game.date), "EEE, MMM d · h:mm a"); } catch { return ''; }
  })();

  const homeWin = isPost && game.score !== undefined && game.score.home > game.score.away;
  const awayWin = isPost && game.score !== undefined && game.score.away > game.score.home;

  return (
    <div className="max-w-2xl mx-auto pb-12">

      {/* Back button */}
      <div className="px-4 pt-4 pb-2">
        <Link href="/schedule" className="inline-flex items-center gap-1.5" style={{ color: '#0A84FF', fontSize: 14 }}>
          <svg width="9" height="14" viewBox="0 0 9 14" fill="none">
            <path d="M7 1L1 7L7 13" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Scores
        </Link>
      </div>

      {/* Hero matchup card */}
      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: '#1C1C1E' }}>

        {/* Status */}
        <div className="text-center pt-5 pb-3">
          {isLive && (
            <div className="flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#FF453A' }} />
              <span style={{ color: '#FF453A', fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>
                LIVE {game.clock ? `· ${game.clock}'` : ''}
              </span>
            </div>
          )}
          {isPost && <span style={{ color: '#8E8E93', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Final</span>}
          {isPre && <span style={{ color: '#8E8E93', fontSize: 13 }}>{kickoffFormatted}</span>}
        </div>

        {/* Teams + score */}
        <div className="flex items-center justify-between px-6 pb-6 gap-4">

          {/* Away */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.07)' }}>
              {game.awayTeam.logo
                ? <Image src={game.awayTeam.logo} alt={game.awayTeam.name} width={52} height={52} className="object-contain" unoptimized />
                : <span style={{ color: '#8E8E93', fontWeight: 800, fontSize: 18 }}>{game.awayTeam.abbreviation}</span>
              }
            </div>
            <span style={{ color: awayWin ? '#FFFFFF' : '#8E8E93', fontSize: 13, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
              {game.awayTeam.name}
            </span>
            <span style={{ color: '#636366', fontSize: 11 }}>Away</span>
          </div>

          {/* Score or vs */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {(isPost || isLive) && game.score !== undefined ? (
              <>
                <span className="text-5xl font-bold tabular-nums" style={{ color: awayWin ? '#FFFFFF' : '#8E8E93' }}>{game.score.away}</span>
                <span style={{ color: '#38383A', fontSize: 28, fontWeight: 300 }}>–</span>
                <span className="text-5xl font-bold tabular-nums" style={{ color: homeWin ? '#FFFFFF' : '#8E8E93' }}>{game.score.home}</span>
              </>
            ) : (
              <span style={{ color: '#3A3A3C', fontSize: 22, fontWeight: 300 }}>vs</span>
            )}
          </div>

          {/* Home */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.07)' }}>
              {game.homeTeam.logo
                ? <Image src={game.homeTeam.logo} alt={game.homeTeam.name} width={52} height={52} className="object-contain" unoptimized />
                : <span style={{ color: '#8E8E93', fontWeight: 800, fontSize: 18 }}>{game.homeTeam.abbreviation}</span>
              }
            </div>
            <span style={{ color: homeWin ? '#FFFFFF' : '#8E8E93', fontSize: 13, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
              {game.homeTeam.name}
            </span>
            <span style={{ color: '#636366', fontSize: 11 }}>Home</span>
          </div>

        </div>

        {/* Meta rows */}
        {(game.venue || game.city || game.broadcasts.length > 0) && (
          <>
            <div style={{ height: '0.5px', background: '#38383A' }} />
            <div className="px-5 py-4 space-y-3">
              {game.broadcasts.length > 0 && (
                <MetaRow label="Watch on">
                  <div className="flex flex-wrap gap-1.5">
                    {game.broadcasts.map((b) => (
                      <span key={b.shortName} className="text-white font-semibold rounded-md px-2 py-0.5 text-xs"
                        style={{ background: '#2C2C2E', border: '0.5px solid #38383A' }}>
                        {b.shortName}
                      </span>
                    ))}
                  </div>
                </MetaRow>
              )}
              {game.venue && <MetaRow label="Venue">{game.venue}</MetaRow>}
              {game.city && <MetaRow label="Location">{game.city}</MetaRow>}
              {isPre && <MetaRow label="Kickoff">{kickoffFormatted}</MetaRow>}
            </div>
          </>
        )}
      </div>

      {/* Excitement */}
      {(isPost || isPre) && (
        <div className="mx-4 mt-4">
          {excLoading ? (
            <div className="rounded-2xl p-5" style={{ background: '#1C1C1E' }}>
              <div className="space-y-3">
                {[80, 60, 70, 50].map((w, i) => (
                  <div key={i} className="h-5 rounded-lg" style={{ background: '#2C2C2E', width: `${w}%` }} />
                ))}
              </div>
            </div>
          ) : excitement ? (
            <ExcitementBreakdown excitement={excitement} />
          ) : null}
        </div>
      )}

      {/* Goal timeline */}
      {isPost && goals.length > 0 && (
        <div className="mx-4 mt-4">
          <GoalTimeline goals={goals} game={game} />
        </div>
      )}

    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span style={{ color: '#636366', fontSize: 13, minWidth: 72, flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#8E8E93', fontSize: 13 }}>{children}</span>
    </div>
  );
}
