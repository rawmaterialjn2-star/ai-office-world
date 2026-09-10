'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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

interface SpeechRecognitionEventLike extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;

  start: () => void;
  stop: () => void;
  abort: () => void;

  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export default function Arena({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const [state, setState] = useState<GameState | null>(null);

  // =========================
  // ASTRA VOICE
  // =========================

  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // =========================
  // MICROPHONE
  // =========================

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');

  // =========================
  // ASTRA RESPONSE
  // =========================

  const [astraReply, setAstraReply] = useState(
    'ASTRA siap mendengarkan jawabanmu...'
  );

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const lastQuestionRef = useRef('');
  const lastRoundRef = useRef(0);
  const lastStatusRef = useRef('');

  const restartTimerRef = useRef<number | null>(null);

  // =========================================================
  // GET INDONESIAN MALE VOICE
  // =========================================================

  const getAstraVoice = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const voices = window.speechSynthesis.getVoices();

    if (!voices.length) {
      return null;
    }

    // Prioritas utama:
    // voice Indonesia dengan nama yang biasanya terdengar maskulin.
    const maleIndonesianVoice = voices.find(
      (voice) =>
        voice.lang.toLowerCase().startsWith('id') &&
        /male|pria|andika|dimas|budi|indra|arif|joko|agus/i.test(
          voice.name
        )
    );

    if (maleIndonesianVoice) {
      return maleIndonesianVoice;
    }

    // Kalau tidak ada, ambil voice Indonesia.
    const indonesianVoice = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith('id')
    );

    if (indonesianVoice) {
      return indonesianVoice;
    }

    // Fallback voice bahasa Inggris.
    const englishVoice = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith('en')
    );

    return englishVoice || voices[0] || null;
  }, []);

  // =========================================================
  // SPEAK ASTRA
  // =========================================================

  const speakAstra = useCallback(
    (text: string) => {
      if (
        !voiceEnabled ||
        typeof window === 'undefined' ||
        !text.trim()
      ) {
        return;
      }

      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        const voice = getAstraVoice();

        if (voice) {
          utterance.voice = voice;
        }

        utterance.lang = 'id-ID';

        // Suara lebih berat dan santai
        utterance.rate = 0.88;
        utterance.pitch = 0.78;
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
      } catch (error) {
        console.error('ASTRA speech error:', error);
        setSpeaking(false);
      }
    },
    [getAstraVoice, voiceEnabled]
  );

  // =========================================================
  // ASTRA ROAST / RESPONSE
  // =========================================================

  const getRoast = useCallback((answer: string) => {
    const clean = answer.trim();

    if (!clean) {
      return 'Lho? ASTRA mendengar angin doang. Coba jawab, jangan cuma menatap monitor.';
    }

    const lower = clean.toLowerCase();

    // Coconut Oil
    if (
      lower.includes('coconut') ||
      lower.includes('cno') ||
      lower.includes('kelapa')
    ) {
      return `Jawabanmu "${clean}". Nah, ini baru ada isinya! ASTRA kasih respect. Jangan geer dulu, ronde berikutnya bisa lebih kejam.`;
    }

    // Palm Olein
    if (
      lower.includes('palm') ||
      lower.includes('olein') ||
      lower.includes('minyak')
    ) {
      return `ASTRA mendengar "${clean}". Lumayan! Otak warehouse mulai panas. Pertahankan, jangan sampai kalah sama printer.`;
    }

    // HFS
    if (
      lower.includes('hfs') ||
      lower.includes('fruktosa') ||
      lower.includes('fructose')
    ) {
      return `Ohhh HFS! ASTRA suka jawaban seperti ini. Ada yang mulai serius mainnya. Tapi jangan senang dulu.`;
    }

    // Glucose
    if (
      lower.includes('glucose') ||
      lower.includes('glukosa')
    ) {
      return `Glucose? Oke, otakmu ternyata masih mengandung glukosa. Jawaban diterima secara moral oleh ASTRA.`;
    }

    // Terlalu pendek
    if (clean.length < 4) {
      return `Cuma "${clean}"? ASTRA minta jawaban, bukan password WiFi. Coba lagi!`;
    }

    // Terlalu panjang
    if (clean.length > 100) {
      return `ASTRA mendengar ceramah sepanjang "${clean.slice(
        0,
        50
      )}..." Santai. Ini game, bukan meeting KPI tiga jam.`;
    }

    // Jawaban biasa
    return `ASTRA mendengar: "${clean}". Hmm... menarik. Jawabanmu dicatat. Jangan senang dulu, ASTRA belum selesai menguji kamu.`;
  }, []);

  // =========================================================
  // START MICROPHONE
  // =========================================================

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!voiceEnabled) {
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setVoiceError(
        'Browser ini belum mendukung Speech Recognition. Gunakan Google Chrome.'
      );

      return;
    }

    try {
      // Hentikan recognition lama
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognitionAPI();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'id-ID';

      // =========================
      // START
      // =========================

      recognition.onstart = () => {
        setListening(true);
        setVoiceError('');
      };

      // =========================
      // RESULT
      // =========================

      recognition.onresult = (event) => {
        let finalText = '';
        let interimText = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];

          if (result.isFinal) {
            finalText += result[0].transcript + ' ';
          } else {
            interimText += result[0].transcript;
          }
        }

        if (finalText.trim()) {
          const cleanFinalText = finalText.trim();

          setTranscript((previous) => {
            const combined = `${previous} ${cleanFinalText}`.trim();

            return combined;
          });

          const reply = getRoast(cleanFinalText);

          setAstraReply(reply);

          // ASTRA jawab setelah suara masuk.
          window.setTimeout(() => {
            speakAstra(reply);
          }, 300);
        }

        setInterimTranscript(interimText);
      };

      // =========================
      // ERROR
      // =========================

      recognition.onerror = (event) => {
        console.log(
          'Speech recognition error:',
          event.error
        );

        if (event.error === 'not-allowed') {
          setVoiceError(
            'Microphone ditolak. Izinkan akses microphone di browser.'
          );

          setListening(false);

          return;
        }

        if (event.error === 'audio-capture') {
          setVoiceError(
            'Microphone tidak ditemukan. Periksa microphone perangkat.'
          );

          setListening(false);

          return;
        }

        if (event.error !== 'no-speech') {
          setVoiceError(
            `Microphone: ${event.error}`
          );
        }

        setListening(false);
      };

      // =========================
      // END
      // =========================

      recognition.onend = () => {
        setListening(false);

        // Jangan restart kalau voice dimatikan.
        if (!voiceEnabled) {
          return;
        }

        // Jangan restart ketika game sedang waiting.
        if (!state || state.status === 'waiting') {
          return;
        }

        // Hindari restart terlalu cepat.
        if (restartTimerRef.current) {
          window.clearTimeout(
            restartTimerRef.current
          );
        }

        restartTimerRef.current =
          window.setTimeout(() => {
            try {
              recognition.start();
            } catch {
              // Browser mungkin sedang menjalankan recognition.
            }
          }, 700);
      };

      recognitionRef.current = recognition;

      recognition.start();
    } catch (error) {
      console.error(
        'Microphone start error:',
        error
      );

      setVoiceError(
        'Microphone belum bisa dimulai.'
      );

      setListening(false);
    }
  }, [
    getRoast,
    speakAstra,
    state,
    voiceEnabled,
  ]);

  // =========================================================
  // STOP MICROPHONE
  // =========================================================

  const stopListening = useCallback(() => {
    if (restartTimerRef.current) {
      window.clearTimeout(
        restartTimerRef.current
      );

      restartTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    setListening(false);
  }, []);

  // =========================================================
  // ENABLE ASTRA
  // =========================================================

  const enableAstraVoice = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setVoiceEnabled(true);
    setVoiceError('');

    // Pastikan browser sudah load daftar voice.
    const speakIntro = () => {
      window.speechSynthesis.cancel();

      const intro =
        'Halo! Saya ASTRA, AI Game Master. Saya akan membacakan pertanyaan, mendengarkan jawaban kalian, dan mengomentari jawaban kalian. Siapkan suara kalian. Jangan tegang. Saya cuma AI... yang sedikit nyebelin.';

      const utterance =
        new SpeechSynthesisUtterance(intro);

      const voice = getAstraVoice();

      if (voice) {
        utterance.voice = voice;
      }

      utterance.lang = 'id-ID';

      // Intro dibuat sedikit santai
      utterance.rate = 0.9;
      utterance.pitch = 0.78;
      utterance.volume = 1;

      utterance.onstart = () => {
        setSpeaking(true);
      };

      utterance.onend = () => {
        setSpeaking(false);

        if (
          state &&
          state.status !== 'waiting'
        ) {
          startListening();
        }
      };

      utterance.onerror = () => {
        setSpeaking(false);
      };

      window.speechSynthesis.speak(
        utterance
      );
    };

    // Beberapa browser baru mengisi voices
    // setelah event voiceschanged.
    const voices =
      window.speechSynthesis.getVoices();

    if (voices.length > 0) {
      speakIntro();
    } else {
      window.speechSynthesis.onvoiceschanged =
        () => {
          speakIntro();
        };
    }
  }, [
    getAstraVoice,
    startListening,
    state,
  ]);

  // =========================================================
  // DISABLE ASTRA
  // =========================================================

  const disableAstraVoice = useCallback(() => {
    setVoiceEnabled(false);
    setSpeaking(false);

    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }

    stopListening();
  }, [stopListening]);

  // =========================================================
  // LOAD GAME STATE
  // =========================================================

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch(
          '/api/room',
          {
            cache: 'no-store',
          }
        );

        const result =
          await response.json();

        if (active && result.ok) {
          setState(
            result.data as GameState
          );
        }
      } catch {
        // Retry berikutnya.
      }
    };

    void params;
    void load();

    const interval =
      window.setInterval(() => {
        void load();
      }, 700);

    return () => {
      active = false;

      window.clearInterval(
        interval
      );
    };
  }, [params]);

  // =========================================================
  // READ QUESTION WHEN ROUND CHANGES
  // =========================================================

  useEffect(() => {
    if (!state || !voiceEnabled) {
      return;
    }

    const questionChanged =
      state.question !==
      lastQuestionRef.current;

    const roundChanged =
      state.round !==
      lastRoundRef.current;

    const statusChanged =
      state.status !==
      lastStatusRef.current;

    if (
      state.status !== 'waiting' &&
      (
        questionChanged ||
        roundChanged ||
        statusChanged
      )
    ) {
      lastQuestionRef.current =
        state.question;

      lastRoundRef.current =
        state.round;

      lastStatusRef.current =
        state.status;

      stopListening();

      const text =
        `Ronde ${state.round}. ${state.roundName}. Pertanyaannya adalah: ${state.question}`;

      setAstraReply(
        'ASTRA sedang membacakan pertanyaan...'
      );

      window.setTimeout(() => {
        speakAstra(text);

        // Tunggu ASTRA selesai bicara
        // lalu mulai mendengarkan.
        window.setTimeout(() => {
          startListening();
        }, 1800);
      }, 300);
    }
  }, [
    state,
    voiceEnabled,
    speakAstra,
    startListening,
    stopListening,
  ]);

  // =========================================================
  // WAITING SCREEN VOICE
  // =========================================================

  useEffect(() => {
    if (!state || !voiceEnabled) {
      return;
    }

    if (state.status === 'waiting') {
      const text =
        `Selamat datang di ${state.location}. Silakan scan QR di TV untuk bergabung.`;

      if (
        lastStatusRef.current !==
        'waiting'
      ) {
        lastStatusRef.current =
          'waiting';

        speakAstra(text);
      }
    }
  }, [
    state,
    voiceEnabled,
    speakAstra,
  ]);

  // =========================================================
  // CLEANUP
  // =========================================================

  useEffect(() => {
    return () => {
      if (
        typeof window !==
        'undefined'
      ) {
        window.speechSynthesis.cancel();
      }

      if (
        restartTimerRef.current
      ) {
        window.clearTimeout(
          restartTimerRef.current
        );
      }

      if (
        recognitionRef.current
      ) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // =========================================================
  // LOADING
  // =========================================================

  if (!state) {
    return (
      <main className="center">
        Loading...
      </main>
    );
  }

  // =========================================================
  // TRANSCRIPT DISPLAY
  // =========================================================

  const displayTranscript =
    transcript ||
    interimTranscript
      ? `${transcript}${
          interimTranscript
            ? ` ${interimTranscript}`
            : ''
        }`
      : 'Belum ada suara yang terdeteksi...';

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="arena">
      {/* ================================================= */}
      {/* TOP BAR */}
      {/* ================================================= */}

      <div className="arenaTop">
        <div>
          <div className="round">
            MAYORA JAYANTI 2
          </div>

          <div className="location">
            {state.location}
          </div>
        </div>

        <div
          style={{
            textAlign: 'right',
          }}
        >
          <div className="round">
            ROUND {state.round}/5
          </div>

          <div
            style={{
              fontWeight: 800,
            }}
          >
            {state.roundName}
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* WORLD */}
      {/* ================================================= */}

      <div className="world">
        <div className="building" />

        <div className="worldFloor" />

        {/* ================================================= */}
        {/* PLAYERS */}
        {/* ================================================= */}

        <div className="playersArena">
          {state.players.map(
            (player) => (
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
                      LV {player.level} ·{' '}
                      {player.score} pts
                    </div>
                  </div>
                </div>

                <div className="bar">
                  <span
                    style={{
                      width: `${Math.min(
                        100,
                        10 +
                          player.level *
                            15
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )
          )}
        </div>

        {/* ================================================= */}
        {/* LOCATION */}
        {/* ================================================= */}

        <div className="locationBanner">
          <p>
            {state.status ===
            'waiting'
              ? 'WELCOME TO'
              : 'CURRENT LOCATION'}
          </p>

          <h1>
            {state.location}
          </h1>
        </div>

        {/* ================================================= */}
        {/* ROUND CARD */}
        {/* ================================================= */}

        <div
          className="roundCard"
          style={{
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* ================================================= */}
          {/* ASTRA HEADER */}
          {/* ================================================= */}

          <div
            className="ai"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
              gap: 12,
            }}
          >
            <span>
              🤖 ASTRA · AI GAME MASTER
            </span>

            <span
              style={{
                fontSize: 12,
                padding:
                  '6px 10px',
                borderRadius: 999,
                background:
                  speaking
                    ? '#7c3aed'
                    : listening
                    ? '#16a34a'
                    : '#334155',
                color: 'white',
                fontWeight: 800,
              }}
            >
              {speaking
                ? '🔊 ASTRA BICARA'
                : listening
                ? '🎤 MENDENGARKAN'
                : '⏸ SIAP'}
            </span>
          </div>

          {/* ================================================= */}
          {/* QUESTION */}
          {/* ================================================= */}

          <div className="question">
            {state.question}
          </div>

          {/* ================================================= */}
          {/* WAITING */}
          {/* ================================================= */}

          {state.status ===
          'waiting' ? (
            <>
              <div
                className="small"
                style={{
                  marginTop: 10,
                }}
              >
                SCAN QR DI TV UNTUK JOIN
              </div>

              {!voiceEnabled ? (
                <button
                  onClick={
                    enableAstraVoice
                  }
                  style={{
                    marginTop: 18,
                    padding:
                      '12px 18px',
                    border: 0,
                    borderRadius: 12,
                    background:
                      '#16a34a',
                    color: 'white',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  🔊 AKTIFKAN SUARA ASTRA
                </button>
              ) : (
                <button
                  onClick={
                    disableAstraVoice
                  }
                  style={{
                    marginTop: 18,
                    padding:
                      '10px 15px',
                    border: 0,
                    borderRadius: 12,
                    background:
                      '#334155',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🔇 MATIKAN SUARA
                </button>
              )}
            </>
          ) : (
            <>
              {/* ================================================= */}
              {/* COUNTDOWN */}
              {/* ================================================= */}

              <div
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  marginTop: 8,
                }}
              >
                {state.countdown >
                0
                  ? state.countdown
                  : 'GO!'}
              </div>

              {/* ================================================= */}
              {/* MICROPHONE MONITOR */}
              {/* ================================================= */}

              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  borderRadius: 16,
                  background:
                    'rgba(15, 23, 42, 0.9)',
                  border: listening
                    ? '2px solid #22c55e'
                    : '2px solid rgba(255,255,255,.12)',
                }}
              >
                {/* HEADER */}

                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                    marginBottom: 10,
                  }}
                >
                  <strong>
                    {listening
                      ? '🎤 SUARA MASUK'
                      : '🎤 MICROPHONE'}
                  </strong>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color:
                        listening
                          ? '#4ade80'
                          : '#94a3b8',
                    }}
                  >
                    {listening
                      ? 'LIVE'
                      : 'MENUNGGU'}
                  </span>
                </div>

                {/* ================================================= */}
                {/* VOICE VISUALIZER */}
                {/* ================================================= */}

                <div
                  style={{
                    height: 42,
                    display:
                      'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    gap: 4,
                    overflow:
                      'hidden',
                    marginBottom:
                      12,
                  }}
                >
                  {Array.from({
                    length: 28,
                  }).map(
                    (_, index) => (
                      <span
                        key={index}
                        style={{
                          width: 4,
                          height:
                            listening
                              ? `${
                                  12 +
                                  ((index *
                                    17) %
                                    28)
                                }px`
                              : '5px',
                          borderRadius:
                            999,
                          background:
                            listening
                              ? '#22c55e'
                              : '#475569',
                          transition:
                            'height .2s ease',
                        }}
                      />
                    )
                  )}
                </div>

                {/* ================================================= */}
                {/* TRANSCRIPT */}
                {/* ================================================= */}

                <div
                  style={{
                    fontSize: 14,
                    lineHeight:
                      1.5,
                    minHeight: 44,
                    color:
                      '#e2e8f0',
                  }}
                >
                  {displayTranscript}
                </div>

                {/* ================================================= */}
                {/* ERROR */}
                {/* ================================================= */}

                {voiceError && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 10,
                      background:
                        'rgba(239,68,68,.15)',
                      color:
                        '#fca5a5',
                      fontSize: 13,
                    }}
                  >
                    ⚠️ {voiceError}
                  </div>
                )}
              </div>

              {/* ================================================= */}
              {/* ASTRA RESPONSE */}
              {/* ================================================= */}

              <div
                style={{
                  marginTop: 12,
                  padding: 14,
                  borderRadius: 14,
                  background:
                    'rgba(124,58,237,.16)',
                  border:
                    '1px solid rgba(167,139,250,.3)',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    marginBottom: 6,
                  }}
                >
                  🤖 ASTRA
                </div>

                <div
                  style={{
                    fontSize: 14,
                    lineHeight:
                      1.5,
                  }}
                >
                  {astraReply}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
