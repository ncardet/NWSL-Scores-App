'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import type { Game } from '@/lib/types';
import { useExcitement, useProjectedExcitement } from '@/hooks/useExcitement';
import type { ExcitementResult } from '@/lib/types';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const isPost = game.state === 'post';
  const isLive = game.state === 'in';
  const isPre = game.state === 'pre';

  const { excitement: actual, isLoading: actualLoading } = useExcitement(isPost ? game : null);
  const { excitement: projected, isLoading: projLoading } = useProjectedExcitement(isPre ? game : null);
  const excitement = isPost ? actual : projected;
  const excitLoading = isPost ? actualLoading : projLoading;

  const kickoffTime = (() => {
    try { return format(parseISO(game.date), 'h:mm a'); } catch { return ''; }
  })();

  const homeWin = isPost && game.score !== undefined && game.score.home > game.score.away;
  const awayWin = isPost && game.score !== undefined && game.score.away > game.score.home;

  return (
    <Link href={`/game/${game.espnId}`} className="block active:opacity-70 transition-opacity">
      <div className="rounded-2xl overflow-hidden" style={{ background: '#1C1C1E' }}>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2.5">
          <StatusLabel game={game} kickoffTime={kickoffTime} />
          <div className="flex flex-wrap gap-1 justify-end">
            {game.broadcasts.slice(0, 2).map((b) => (
              <NetworkChip key={b.shortName} name={b.shortName} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '0.5px', background: '#38383A', marginLeft: 16 }} />

        {/* Teams */}
        <div className="px-4 pt-1 pb-1">
          <TeamRow
            team={game.awayTeam}
            score={game.score?.away}
            isWinner={awayWin}
            isPost={isPost}
            isLive={isLive}
            label="away"
          />
          <div style={{ height: '0.5px', background: '#38383A' }} />
          <TeamRow
            team={game.homeTeam}
            score={game.score?.home}
            isWinner={homeWin}
            isPost={isPost}
            isLive={isLive}
            label="home"
          />
        </div>

        {/* Footer */}
        <div style={{ height: '0.5px', background: '#38383A', marginLeft: 16 }} />
        <div className="flex items-center justify-between px-4 py-2.5">
          <ExcitementPill excitement={excitement} loading={excitLoading} isProjected={isPre} />
          {game.city
            ? <span style={{ color: '#636366', fontSize: 11 }}>{game.city}</span>
            : <span />
          }
        </div>

      </div>
    </Link>
  );
}

function StatusLabel({ game, kickoffTime }: { game: Game; kickoffTime: string }) {
  if (game.state === 'in') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FF453A' }} />
        <span style={{ color: '#FF453A', fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>
          LIVE {game.clock ? `${game.clock}'` : ''}
        </span>
      </div>
    );
  }
  if (game.state === 'post') {
    return <span style={{ color: '#8E8E93', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>Final</span>;
  }
  return <span style={{ color: '#8E8E93', fontSize: 12, fontWeight: 500 }}>{kickoffTime}</span>;
}

function TeamRow({ team, score, isWinner, isPost, isLive, label }: {
  team: Game['homeTeam'];
  score?: number;
  isWinner: boolean;
  isPost: boolean;
  isLive: boolean;
  label: string;
}) {
  const showScore = isPost || isLive;
  const nameColor = isPost ? (isWinner ? '#FFFFFF' : '#8E8E93') : '#FFFFFF';
  const scoreColor = isPost ? (isWinner ? '#FFFFFF' : '#8E8E93') : (isLive ? '#FFFFFF' : '#636366');
  const teamColor = team.color ? `#${team.color.replace('#', '')}` : '#636366';

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Team color accent */}
      <div className="w-1 h-7 rounded-full flex-shrink-0" style={{ background: teamColor }} />

      {/* Logo */}
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)' }}>
        {team.logo ? (
          <Image src={team.logo} alt={team.abbreviation} width={28} height={28}
            className="object-contain" unoptimized />
        ) : (
          <span style={{ color: '#8E8E93', fontSize: 11, fontWeight: 700 }}>{team.abbreviation}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className="block truncate font-semibold text-sm" style={{ color: nameColor }}>
          {team.name}
        </span>
        <span style={{ color: '#636366', fontSize: 11 }}>{label === 'home' ? 'Home' : 'Away'}</span>
      </div>

      {/* Score or dash */}
      {showScore && score !== undefined ? (
        <span className="text-xl tabular-nums font-bold" style={{ color: scoreColor, minWidth: 24, textAlign: 'right' }}>
          {score}
        </span>
      ) : null}

      {/* Winner dot */}
      <div className="w-1.5 flex-shrink-0">
        {isWinner && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FFFFFF' }} />}
      </div>
    </div>
  );
}

function NetworkChip({ name }: { name: string }) {
  const config = networkChipConfig(name);
  return (
    <span className="text-white font-semibold rounded-md px-2 py-0.5" style={{ fontSize: 10, background: config.bg }}>
      {config.label}
    </span>
  );
}

function networkChipConfig(name: string): { bg: string; label: string } {
  const n = name.toLowerCase();
  if (n.includes('prime')) return { bg: '#00A8E1', label: 'Prime' };
  if (n.includes('abc')) return { bg: '#CC0000', label: 'ABC' };
  if (n.includes('espn+') || n.includes('espn +')) return { bg: '#00356B', label: 'ESPN+' };
  if (n.includes('espn unlmtd') || n.includes('espn unlimited')) return { bg: '#00356B', label: 'ESPN∞' };
  if (n.includes('espn2')) return { bg: '#CC0000', label: 'ESPN2' };
  if (n.includes('espn')) return { bg: '#CC0000', label: 'ESPN' };
  if (n.includes('ion')) return { bg: '#6B2D8B', label: 'ION' };
  if (n.includes('cbs sports')) return { bg: '#0056A2', label: 'CBS SN' };
  if (n.includes('cbs')) return { bg: '#0056A2', label: 'CBS' };
  if (n.includes('victory')) return { bg: '#E8871A', label: 'Victory+' };
  if (n.includes('nwsl')) return { bg: '#003087', label: 'NWSL+' };
  if (n.includes('peacock')) return { bg: '#000', label: 'Peacock' };
  return { bg: '#3A3A3C', label: name };
}

const gradeColor: Record<string, string> = {
  Great: '#30D158',
  Good: '#0A84FF',
  OK: '#FF9F0A',
  Dull: '#636366',
};

function ExcitementPill({ excitement, loading, isProjected }: {
  excitement: ExcitementResult | null;
  loading: boolean;
  isProjected: boolean;
}) {
  if (loading) {
    return <div className="rounded-full" style={{ width: 64, height: 18, background: '#2C2C2E' }} />;
  }
  if (!excitement) return <span />;

  const color = gradeColor[excitement.grade] ?? '#636366';
  const label = isProjected ? `~${excitement.score}` : `${excitement.score}`;

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <span style={{ color, fontSize: 12, fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#636366', fontSize: 11 }}>
        {isProjected ? 'est.' : excitement.grade}
      </span>
    </div>
  );
}
