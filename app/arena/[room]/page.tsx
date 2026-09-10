```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

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
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const lastSpokenKey = useRef('');
  const voiceEnabledRef = useRef(false);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  // ================================
  // LOAD GAME STATE
  // ================================
  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch('/api/room', {
          cache: 'no-store',
        });

        const result = await response.json();

        if (active && result.ok) {
          setState(result.data as GameState);
        }
      } catch {
        // Retry pada interval berikutnya.
      }
    };

    void params;
    void load();

    const interval = window.setInterval(() => {
      void load();
    }, 700);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [params]);

  // ================================
  // ASTRA VOICE
  // ================================
  const speakAstra = (text: string) => {
    if (!voiceEnabledRef.current) return;
    if (typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = 'id-ID';
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    utterance.onstart = () => {
      setSpeaking(true);
    };

    utterance.onend = () => {
      setSpeaking(false);
    };

    utterance.onerror = () => {
      setSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // ================================
  // AKTIFKAN SUARA ASTRA
  // ================================
  const enableAstraVoice = () => {
    voiceEnabledRef.current = true;
    setVoiceEnabled(true);

    // Unlock audio/browser speech setelah user interaction.
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const intro = new SpeechSynthesisUtterance(
        'Halo. Saya Astra, AI Game Master. Selamat datang di Mayora Jayanti 2. Permainan akan segera dimulai.'
      );

      intro.lang = 'id-ID';
      intro.rate = 0.92;
      intro.pitch = 1.05;
      intro.volume = 1;

      intro.onstart = () => setSpeaking(true);
      intro.onend = () => setSpeaking(false);
      intro.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(intro);
    }
  };

  // ================================
  // MATIKAN SUARA
  // ================================
  const disableAstraVoice = () => {
    voiceEnabledRef.current = false;
    setVoiceEnabled(false);
    setSpeaking(false);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // ================================
  // ASTRA OTOMATIS MEMBACA EVENT GAME
  // ================================
  useEffect(() => {
    if (!state) return;
    if (!voiceEnabledRef.current) return;

    const key = [
      state.round,
      state.roundName,
      state.status,
      state.question,
      state.countdown,
      state.location,
    ].join('|');

    if (key === lastSpokenKey.current) return;

    lastSpokenKey.current = key;

    // Waiting
    if (state.status === 'waiting') {
      speakAstra(
        `Selamat datang di ${state.location}. Silakan scan QR di TV untuk bergabung.`
      );
      return;
    }

    // Countdown
    if (state.countdown > 0) {
      if (state.countdown <= 3) {
        speakAstra(String(state.countdown));
      }
      return;
    }

    // Mulai round
    if (state.countdown === 0 && state.question) {
      speakAstra(
        `Round ${state.round}. ${state.roundName}. ${state.question}`
      );
    }
  }, [
    state?.round,
    state?.roundName,
    state?.status,
    state?.question,
    state?.countdown,
    state?.location,
  ]);

  if (!state) {
    return <main className="center">Loading...</main>;
  }

  return (
    <main className="arena">

      {/* ================================
          ASTRA VOICE CONTROL
      ================================= */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {voiceEnabled ? (
          <button
            onClick={disableAstraVoice}
            style={{
              border: 'none',
              borderRadius: 999,
              padding: '10px 16px',
              background: speaking ? '#16a34a' : '#111827',
              color: '#fff',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0,0,0,.18)',
            }}
          >
            {speaking ? '🔊 ASTRA BERBICARA' : '🔊 ASTRA AKTIF'}
          </button>
        ) : (
          <button
            onClick={enableAstraVoice}
            style={{
              border: 'none',
              borderRadius: 999,
              padding: '11px 18px',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0,0,0,.22)',
            }}
          >
            🔊 AKTIFKAN SUARA ASTRA
          </button>
        )}
      </div>

      {/* ================================
          TOP BAR
      ================================= */}
      <div className="arenaTop">
        <div>
          <div className="round">MAYORA JAYANTI 2</div>
          <div className="location">{state.location}</div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="round">
            ROUND {state.round}/5
          </div>

          <div style={{ fontWeight: 800 }}>
            {state.roundName}
          </div>
        </div>
      </div>

      {/* ================================
          GAME WORLD
      ================================= */}
      <div className="world">

        <div className="building" />
        <div className="worldFloor" />

        {/* PLAYERS */}
        <div className="playersArena">
          {state.players.map((player) => (
            <div
              className="arenaPlayer"
              key={player.id}
            >
              <div className="profileRow">

                <div className="avatar">
                  {player.avatar}
                </div>

                <div>
                  <strong>
                    {player.name}
                  </strong>

                  <div className="small">
                    LV {player.level} · {player.score} pts
                  </div>
                </div>

              </div>

              <div className="bar">
                <span
                  style={{
                    width: `${Math.min(
                      100,
                      10 + player.level * 15
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* LOCATION */}
        <div className="locationBanner">

          <p>
            {state.status === 'waiting'
              ? 'WELCOME TO'
              : 'CURRENT LOCATION'}
          </p>

          <h1>
            {state.location}
          </h1>

        </div>

        {/* ================================
            ASTRA GAME MASTER
        ================================= */}
        <div className="roundCard">

          <div
            className="ai"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span>
              🤖 ASTRA · AI GAME MASTER
            </span>

            {voiceEnabled && (
              <span
                style={{
                  fontSize: 13,
                  padding: '5px 9px',
                  borderRadius: 999,
                  background: speaking
                    ? 'rgba(34,197,94,.15)'
                    : 'rgba(37,99,235,.12)',
                }}
              >
                {speaking
                  ? '🔊 Speaking'
                  : '🎙️ Ready'}
              </span>
            )}
          </div>

          <div className="question">
            {state.question}
          </div>

          {state.status === 'waiting' ? (

            <div
              className="small"
              style={{ marginTop: 10 }}
            >
              SCAN QR DI TV UNTUK JOIN
            </div>

          ) : (

            <div
              style={{
                fontSize: 42,
                fontWeight: 800,
                marginTop: 8,
              }}
            >
              {state.countdown > 0
                ? state.countdown
                : 'GO!'}
            </div>

          )}

        </div>
      </div>
    </main>
  );
}
```
