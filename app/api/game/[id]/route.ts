import { NextRequest, NextResponse } from 'next/server';
import { fetchGameById } from '@/lib/espn/client';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const game = await fetchGameById(id);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    return NextResponse.json({ game });
  } catch (err) {
    console.error('[api/game/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
  }
}
