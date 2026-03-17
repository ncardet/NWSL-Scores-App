export interface EspnGoalEvent {
  minute: number;
  period: number; // 1=H1, 2=H2, 3+=OT
  teamId: string;
  scorerName?: string;
}

export interface EspnMatchStats {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  goals: EspnGoalEvent[];
  shotsOnTarget: number; // combined both teams
  redCards: number;       // combined both teams
}

// Parse "76'", "45'+4'", "90'+5'" → integer minute
function parseMinute(display: string): number {
  const m = display.replace(/'/g, '').match(/^(\d+)(?:\+(\d+))?$/);
  if (!m) return 0;
  return parseInt(m[1]) + (m[2] ? parseInt(m[2]) : 0);
}

const GOAL_TYPES = new Set(['goal', 'goal---header', 'goal---penalty', 'goal---own-goal']);

export async function fetchMatchStats(espnId: string): Promise<EspnMatchStats | null> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/usa.nwsl/summary?event=${espnId}`;
  const res = await fetch(url, {
    next: { revalidate: false }, // completed games are immutable
  });
  if (!res.ok) return null;

  const data = await res.json();
  const comp = data.header?.competitions?.[0];
  if (!comp) return null;

  const homeComp = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === 'home');
  const awayComp = comp.competitors?.find((c: { homeAway: string }) => c.homeAway === 'away');
  if (!homeComp || !awayComp) return null;

  const homeTeamId: string = homeComp.team.id;
  const awayTeamId: string = awayComp.team.id;
  const homeScore = Number(homeComp.score?.value ?? homeComp.score ?? 0);
  const awayScore = Number(awayComp.score?.value ?? awayComp.score ?? 0);

  // Parse goals and red cards from keyEvents
  const keyEvents: Array<{
    type: { type: string };
    clock?: { displayValue: string };
    period?: { number: number };
    team?: { id: string };
    text?: string;
  }> = data.keyEvents ?? [];

  const goals: EspnGoalEvent[] = [];
  let redCards = 0;

  for (const event of keyEvents) {
    const type = event.type?.type ?? '';
    const teamId = event.team?.id;
    const period = event.period?.number ?? 1;
    const display = event.clock?.displayValue ?? '';

    if (GOAL_TYPES.has(type) && teamId) {
      const minute = parseMinute(display);
      if (minute > 0) {
        // Extract scorer name from text like "Goal! Team 1, Team 0. Player Name ..."
        const scorerMatch = event.text?.match(/\.\s+([^(]+)\s+\(/);
        goals.push({
          minute,
          period,
          teamId,
          scorerName: scorerMatch?.[1]?.trim(),
        });
      }
    }

    if (type === 'red-card') {
      redCards++;
    }
  }

  // Sum shots on target from both teams' boxscore stats
  const boxscoreTeams: Array<{
    statistics?: Array<{ name: string; displayValue: string }>;
  }> = data.boxscore?.teams ?? [];

  let shotsOnTarget = 0;
  for (const t of boxscoreTeams) {
    for (const s of t.statistics ?? []) {
      if (s.name === 'shotsOnTarget') {
        shotsOnTarget += parseInt(s.displayValue) || 0;
      }
    }
  }

  return { homeTeamId, awayTeamId, homeScore, awayScore, goals, shotsOnTarget, redCards };
}
