import type { EspnEvent, EspnCompetition } from './types';
import type { Game, Team, Broadcast, Score } from '../types';
import { inferBroadcast } from '../broadcast/mapping';

function transformTeam(competitor: import('./types').EspnCompetitor): Team {
  return {
    id: competitor.team.id,
    name: competitor.team.displayName,
    abbreviation: competitor.team.abbreviation,
    logo: competitor.team.logo,
    color: competitor.team.color ? `#${competitor.team.color}` : undefined,
  };
}

function transformBroadcasts(competition: EspnCompetition, gameDate: string): Broadcast[] {
  const broadcasts = (competition.geoBroadcasts || []).map((b) => ({
    network: b.media.shortName,
    shortName: b.media.shortName,
  }));

  if (broadcasts.length === 0) {
    const fallback = inferBroadcast(gameDate);
    if (fallback) return [{ network: fallback, shortName: fallback }];
  }

  return broadcasts;
}

export function transformEvent(event: EspnEvent): Game | null {
  const competition = event.competitions?.[0];
  if (!competition) return null;

  const homeCompetitor = competition.competitors.find((c) => c.homeAway === 'home');
  const awayCompetitor = competition.competitors.find((c) => c.homeAway === 'away');

  if (!homeCompetitor || !awayCompetitor) return null;

  const state = competition.status.type.state;
  const gameDate = competition.date || event.date;

  let score: Score | undefined;
  if (state === 'in' || state === 'post') {
    const homeScore = homeCompetitor.score;
    const awayScore = awayCompetitor.score;
    if (homeScore !== undefined && awayScore !== undefined) {
      score = {
        home: Number(homeScore),
        away: Number(awayScore),
      };
    }
  }

  return {
    id: event.id,
    espnId: event.id,
    date: gameDate,
    homeTeam: transformTeam(homeCompetitor),
    awayTeam: transformTeam(awayCompetitor),
    venue: competition.venue?.fullName,
    city: competition.venue?.address
      ? [competition.venue.address.city, competition.venue.address.state]
          .filter(Boolean)
          .join(', ')
      : undefined,
    state,
    score,
    broadcasts: transformBroadcasts(competition, gameDate),
    clock: state === 'in' ? competition.status.displayClock : undefined,
    period: state === 'in' && competition.status.period
      ? String(competition.status.period)
      : undefined,
  };
}

export function transformEvents(events: EspnEvent[]): Game[] {
  return events.map(transformEvent).filter((g): g is Game => g !== null);
}
