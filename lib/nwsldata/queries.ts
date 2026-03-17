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

// Get recent H2H games between two teams (up to 10, most recent first)
export async function getH2HGames(
  slugA: string,
  slugB: string
): Promise<NwslGame[]> {
  const a = escapeStr(slugA);
  const b = escapeStr(slugB);
  const sql = `
    SELECT game_id, date, home_team_id, away_team_id, home_score, away_score
    FROM games
    WHERE (home_team_id = '${a}' AND away_team_id = '${b}')
       OR (home_team_id = '${b}' AND away_team_id = '${a}')
    ORDER BY date DESC
    LIMIT 10
  `;
  return runQuery<NwslGame>(sql);
}

// Batch: goals for multiple game IDs
export async function getGoalsByGameIds(gameIds: number[]): Promise<NwslGoal[]> {
  if (!gameIds.length) return [];
  const sql = `
    SELECT game_id, team_id, minute, period
    FROM goals
    WHERE game_id IN (${gameIds.join(',')})
    ORDER BY game_id, minute ASC
  `;
  return runQuery<NwslGoal>(sql);
}

// Batch: shots on goal count per game
export async function getShotsOnGoalBatch(
  gameIds: number[]
): Promise<Array<{ game_id: number; count: number }>> {
  if (!gameIds.length) return [];
  const sql = `
    SELECT game_id, COUNT(*) as count
    FROM shots
    WHERE game_id IN (${gameIds.join(',')})
    AND shot_outcome IN ('goal', 'saved', 'blocked')
    GROUP BY game_id
  `;
  return runQuery<{ game_id: number; count: number }>(sql);
}

// Batch: red cards per game
export async function getRedCardsBatch(
  gameIds: number[]
): Promise<Array<{ game_id: number; count: number }>> {
  if (!gameIds.length) return [];
  const sql = `
    SELECT game_id, COUNT(*) as count
    FROM game_events
    WHERE game_id IN (${gameIds.join(',')})
    AND type IN ('red_card', 'yellow_red_card')
    GROUP BY game_id
  `;
  return runQuery<{ game_id: number; count: number }>(sql);
}

// A team's average goals scored and conceded over their last N games
export async function getTeamGoalRate(
  slug: string,
  lastN = 10
): Promise<{ scored: number; conceded: number; games: number }> {
  const s = escapeStr(slug);
  const sql = `
    SELECT
      SUM(CASE WHEN home_team_id = '${s}' THEN home_score ELSE away_score END) as scored,
      SUM(CASE WHEN home_team_id = '${s}' THEN away_score ELSE home_score END) as conceded,
      COUNT(*) as games
    FROM (
      SELECT home_team_id, away_team_id, home_score, away_score
      FROM games
      WHERE home_team_id = '${s}' OR away_team_id = '${s}'
      ORDER BY date DESC
      LIMIT ${lastN}
    ) recent
  `;
  const rows = await runQuery<{ scored: number; conceded: number; games: number }>(sql);
  const row = rows[0];
  const games = Number(row?.games ?? 0);
  if (!games) return { scored: 1.2, conceded: 1.2, games: 0 }; // NWSL league avg fallback
  return {
    scored: Number(row.scored) / games,
    conceded: Number(row.conceded) / games,
    games,
  };
}

function escapeStr(s: string): string {
  return s.replace(/'/g, "''");
}
