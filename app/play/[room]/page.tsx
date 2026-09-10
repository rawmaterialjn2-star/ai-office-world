'use client';

import { useEffect, useRef, useState } from 'react';

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  level: number;
  combo: number;
}

export default function Play({ params }: { params: Promise<{ room: string }> }) {
  const [room, setRoom] = useState('');
  const [name, setName] = useState('');
  const [player, setPlayer] = useState<Player | null>(null);
  const [error, setError] = useState('');
  const [camera, setCamera] = useState(false);
  const [mic, setMic] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;
    params.then((value) => {
      if (active) setRoom(value.room);
    });

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [params]);

  const join = async () => {
    setError('');
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Nama wajib diisi.');
      return;
    }

    try {
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, name: cleanName }),
        cache: 'no-store',
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error ?? 'Gagal join.');
      setPlayer(result.player as Player);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Gagal join.');
    }
  };

  const startCamera = async () => {
    setError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Browser ini tidak menyediakan akses camera.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamera(true);
    } catch (cameraError) {
      setError(cameraError instanceof Error ? cameraError.message : 'Camera tidak bisa diakses.');
    }
  };

  const startMic = async () => {
    setError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Browser ini tidak menyediakan akses microphone.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMic(true);
    } catch (micError) {
      setError(micError instanceof Error ? micError.message : 'Mic tidak bisa diakses.');
    }
  };

  if (!player) {
    return (
      <main className="center page">
        <section className="card playCard playWrap">
          <div className="eyebrow">MAYORA JAYANTI 2 · ROOM {room || '...'}</div>
          <h1 className="joinTitle">JOIN GAME</h1>
          <p className="small">Scan QR sudah membawa kamu langsung ke room.</p>
          <input
            className="input"
            placeholder="Nama kamu"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void join();
            }}
            maxLength={20}
            autoComplete="off"
          />
          <button className="cta full" onClick={() => void join()}>🚀 MASUK</button>
          {error && <p className="error">{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="center page">
      <section className="card playCard playWrap">
        <div className="eyebrow">PLAYER CONNECTED</div>
        <h1 className="joinTitle">{player.name}</h1>
        <div className="status"><span className="dot" /> CONNECTED</div>

        <div className="profileRow">
          <div className="avatar">{player.avatar}</div>
          <div>
            <strong>LV {player.level}</strong>
            <div className="small">Score {player.score} · Combo x{player.combo}</div>
          </div>
        </div>

        <button className="cta full" onClick={() => void startMic()}>
          {mic ? '🎤 MIC AKTIF' : '🎤 AKTIFKAN MIC'}
        </button>

        <video ref={videoRef} className="camera" muted playsInline />

        {camera ? (
          <div className="status"><span className="dot" /> CAMERA AKTIF</div>
        ) : (
          <button className="cta secondary full" onClick={() => void startCamera()}>
            📷 AKTIFKAN CAMERA
          </button>
        )}

        {error && <p className="error">{error}</p>}
        <div className="small info">Tunggu instruksi ASTRA di TV.</div>
      </section>
    </main>
  );
}
