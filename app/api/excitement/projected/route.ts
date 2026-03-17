import { NextRequest, NextResponse } from 'next/server';
import { computeProjectedExcitement } from '@/lib/excitement/projector';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const home = searchParams.get('home'); // ESPN home team ID
  const away = searchParams.get('away'); // ESPN away team ID

  if (!home || !away) {
    return NextResponse.json(
      { error: 'home and away ESPN team ID params required' },
      { status: 400 }
    );
  }

  try {
    const result = await computeProjectedExcitement(home, away);

    return NextResponse.json({ excitement: result }, {
      headers: {
        // Cache for 6 hours — team form doesn't shift that quickly
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    console.error('[api/excitement/projected]', err);
    return NextResponse.json({ error: 'Failed to compute projected score' }, { status: 500 });
  }
}
