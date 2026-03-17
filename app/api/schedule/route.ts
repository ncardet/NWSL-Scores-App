import { NextRequest, NextResponse } from 'next/server';
import { fetchGamesForRange } from '@/lib/espn/client';
import { parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  if (!startDateStr || !endDateStr) {
    return NextResponse.json(
      { error: 'startDate and endDate query params required (YYYY-MM-DD)' },
      { status: 400 }
    );
  }

  try {
    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);
    const games = await fetchGamesForRange(startDate, endDate);

    // Check if any games are live to advise the client on polling
    const hasLive = games.some((g) => g.state === 'in');

    return NextResponse.json({ games, hasLive }, {
      headers: {
        'Cache-Control': hasLive
          ? 'public, s-maxage=30, stale-while-revalidate=10'
          : 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    console.error('[api/schedule]', err);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}
