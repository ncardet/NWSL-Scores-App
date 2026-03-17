// Maps ESPN team IDs to nwsldata.com team slugs
// Used for excitement score lookups in historical data
export const espnTeamToNwslSlug: Record<string, string> = {
  // Established teams
  '5441': 'portland-thorns',
  '5442': 'seattle-reign',
  '5443': 'western-ny-flash', // no longer active, kept for history
  '5444': 'sky-blue-fc',
  '5445': 'boston-breakers', // original, defunct
  '5446': 'chicago-red-stars',
  '5447': 'houston-dash',
  '5448': 'fc-kansas-city',
  '5449': 'washington-spirit',
  '5450': 'orlando-pride',
  '5451': 'nc-courage',
  '5452': 'utah-royals',
  '5453': 'north-carolina-courage',
  '5454': 'racing-louisville',
  '5455': 'angel-city',
  '5456': 'kansas-city-current',
  '5457': 'san-diego-wave',
  '5458': 'portland-thorns', // ensure current ID
  '5459': 'seattle-reign',   // ensure current ID

  // Current 2025/2026 teams (ESPN IDs confirmed)
  '13609': 'washington-spirit',
  '13610': 'chicago-red-stars',
  '13612': 'houston-dash',
  '13613': 'portland-thorns',
  '13614': 'seattle-reign',
  '13615': 'nc-courage',
  '13616': 'orlando-pride',
  '13617': 'racing-louisville',
  '13618': 'angel-city',
  '13619': 'kansas-city-current',
  '13620': 'san-diego-wave',
  '13621': 'gotham-fc',
  '13622': 'utah-royals',
  '13624': 'chicago-red-stars',
  '14153': 'gotham-fc',
  '14154': 'racing-louisville',
  '14155': 'san-diego-wave',
  '14156': 'angel-city',
  '14157': 'kansas-city-current',

  // 2026 expansion teams (nwsldata slugs TBD once first events appear)
  '131562': 'boston-legacy',
  '131563': 'denver-summit',
};

// Fallback: try to guess slug from team name if not in map
export function getTeamSlug(espnId: string, teamName?: string): string | null {
  if (espnTeamToNwslSlug[espnId]) return espnTeamToNwslSlug[espnId];
  if (!teamName) return null;
  // Basic slug derivation from team name
  return teamName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
