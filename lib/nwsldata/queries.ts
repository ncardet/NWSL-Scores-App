import { runQuery } from './client';
import type { NwslGame, NwslGoal, NwslGameEvent, NwslShotCount } from './types';

// Find game by team slugs and date (YYYY-MM-DD)
export async function findGameId(
  homeSlug: string,
  awaySlug: string,
  date: string
): Promise<number | null> {
  // Search +/- 1 day to handle timezone edge cases
  const d = new Date(date);
  const prev = new Date(d);
  prev.setDate(prev.getDate() - 1);
  const next = new Date(d);
  next.setDate(next.getDate() + 1);

  const fmt = (dt: Date) => dt.toISOString().slice(0, 10);

  const sql = `
    SELECT game_id, date, home_team_id, away_team_id
    FROM games
    WHERE (
      (home_team_id = '${escapeStr(homeSlug)}' AND away_team_id = '${escapeStr(awaySlug)}')
      OR (home_team_id = '${escapeStr(awaySlug)}' AND away_team_id = '${escapeStr(homeSlug)}')
    )
    AND date BETWEEN '${fmt(prev)}' AND '${fmt(next)}'
    ORDER BY ABS(DATEDIFF(date, '${date}'))
    LIMIT 1
  `;

  const rows = await runQuery<NwslGame>(sql);
  return rows[0]?.game_id ?? null;
}

export async function getGoals(gameId: number): Promise<NwslGoal[]> {
  const sql = `
    SELECT game_id, team_id, minute, period
    FROM goals
    WHERE game_id = ${gameId}
    ORDER BY minute ASC
  `;
  return runQuery<NwslGoal>(sql);
}

export async function getShotsOnGoal(gameId: number): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM shots
    WHERE game_id = ${gameId}
    AND shot_outcome IN ('goal', 'saved', 'blocked')
  `;
  const rows = await runQuery<NwslShotCount>(sql);
  return Number(rows[0]?.count ?? 0);
}

export async function getRedCards(gameId: number): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM game_events
    WHERE game_id = ${gameId}
    AND type IN ('red_card', 'yellow_red_card')
  `;
  const rows = await runQuery<{ count: number }>(sql);
  return Number(rows[0]?.count ?? 0);
}

function escapeStr(s: string): string {
  return s.replace(/'/g, "''");
}
