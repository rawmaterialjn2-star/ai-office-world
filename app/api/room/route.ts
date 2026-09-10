import { NextResponse } from 'next/server';
import { getState, resetState } from '@/lib/game-state';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { ok: true, data: getState() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST() {
  resetState();
  return NextResponse.json(
    { ok: true, data: getState() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
