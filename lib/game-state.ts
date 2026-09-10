export type Location = 'LOBBY' | 'WAREHOUSE' | 'PRODUCTION' | 'PACKING' | 'OFFICE';
export type RoundType = 'QUICK_ANSWER' | 'SOUND_BATTLE' | 'FORBIDDEN_WORD' | 'POSE' | 'CHAOS';

export type Player = {
  id: string;
  name: string;
  avatar: string;
  score: number;
  level: number;
  combo: number;
  micConnected: boolean;
  cameraConnected: boolean;
};

export type GameState = {
  room: string;
  location: Location;
  round: number;
  roundName: string;
  roundType: RoundType;
  status: 'waiting' | 'running' | 'finished';
  players: Player[];
  maxPlayers: number;
  question: string;
  countdown: number;
  createdAt: number;
};

type Round = [RoundType, string, string, Location];

const avatars = ['🧑‍💼', '👩‍💼', '🧑‍🔧', '👩‍🔬', '🧑‍💻', '👨‍💼'];

export const rounds: Round[] = [
  ['QUICK_ANSWER', 'AI QUICK ANSWER', 'Sebutkan benda di area kerja yang dimulai huruf M!', 'LOBBY'],
  ['SOUND_BATTLE', 'SOUND BATTLE', 'Tirukan suara forklift yang sedang mundur!', 'WAREHOUSE'],
  ['FORBIDDEN_WORD', 'JANGAN BILANG KATA ITU', 'Ceritakan suasana kerja tanpa menyebut kata KERJA, PRODUKSI, atau MESIN.', 'PRODUCTION'],
  ['POSE', 'AI GERAK CEPAT', 'ANGKAT TANGAN KANAN!', 'PACKING'],
  ['CHAOS', 'AI CHAOS', 'MAYORA = ANGKAT TANGAN · KOPIKO = TERIAK YES · ROMA = DIAM!', 'OFFICE'],
];

const globalState: GameState = {
  room: 'MJ2-DEMO',
  location: 'LOBBY',
  round: 0,
  roundName: 'LOBBY',
  roundType: 'QUICK_ANSWER',
  status: 'waiting',
  players: [],
  maxPlayers: 6,
  question: 'Scan QR untuk bergabung.',
  countdown: 0,
  createdAt: Date.now(),
};

export function getState(): GameState {
  return globalState;
}

export function resetState() {
  globalState.location = 'LOBBY';
  globalState.round = 0;
  globalState.roundName = 'LOBBY';
  globalState.roundType = 'QUICK_ANSWER';
  globalState.status = 'waiting';
  globalState.players = [];
  globalState.question = 'Scan QR untuk bergabung.';
  globalState.countdown = 0;
  globalState.createdAt = Date.now();
}

export function addPlayer(name: string): Player {
  if (globalState.status !== 'waiting') {
    throw new Error('Game sudah berjalan. Tunggu room berikutnya.');
  }
  if (globalState.players.length >= globalState.maxPlayers) {
    throw new Error('Room penuh. Maksimal 6 pemain aktif.');
  }

  const cleanName = name.trim().slice(0, 20);
  if (!cleanName) throw new Error('Nama wajib diisi.');
  if (globalState.players.some((player) => player.name.toLowerCase() === cleanName.toLowerCase())) {
    throw new Error('Nama sudah dipakai.');
  }

  const player: Player = {
    id: crypto.randomUUID(),
    name: cleanName,
    avatar: avatars[globalState.players.length % avatars.length],
    score: 0,
    level: 1,
    combo: 0,
    micConnected: false,
    cameraConnected: false,
  };

  globalState.players.push(player);
  return player;
}

export function startRound() {
  if (globalState.players.length === 0) throw new Error('Belum ada pemain.');
  if (globalState.round >= rounds.length) throw new Error('Semua ronde sudah selesai.');

  const index = globalState.round;
  const [type, name, question, location] = rounds[index];

  globalState.status = 'running';
  globalState.round = index + 1;
  globalState.roundType = type;
  globalState.roundName = name;
  globalState.question = question;
  globalState.countdown = type === 'POSE' ? 10 : type === 'CHAOS' ? 12 : 8;
  globalState.location = location;
}

export function nextRound() {
  if (globalState.round >= rounds.length) {
    globalState.status = 'finished';
    globalState.question = 'GAME OVER — ASTRA sedang menyiapkan hasil akhir.';
    globalState.countdown = 0;
    return;
  }
  startRound();
}
