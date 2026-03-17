import { NextRequest, NextResponse } from 'next/server';
import { fetchExcitementFromESPN } from '@/lib/excitement/scorer';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ espnId: string }> }
) {
  const { espnId } = await params;

  try {
    const result = await fetchExcitementFromESPN(espnId);

    return NextResponse.json({ excitement: result }, {
      headers: {
        // Completed game stats are immutable
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    console.error('[api/excitement/[espnId]]', err);
    return NextResponse.json({ error: 'Failed to compute excitement score' }, { status: 500 });
  }
}
