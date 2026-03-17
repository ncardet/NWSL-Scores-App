export interface GoalEvent {
  minute: number;
  teamId: string;
  period: string;
}

export interface ScoringState {
  homeScore: number;
  awayScore: number;
  homeTeamId: string;
  awayTeamId: string;
}
