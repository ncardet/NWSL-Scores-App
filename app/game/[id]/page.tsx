import { notFound } from 'next/navigation';
import { fetchGameById } from '@/lib/espn/client';
import { GameDetail } from '@/components/game/GameDetail';
import { findGameId, getGoals } from '@/lib/nwsldata/queries';
import { getTeamSlug } from '@/lib/espn/teamMap';
import type { NwslGoal } from '@/lib/nwsldata/types';

interface GamePageProps {
  params: Promise<{ id: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params;

  const game = await fetchGameById(id);
  if (!game) notFound();

  let goals: NwslGoal[] = [];

  // Fetch goals for completed games
  if (game.state === 'post' && game.score) {
    try {
      const homeSlug = getTeamSlug(game.homeTeam.id);
      const awaySlug = getTeamSlug(game.awayTeam.id);

      if (homeSlug && awaySlug) {
        const gameId = await findGameId(homeSlug, awaySlug, game.date.slice(0, 10));
        if (gameId !== null) {
          goals = await getGoals(gameId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch goals for game:', id, err);
    }
  }

  return <GameDetail game={game} goals={goals} />;
}

export async function generateMetadata({ params }: GamePageProps) {
  const { id } = await params;
  const game = await fetchGameById(id);
  if (!game) return { title: 'Game Not Found' };

  return {
    title: `${game.awayTeam.abbreviation} vs ${game.homeTeam.abbreviation} — NWSL`,
    description: `${game.awayTeam.name} at ${game.homeTeam.name} — ${game.date.slice(0, 10)}`,
  };
}
