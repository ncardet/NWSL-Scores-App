import type { ExcitementResult, ExcitementBreakdown } from '../types';
import type { GoalEvent } from './types';
import { fetchMatchStats } from '../espn/summary';

// Grade thresholds
export function getGrade(score: number): ExcitementResult['grade'] {
  if (score >= 85) return 'Great';
  if (score >= 65) return 'Good';
  if (score >= 40) return 'OK';
  return 'Dull';
}

// Factor: Total goals (max 28)
export function scoreGoals(totalGoals: number): number {
  if (totalGoals === 0) return 0;
  return Math.min(totalGoals * 5.5 + 2.5, 28);
}

// Factor: Parity / score differential (max 25)
export function scoreParity(goalDiff: number): number {
  const diff = Math.abs(goalDiff);
  if (diff === 0) return 25;
  if (diff === 1) return 20;
  if (diff === 2) return 12;
  if (diff === 3) return 5;
  return 0;
}

// Continuous parity for projections (no hard steps)
export function scoreParityContinuous(expDiff: number): number {
  const d = Math.abs(expDiff);
  if (d <= 0) return 25;
  if (d >= 4) return 0;
  if (d <= 1) return 25 - d * 5;
  if (d <= 2) return 20 - (d - 1) * 8;
  if (d <= 3) return 12 - (d - 2) * 7;
  return 5 - (d - 3) * 5;
}

// Factor: Late goals (min 76-90+) and OT goals (max 20)
// period: 1=H1, 2=H2, 3+=OT  OR  'first'/'second'/'ot' strings
export function scoreLateGoals(goals: GoalEvent[]): number {
  const lateGoals = goals.filter((g) => {
    const p = String(g.period).toLowerCase();
    const isRegular = p === '1' || p === '2' || p === 'first' || p === 'second';
    return isRegular && g.minute >= 76;
  }).length;

  const otGoals = goals.filter((g) => {
    const p = String(g.period).toLowerCase();
    return p === 'ot' || p === 'overtime' || p === 'et' || Number(p) >= 3;
  }).length;

  return Math.min(lateGoals * 6 + otGoals * 8, 20);
}

// Factor: Shots on target combined (max 12)
export function scoreShotsOnTarget(shots: number): number {
  if (shots <= 5) return 0;
  if (shots <= 8) return 4;
  if (shots <= 12) return 8;
  return 12;
}

// Factor: Red cards (max 10)
export function scoreRedCards(cards: number): number {
  if (cards === 0) return 0;
  return Math.min(cards * 5 + 2, 10);
}

// Factor: Comeback (5 pts)
export function detectComeback(goals: GoalEvent[], homeTeamId: string, awayTeamId: string): boolean {
  let homeScore = 0;
  let awayScore = 0;
  let homeEverLosing = false;
  let awayEverLosing = false;

  const sorted = [...goals].sort((a, b) => a.minute - b.minute);

  for (const goal of sorted) {
    const tid = String(goal.teamId);
    if (tid === homeTeamId) homeScore++;
    else if (tid === awayTeamId) awayScore++;

    if (homeScore < awayScore) homeEverLosing = true;
    if (awayScore < homeScore) awayEverLosing = true;
  }

  const finalDiff = homeScore - awayScore;
  if (finalDiff > 0 && homeEverLosing) return true;
  if (finalDiff < 0 && awayEverLosing) return true;
  if (finalDiff === 0 && (homeEverLosing || awayEverLosing)) return true;
  return false;
}

export function computeExcitementScore(
  goals: GoalEvent[],
  shotsOnTarget: number,
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
    shotsOnGoal: scoreShotsOnTarget(shotsOnTarget),
    redCards: scoreRedCards(redCards),
    comeback: detectComeback(goals, homeTeamId, awayTeamId) ? 5 : 0,
  };

  const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
  const score = Math.round(Math.min(total, 100));

  return { score, grade: getGrade(score), breakdown };
}

// ESPN-only pipeline for completed games
export async function fetchExcitementFromESPN(espnId: string): Promise<ExcitementResult | null> {
  try {
    const stats = await fetchMatchStats(espnId);
    if (!stats) return null;

    const goalEvents: GoalEvent[] = stats.goals.map((g) => ({
      minute: g.minute,
      teamId: g.teamId,
      period: g.period,
    }));

    return computeExcitementScore(
      goalEvents,
      stats.shotsOnTarget,
      stats.redCards,
      stats.homeScore,
      stats.awayScore,
      stats.homeTeamId,
      stats.awayTeamId
    );
  } catch (err) {
    console.error('ESPN excitement fetch failed:', err);
    return null;
  }
}
