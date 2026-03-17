export interface EspnTeam {
  id: string;
  uid: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  logo: string;
  color?: string;
  alternateColor?: string;
}

export interface EspnCompetitor {
  id: string;
  uid: string;
  type: 'team';
  order: number; // 0 = home, 1 = away
  homeAway: 'home' | 'away';
  winner?: boolean;
  team: EspnTeam;
  score?: string; // ESPN returns score as a plain string e.g. "2"
}

export interface EspnGeoBroadcast {
  type: {
    id: string;
    shortName: string;
  };
  market: {
    id: string;
    type: string;
  };
  media: {
    shortName: string;
  };
  lang: string;
  region: string;
}

export interface EspnVenue {
  id: string;
  fullName: string;
  address?: {
    city: string;
    state?: string;
    country?: string;
  };
}

export interface EspnStatus {
  clock?: number;
  displayClock?: string;
  period?: number;
  type: {
    id: string;
    name: string;
    state: 'pre' | 'in' | 'post';
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
}

export interface EspnCompetition {
  id: string;
  uid: string;
  date: string;
  startDate: string;
  venue?: EspnVenue;
  competitors: EspnCompetitor[];
  status: EspnStatus;
  geoBroadcasts: EspnGeoBroadcast[];
  notes?: Array<{ type: string; headline: string }>;
}

export interface EspnEvent {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  competitions: EspnCompetition[];
  status: EspnStatus;
}

export interface EspnScoreboardResponse {
  events: EspnEvent[];
  leagues?: Array<{
    // calendar is an array of ISO date strings
    calendar?: string[];
  }>;
}
