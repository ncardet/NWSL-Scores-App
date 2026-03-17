export type GameState = 'pre' | 'in' | 'post';

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
  color?: string;
}

export interface Broadcast {
  network: string;
  shortName: string;
}

export interface Score {
  home: number;
  away: number;
}

export interface Game {
  id: string;
  espnId: string;
  date: string; // ISO string
  homeTeam: Team;
  awayTeam: Team;
  venue?: string;
  city?: string;
  state: GameState;
  score?: Score;
  broadcasts: Broadcast[];
  excitement?: ExcitementResult | null;
  clock?: string;
  period?: string;
}

export interface ExcitementBreakdown {
  goals: number;
  parity: number;
  lateGoals: number;
  shotsOnGoal: number;
  redCards: number;
  comeback: number;
}

export interface ExcitementResult {
  score: number;
  grade: 'Great' | 'Good' | 'OK' | 'Dull';
  breakdown: ExcitementBreakdown;
}
