import { format } from 'date-fns';
import type { EspnScoreboardResponse, EspnEvent } from './types';
import { transformEvents } from './transform';
import type { Game } from '../types';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.nwsl/scoreboard';

export async function fetchSeasonCalendar(): Promise<string[]> {
  const res = await fetch(`${ESPN_BASE}?dates=20260301`, {
    next: { revalidate: 86400 },
  });

  if (!res.ok) throw new Error(`ESPN calendar fetch failed: ${res.status}`);

  const data = await res.json();
  // calendar is an array of ISO date strings e.g. "2026-03-13T07:00Z"
  const calendar: string[] = data.leagues?.[0]?.calendar ?? [];

  const dates = calendar.map((d: string) => d.slice(0, 10));
  return [...new Set(dates)].sort();
}

export async function fetchGamesForRange(
  startDate: Date,
  endDate: Date,
  revalidate = 300
): Promise<Game[]> {
  const start = format(startDate, 'yyyyMMdd');
  const end = format(endDate, 'yyyyMMdd');

  // ESPN accepts date ranges; chunk if > 21 days to be safe
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff > 21) {
    return fetchGamesInChunks(startDate, endDate, revalidate);
  }

  const url = start === end ? `${ESPN_BASE}?dates=${start}` : `${ESPN_BASE}?dates=${start}-${end}`;

  const res = await fetch(url, {
    next: { revalidate },
  });

  if (!res.ok) throw new Error(`ESPN schedule fetch failed: ${res.status}`);

  const data: EspnScoreboardResponse = await res.json();
  return transformEvents(data.events ?? []);
}

async function fetchGamesInChunks(
  startDate: Date,
  endDate: Date,
  revalidate: number
): Promise<Game[]> {
  const chunks: Array<[Date, Date]> = [];
  let current = new Date(startDate);

  while (current < endDate) {
    const chunkEnd = new Date(current);
    chunkEnd.setDate(chunkEnd.getDate() + 20);
    if (chunkEnd > endDate) chunkEnd.setTime(endDate.getTime());
    chunks.push([new Date(current), new Date(chunkEnd)]);
    current.setDate(current.getDate() + 21);
  }

  const results = await Promise.all(
    chunks.map(([start, end]) => fetchGamesForRange(start, end, revalidate))
  );

  // Deduplicate by game ID
  const seen = new Set<string>();
  const games: Game[] = [];
  for (const chunk of results) {
    for (const game of chunk) {
      if (!seen.has(game.id)) {
        seen.add(game.id);
        games.push(game);
      }
    }
  }

  return games.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function fetchGameById(espnId: string): Promise<Game | null> {
  const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/usa.nwsl/summary?event=${espnId}`;
  const res = await fetch(summaryUrl, { next: { revalidate: 60 } });

  if (!res.ok) return null;

  const data = await res.json();
  const header = data.header;
  if (!header?.competitions?.[0]) return null;

  const comp = header.competitions[0];

  // The summary endpoint uses a top-level `broadcasts` array with different structure
  // Normalize it to geoBroadcasts format expected by transform
  const rawBroadcasts: Array<{ media?: { shortName?: string } }> = data.broadcasts ?? [];
  comp.geoBroadcasts = rawBroadcasts
    .filter((b) => b.media?.shortName)
    .map((b) => ({ media: { shortName: b.media!.shortName! } }));

  // Venue is in gameInfo for the summary endpoint
  if (!comp.venue && data.gameInfo?.venue) {
    comp.venue = data.gameInfo.venue;
  }

  const event: EspnEvent = {
    id: espnId,
    uid: espnId,
    date: comp.date,
    name: comp.competitors?.map((c: { team: { displayName: string } }) => c.team?.displayName).join(' vs ') ?? '',
    shortName: '',
    competitions: [comp],
    status: comp.status,
  };

  const games = transformEvents([event]);
  return games[0] ?? null;
}
