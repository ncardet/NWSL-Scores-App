import type { ExcitementResult, ExcitementBreakdown } from '../types';
import type { GoalEvent } from './types';
import {
  getH2HGames,
  getGoalsByGameIds,
  getShotsOnGoalBatch,
  getRedCardsBatch,
  getTeamGoalRate,
} from '../nwsldata/queries';
import { computeExcitementScore, getGrade } from './scorer';
import { getTeamSlug } from '../espn/teamMap';

// League-wide averages used as fallback when no H2H data
const LEAGUE_AVG = {
  totalGoals: 2.4,
  goalDiff: 0.8,
  shotsOnGoal: 9,
  redCardsPerGame: 0.1,
  lateGoalPts: 4,
  comebackPts: 1,
};

export async function computeProjectedExcitement(
  espnHomeId: string,
  espnAwayId: string
): Promise<ExcitementResult | null> {
  const homeSlug = getTeamSlug(espnHomeId);
  const awaySlug = getTeamSlug(espnAwayId);

  if (!homeSlug || !awaySlug) return null;

  try {
    // Fetch all data in parallel
    const [h2hGames, homeRate, awayRate] = await Promise.all([
      getH2HGames(homeSlug, awaySlug),
      getTeamGoalRate(homeSlug),
      getTeamGoalRate(awaySlug),
    ]);

    // Batch-fetch event data for all H2H games
    const gameIds = h2hGames.map((g) => g.game_id);
    const [allGoals, allShots, allCards] = gameIds.length
      ? await Promise.all([
          getGoalsByGameIds(gameIds),
          getShotsOnGoalBatch(gameIds),
          getRedCardsBatch(gameIds),
        ])
      : [[], [], []];

    // Group by game_id
    const goalsByGame = groupBy(allGoals, (g) => g.game_id);
    const shotsByGame = new Map(allShots.map((s) => [s.game_id, Number(s.count)]));
    const cardsByGame = new Map(allCards.map((c) => [c.game_id, Number(c.count)]));

    // Compute excitement score for each H2H game
    const h2hScores: number[] = [];
    const h2hBreakdowns: ExcitementBreakdown[] = [];

    for (let i = 0; i < h2hGames.length; i++) {
      const g = h2hGames[i];
      const goals = (goalsByGame.get(g.game_id) ?? []).map(
        (gl): GoalEvent => ({ minute: gl.minute, teamId: gl.team_id, period: gl.period })
      );
      const shots = shotsByGame.get(g.game_id) ?? LEAGUE_AVG.shotsOnGoal;
      const cards = cardsByGame.get(g.game_id) ?? 0;

      const result = computeExcitementScore(
        goals,
        shots,
        cards,
        g.home_score,
        g.away_score,
        g.home_team_id,
        g.away_team_id
      );

      // Recency weight: most recent game (index 0) = weight N, oldest = weight 1
      const weight = h2hGames.length - i;
      for (let w = 0; w < weight; w++) {
        h2hScores.push(result.score);
        h2hBreakdowns.push(result.breakdown);
      }
    }

    const h2hAvgScore =
      h2hScores.length > 0
        ? h2hScores.reduce((a, b) => a + b, 0) / h2hScores.length
        : null;

    // Average each breakdown factor from H2H history
    const h2hBreakdownAvg = averageBreakdowns(h2hBreakdowns);

    // Goal-rate based projection
    // Dixon-Coles style: expected goals = geometric mean of home attack + away defence
    const expHomeGoals = Math.sqrt(homeRate.scored * awayRate.conceded);
    const expAwayGoals = Math.sqrt(awayRate.scored * homeRate.conceded);
    const expTotal = expHomeGoals + expAwayGoals;
    const expDiff = Math.abs(expHomeGoals - expAwayGoals);

    const goalRateBreakdown = computeGoalRateBreakdown(expTotal, expDiff, h2hBreakdownAvg);

    // Blend H2H history with goal-rate projection
    const h2hCount = h2hGames.length;
    const h2hWeight =
      h2hCount >= 5 ? 0.7 : h2hCount >= 2 ? 0.5 : h2hCount >= 1 ? 0.3 : 0;
    const goalRateWeight = 1 - h2hWeight;

    const blended = blendBreakdowns(
      h2hBreakdownAvg ?? goalRateBreakdown,
      goalRateBreakdown,
      h2hWeight,
      goalRateWeight
    );

    const totalScore = Object.values(blended).reduce((s, v) => s + v, 0);
    const score = Math.round(Math.min(Math.max(totalScore, 0), 100));

    const confidence: ExcitementResult['confidence'] =
      h2hCount >= 5 ? 'high' : h2hCount >= 2 ? 'medium' : 'low';

    return {
      score,
      grade: getGrade(score),
      breakdown: roundBreakdown(blended),
      isProjected: true,
      confidence,
      h2hGames: h2hCount,
    };
  } catch (err) {
    console.error('Projected excitement failed:', err);
    return null;
  }
}

// Build a breakdown using goal-rate estimates, filling drama factors from H2H or league avg
function computeGoalRateBreakdown(
  expTotal: number,
  expDiff: number,
  h2hAvg: ExcitementBreakdown | null
): ExcitementBreakdown {
  // Goals factor
  const goals = expTotal > 0 ? Math.min(expTotal * 5.5 + 2.5, 28) : 0;

  // Parity factor — continuous version of the step function
  const parity = parityFromDiff(expDiff);

  // Drama factors: use H2H averages if we have them, otherwise league defaults
  const lateGoals = h2hAvg?.lateGoals ?? LEAGUE_AVG.lateGoalPts;
  const shotsOnGoal = h2hAvg?.shotsOnGoal ?? scoreShotsFromExpected(expTotal);
  const redCards = h2hAvg?.redCards ?? LEAGUE_AVG.redCardsPerGame * 7; // ~0.7 pts
  const comeback = h2hAvg?.comeback ?? LEAGUE_AVG.comebackPts;

  return { goals, parity, lateGoals, shotsOnGoal, redCards, comeback };
}

// Continuous parity score (no hard steps, smoother for projections)
function parityFromDiff(expDiff: number): number {
  // Interpolate: 0 diff = 25, 1 = 20, 2 = 12, 3 = 5, 4+ = 0
  if (expDiff <= 0) return 25;
  if (expDiff >= 4) return 0;
  if (expDiff <= 1) return 25 - expDiff * 5;
  if (expDiff <= 2) return 20 - (expDiff - 1) * 8;
  if (expDiff <= 3) return 12 - (expDiff - 2) * 7;
  return 5 - (expDiff - 3) * 5;
}

function scoreShotsFromExpected(expGoals: number): number {
  // Rough shot-on-goal estimate: ~3 shots per expected goal
  const expShots = expGoals * 3;
  if (expShots <= 5) return 0;
  if (expShots <= 8) return 4;
  if (expShots <= 12) return 8;
  return 12;
}

function averageBreakdowns(
  breakdowns: ExcitementBreakdown[]
): ExcitementBreakdown | null {
  if (!breakdowns.length) return null;
  const keys = Object.keys(breakdowns[0]) as Array<keyof ExcitementBreakdown>;
  const result = {} as ExcitementBreakdown;
  for (const key of keys) {
    result[key] = breakdowns.reduce((s, b) => s + b[key], 0) / breakdowns.length;
  }
  return result;
}

function blendBreakdowns(
  a: ExcitementBreakdown,
  b: ExcitementBreakdown,
  wA: number,
  wB: number
): ExcitementBreakdown {
  const keys = Object.keys(a) as Array<keyof ExcitementBreakdown>;
  const result = {} as ExcitementBreakdown;
  for (const key of keys) {
    result[key] = a[key] * wA + b[key] * wB;
  }
  return result;
}

function roundBreakdown(b: ExcitementBreakdown): ExcitementBreakdown {
  const keys = Object.keys(b) as Array<keyof ExcitementBreakdown>;
  const result = {} as ExcitementBreakdown;
  for (const key of keys) {
    result[key] = Math.round(b[key] * 10) / 10;
  }
  return result;
}

function groupBy<T>(arr: T[], key: (item: T) => number): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const item of arr) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return map;
}
