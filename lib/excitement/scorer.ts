import type { ExcitementResult, ExcitementBreakdown } from '../types';
import type { GoalEvent } from './types';
import { findGameId, getGoals, getShotsOnGoal, getRedCards } from '../nwsldata/queries';
import { getTeamSlug } from '../espn/teamMap';

// Grade thresholds
export function getGrade(score: number): ExcitementResult['grade'] {
  if (score >= 85) return 'Great';
  if (score >= 65) return 'Good';
  if (score >= 40) return 'OK';
  return 'Dull';
}

// Factor: Total goals (max 28)
function scoreGoals(totalGoals: number): number {
  if (totalGoals === 0) return 0;
  return Math.min(totalGoals * 5.5 + 2.5, 28);
}

// Factor: Parity / score differential (max 25)
function scoreParity(goalDiff: number): number {
  const diff = Math.abs(goalDiff);
  if (diff === 0) return 25;
  if (diff === 1) return 20;
  if (diff === 2) return 12;
  if (diff === 3) return 5;
  return 0;
}

// Factor: Late goals (min 76-90+) and OT goals (max 20)
function scoreLateGoals(goals: GoalEvent[]): number {
  const lateGoals = goals.filter((g) => {
    const min = g.minute;
    const period = g.period?.toLowerCase();
    return (period === '1' || period === 'first' || period === 'second' || period === '2')
      ? min >= 76
      : false;
  }).length;

  const otGoals = goals.filter((g) => {
    const period = g.period?.toLowerCase();
    return (
      period === 'ot' ||
      period === 'overtime' ||
      period === 'et' ||
      period === 'extra_time' ||
      period === '3' ||
      period === '4'
    );
  }).length;

  return Math.min(lateGoals * 6 + otGoals * 8, 20);
}

// Factor: Shots on goal (max 12)
function scoreShotsOnGoal(shots: number): number {
  if (shots <= 5) return 0;
  if (shots <= 8) return 4;
  if (shots <= 12) return 8;
  return 12;
}

// Factor: Red cards (max 10)
function scoreRedCards(cards: number): number {
  if (cards === 0) return 0;
  return Math.min(cards * 5 + 2, 10);
}

// Factor: Comeback (5 pts if winning team was losing at some point)
export function detectComeback(goals: GoalEvent[], homeTeamId: string, awayTeamId: string): boolean {
  let homeScore = 0;
  let awayScore = 0;
  let homeEverLosing = false;
  let awayEverLosing = false;

  const sorted = [...goals].sort((a, b) => a.minute - b.minute);

  for (const goal of sorted) {
    if (goal.teamId === homeTeamId) homeScore++;
    else if (goal.teamId === awayTeamId) awayScore++;

    if (homeScore < awayScore) homeEverLosing = true;
    if (awayScore < homeScore) awayEverLosing = true;
  }

  const finalDiff = homeScore - awayScore;
  if (finalDiff > 0 && homeEverLosing) return true; // home won after being behind
  if (finalDiff < 0 && awayEverLosing) return true; // away won after being behind
  if (finalDiff === 0 && (homeEverLosing || awayEverLosing)) return true; // drew after being behind

  return false;
}

export function computeExcitementScore(
  goals: GoalEvent[],
  shotsOnGoal: number,
  redCards: number,
  homeScore: number,
  awayScore: number,
  homeTeamId: string,
  awayTeamId: string
): ExcitementResult {
  const totalGoals = homeScore + awayScore;
  const goalDiff = homeScore - awayScore;

  const breakdown: ExcitementBreakdown = {
    goals: Math.round(scoreGoals(totalGoals) * 10) / 10,
    parity: scoreParity(goalDiff),
    lateGoals: Math.round(scoreLateGoals(goals) * 10) / 10,
    shotsOnGoal: scoreShotsOnGoal(shotsOnGoal),
    redCards: scoreRedCards(redCards),
    comeback: detectComeback(goals, homeTeamId, awayTeamId) ? 5 : 0,
  };

  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  const score = Math.round(Math.min(total, 100));

  return {
    score,
    grade: getGrade(score),
    breakdown,
  };
}

// Full pipeline: fetch nwsldata and compute score
export async function fetchExcitementScore(
  espnHomeId: string,
  espnAwayId: string,
  gameDate: string,
  homeScore: number,
  awayScore: number
): Promise<ExcitementResult | null> {
  const homeSlug = getTeamSlug(espnHomeId);
  const awaySlug = getTeamSlug(espnAwayId);

  if (!homeSlug || !awaySlug) return null;

  try {
    const gameId = await findGameId(homeSlug, awaySlug, gameDate.slice(0, 10));
    if (gameId === null) return null;

    const [goals, shotsOnGoal, redCards] = await Promise.all([
      getGoals(gameId),
      getShotsOnGoal(gameId),
      getRedCards(gameId),
    ]);

    const goalEvents: GoalEvent[] = goals.map((g) => ({
      minute: g.minute,
      teamId: g.team_id,
      period: g.period,
    }));

    return computeExcitementScore(
      goalEvents,
      shotsOnGoal,
      redCards,
      homeScore,
      awayScore,
      homeSlug,
      awaySlug
    );
  } catch (err) {
    console.error('Excitement score fetch failed:', err);
    return null;
  }
}
