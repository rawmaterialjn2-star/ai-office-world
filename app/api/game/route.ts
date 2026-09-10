import { NextResponse } from 'next/server';
import { getState, nextRound, startRound } from '@/lib/game-state';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { action?: unknown };
    const action = String(body.action ?? '');

    if (action === 'start') startRound();
    else if (action === 'next') nextRound();
    else throw new Error('Action tidak dikenali.');

    return NextResponse.json({ ok: true, state: getState() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal menjalankan game.' },
      { status: 400 },
    );
  }
}
