import { NextRequest, NextResponse } from 'next/server';
import { fetchExcitementScore } from '@/lib/excitement/scorer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ espnId: string }> }
) {
  const { espnId } = await params;
  const { searchParams } = new URL(request.url);

  const home = searchParams.get('home');       // ESPN home team ID
  const away = searchParams.get('away');       // ESPN away team ID
  const date = searchParams.get('date');       // ISO date string
  const homeScore = searchParams.get('homeScore');
  const awayScore = searchParams.get('awayScore');

  if (!home || !away || !date || homeScore === null || awayScore === null) {
    return NextResponse.json(
      { error: 'home, away, date, homeScore, awayScore params required' },
      { status: 400 }
    );
  }

  try {
    const result = await fetchExcitementScore(
      home,
      away,
      date,
      Number(homeScore),
      Number(awayScore)
    );

    if (!result) {
      return NextResponse.json({ excitement: null }, {
        headers: { 'Cache-Control': 'public, s-maxage=3600' },
      });
    }

    return NextResponse.json({ excitement: result }, {
      headers: {
        // Excitement scores are immutable once computed
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    console.error('[api/excitement/[espnId]]', err);
    return NextResponse.json({ error: 'Failed to compute excitement score' }, { status: 500 });
  }
}
