export interface NwslGame {
  game_id: number;
  date: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  season: number;
  status?: string;
}

export interface NwslGoal {
  goal_id?: number;
  game_id: number;
  team_id: string;
  minute: number;
  period: string;
  player_name?: string;
  type?: string;
}

export interface NwslGameEvent {
  event_id?: number;
  game_id: number;
  type: string;
  minute: number;
  team_id?: string;
  player_name?: string;
}

export interface NwslShotCount {
  count: number;
}
