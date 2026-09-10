'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [joinUrl, setJoinUrl] = useState('');
  const [qrReady, setQrReady] = useState(false);

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/play/MJ2-DEMO`);
    setQrReady(true);
  }, []);

  return (
    <main className="center page">
      <section className="card hero">
        <div className="eyebrow">MAYORA JAYANTI 2</div>
        <h1 className="title">AI OFFICE WORLD</h1>
        <p className="subtitle">Scan QR → masukkan nama → langsung masuk arena.</p>

        {qrReady ? (
          <div className="qrBox">
            <img src="/api/qr" alt="QR untuk join AI Office World" />
          </div>
        ) : (
          <div className="qrLoading">Menyiapkan QR...</div>
        )}

        <div className="joinUrl">{joinUrl || 'Alamat join akan muncul di sini'}</div>

        <div className="buttonRow">
          <a className="cta" href="/host">Buka Host</a>
          <a className="cta secondary" href="/arena/MJ2-DEMO">Buka TV Arena</a>
        </div>

        <p className="small info">
          Untuk jaringan lokal, buka halaman ini dari IP laptop, misalnya
          http://192.168.1.204:3000. QR otomatis mengikuti alamat tersebut.
        </p>
      </section>
    </main>
  );
}
