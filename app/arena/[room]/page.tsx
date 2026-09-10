'use client';

import { useEffect, useState } from 'react';

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  level: number;
}

interface GameState {
  room: string;
  location: string;
  round: number;
  roundName: string;
  status: string;
  players: Player[];
  question: string;
  countdown: number;
}

export default function Arena({ params }: { params: Promise<{ room: string }> }) {
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch('/api/room', { cache: 'no-store' });
        const result = await response.json();
        if (active && result.ok) setState(result.data as GameState);
      } catch {
        // Retry on next interval.
      }
    };

    void params;
    void load();
    const interval = window.setInterval(() => void load(), 700);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [params]);

  if (!state) return <main className="center">Loading...</main>;

  return (
    <main className="arena">
      <div className="arenaTop">
        <div>
          <div className="round">MAYORA JAYANTI 2</div>
          <div className="location">{state.location}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="round">ROUND {state.round}/5</div>
          <div style={{ fontWeight: 800 }}>{state.roundName}</div>
        </div>
      </div>

      <div className="world">
        <div className="building" />
        <div className="worldFloor" />

        <div className="playersArena">
          {state.players.map((player) => (
            <div className="arenaPlayer" key={player.id}>
              <div className="profileRow">
                <div className="avatar">{player.avatar}</div>
                <div>
                  <strong>{player.name}</strong>
                  <div className="small">LV {player.level} · {player.score} pts</div>
                </div>
              </div>
              <div className="bar">
                <span style={{ width: `${Math.min(100, 10 + player.level * 15)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="locationBanner">
          <p>{state.status === 'waiting' ? 'WELCOME TO' : 'CURRENT LOCATION'}</p>
          <h1>{state.location}</h1>
        </div>

        <div className="roundCard">
          <div className="ai">🤖 ASTRA · AI GAME MASTER</div>
          <div className="question">{state.question}</div>
          {state.status === 'waiting' ? (
            <div className="small" style={{ marginTop: 10 }}>SCAN QR DI TV UNTUK JOIN</div>
          ) : (
            <div style={{ fontSize: 42, fontWeight: 800, marginTop: 8 }}>
              {state.countdown > 0 ? state.countdown : 'GO!'}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
