// Derives per-team season stats from the ESPN scoreboard (no extra API calls).
// Used to project excitement scores for upcoming games.

export interface TeamSeasonStats {
  teamId: string;
  games: number;
  goalsScored: number;
  goalsConceded: number;
  goalsPerGame: number;
  concededPerGame: number;
}

// NWSL 2026 league average (seeded from first 8 games: 19 total goals)
const LEAGUE_AVG_GOALS_PER_TEAM = 1.19;

export async function fetchSeasonTeamStats(): Promise<Map<string, TeamSeasonStats>> {
  // Fetch all 2026 games in one call (scoreboard returns up to ~250 events in a range)
  const res = await fetch(
    'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.nwsl/scoreboard?dates=20260301-20261130',
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return new Map();

  const data = await res.json();
  const events: unknown[] = data.events ?? [];

  const raw = new Map<string, { scored: number; conceded: number; games: number }>();

  for (const event of events as Array<{
    competitions?: Array<{
      status?: { type?: { state?: string } };
      competitors?: Array<{ homeAway: string; score?: string; team: { id: string } }>;
    }>;
  }>) {
    const comp = event.competitions?.[0];
    if (!comp || comp.status?.type?.state !== 'post') continue;

    const home = comp.competitors?.find((c) => c.homeAway === 'home');
    const away = comp.competitors?.find((c) => c.homeAway === 'away');
    if (!home || !away) continue;

    const homeScore = parseInt(home.score ?? '0') || 0;
    const awayScore = parseInt(away.score ?? '0') || 0;

    for (const [teamId, scored, conceded] of [
      [home.team.id, homeScore, awayScore],
      [away.team.id, awayScore, homeScore],
    ] as [string, number, number][]) {
      const prev = raw.get(teamId) ?? { scored: 0, conceded: 0, games: 0 };
      raw.set(teamId, {
        scored: prev.scored + scored,
        conceded: prev.conceded + conceded,
        games: prev.games + 1,
      });
    }
  }

  const result = new Map<string, TeamSeasonStats>();
  for (const [teamId, s] of raw) {
    result.set(teamId, {
      teamId,
      games: s.games,
      goalsScored: s.scored,
      goalsConceded: s.conceded,
      goalsPerGame: s.games > 0 ? s.scored / s.games : LEAGUE_AVG_GOALS_PER_TEAM,
      concededPerGame: s.games > 0 ? s.conceded / s.games : LEAGUE_AVG_GOALS_PER_TEAM,
    });
  }

  return result;
}

// Blend team-specific rate with league average based on sample size
export function blendWithLeagueAvg(teamRate: number, games: number, leagueAvg = LEAGUE_AVG_GOALS_PER_TEAM): number {
  // Bayesian-style shrinkage: trust team data more as games accumulate
  const weight = Math.min(games / 8, 0.85);
  return teamRate * weight + leagueAvg * (1 - weight);
}

export { LEAGUE_AVG_GOALS_PER_TEAM };
