export interface GoalEvent {
  minute: number;
  teamId: string;
  period: string | number; // string ('first','second','ot') or number (1,2,3+)
}

export interface ScoringState {
  homeScore: number;
  awayScore: number;
  homeTeamId: string;
  awayTeamId: string;
}
