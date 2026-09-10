import { NextResponse } from 'next/server';
import { addPlayer, getState } from '@/lib/game-state';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: unknown; room?: unknown };
    const room = String(body.room ?? '');
    if (room && room !== getState().room) {
      throw new Error('Room tidak ditemukan atau sudah berubah.');
    }

    const player = addPlayer(String(body.name ?? ''));
    return NextResponse.json({ ok: true, player, state: getState() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Gagal join.' },
      { status: 400 },
    );
  }
}
