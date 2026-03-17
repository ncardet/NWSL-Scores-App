import type { ExcitementResult, ExcitementBreakdown } from '../types';
import { fetchSeasonTeamStats, blendWithLeagueAvg, LEAGUE_AVG_GOALS_PER_TEAM } from '../espn/teamStats';
import { scoreGoals, scoreParityContinuous, scoreShotsOnTarget, getGrade } from './scorer';

// League averages for drama factors (seeded from 2026 NWSL opening weekend data)
const LEAGUE_DRAMA_DEFAULTS = {
  lateGoals: 3.5,   // avg pts from late/OT goals
  shotsOnTarget: 8, // avg combined shots on target per game → 8 pts from scoreShotsOnTarget
  redCards: 0.6,    // avg pts from red cards (~0.1 red cards/game)
  comeback: 1.0,    // ~20% of games have a comeback × 5 pts
};

export async function computeProjectedExcitement(
  homeTeamId: string,
  awayTeamId: string
): Promise<ExcitementResult | null> {
  try {
    const allStats = await fetchSeasonTeamStats();

    const homeStats = allStats.get(homeTeamId);
    const awayStats = allStats.get(awayTeamId);

    const homeGames = homeStats?.games ?? 0;
    const awayGames = awayStats?.games ?? 0;

    // Blend team rates with league average (Bayesian shrinkage)
    const homeScoreRate = blendWithLeagueAvg(
      homeStats?.goalsPerGame ?? LEAGUE_AVG_GOALS_PER_TEAM,
      homeGames
    );
    const homeConcededRate = blendWithLeagueAvg(
      homeStats?.concededPerGame ?? LEAGUE_AVG_GOALS_PER_TEAM,
      homeGames
    );
    const awayScoreRate = blendWithLeagueAvg(
      awayStats?.goalsPerGame ?? LEAGUE_AVG_GOALS_PER_TEAM,
      awayGames
    );
    const awayConcededRate = blendWithLeagueAvg(
      awayStats?.concededPerGame ?? LEAGUE_AVG_GOALS_PER_TEAM,
      awayGames
    );

    // Expected goals: average of each team's attack vs opponent's defence
    const expHomeGoals = (homeScoreRate + awayConcededRate) / 2;
    const expAwayGoals = (awayScoreRate + homeConcededRate) / 2;
    const expTotal = expHomeGoals + expAwayGoals;
    const expDiff = Math.abs(expHomeGoals - expAwayGoals);

    // Derive expected shots on target from goal expectancy
    // NWSL avg: ~4 shots on target per expected goal
    const expShotsOnTarget = Math.round(expTotal * 4);

    const breakdown: ExcitementBreakdown = {
      goals: Math.round(scoreGoals(expTotal) * 10) / 10,
      parity: Math.round(scoreParityContinuous(expDiff) * 10) / 10,
      lateGoals: LEAGUE_DRAMA_DEFAULTS.lateGoals,
      shotsOnGoal: scoreShotsOnTarget(expShotsOnTarget),
      redCards: LEAGUE_DRAMA_DEFAULTS.redCards,
      comeback: LEAGUE_DRAMA_DEFAULTS.comeback,
    };

    const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
    const score = Math.round(Math.min(Math.max(total, 0), 100));

    const minGames = Math.min(homeGames, awayGames);
    const confidence: ExcitementResult['confidence'] =
      minGames >= 6 ? 'high' : minGames >= 3 ? 'medium' : 'low';

    return {
      score,
      grade: getGrade(score),
      breakdown,
      isProjected: true,
      confidence,
      h2hGames: 0,
    };
  } catch (err) {
    console.error('Projected excitement failed:', err);
    return null;
  }
}
