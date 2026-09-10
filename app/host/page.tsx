'use client';

import { useEffect, useState } from 'react';

interface State {
  room: string;
  round: number;
  roundName: string;
  location: string;
  status: string;
  players: { id: string; name: string; avatar: string; score: number; level: number }[];
}

export default function Host() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    const response = await fetch('/api/room', { cache: 'no-store' });
    const result = await response.json();
    setState(result.data);
  };

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const action = async (name: 'start' | 'next') => {
    setError('');
    const response = await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: name }),
    });
    const result = await response.json();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setState(result.state);
  };

  const reset = async () => {
    await fetch('/api/room', { method: 'POST' });
    await load();
  };

  return (
    <main className="page">
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <div className="eyebrow">HOST CONTROL</div>
        <h1 className="joinTitle">AI OFFICE WORLD</h1>
        <p className="small">ROOM {state?.room ?? 'MJ2-DEMO'}</p>

        <div className="card" style={{ padding: 22, marginTop: 20 }}>
          <div className="buttonRow" style={{ justifyContent: 'flex-start' }}>
            <button className="cta" onClick={() => void action('start')}>▶ START ROUND</button>
            <button className="cta" onClick={() => void action('next')}>▶ NEXT ROUND</button>
            <button className="cta secondary" onClick={() => void reset()}>↻ RESET ROOM</button>
          </div>
          {error && <p className="error">{error}</p>}

          <div style={{ display: 'flex', gap: 30, marginTop: 22, flexWrap: 'wrap' }}>
            <div><div className="small">LOCATION</div><div className="location">{state?.location ?? 'LOBBY'}</div></div>
            <div><div className="small">ROUND</div><div className="location">{state?.round ?? 0} / 5</div></div>
            <div><div className="small">PLAYERS</div><div className="location">{state?.players.length ?? 0} / 6</div></div>
          </div>
        </div>

        <h2 style={{ marginTop: 28 }}>Players</h2>
        <div className="grid6">
          {state?.players.map((player) => (
            <div className="player" key={player.id}>
              <div className="avatar">{player.avatar}</div>
              <div className="playerName">{player.name}</div>
              <div className="small">LV {player.level} · {player.score} pts</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
