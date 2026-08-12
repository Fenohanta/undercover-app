import { ref, set, get, push, onValue, off, update } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from './firebase';
import type { OnlineSession, OnlinePlayer, PlayerRole, WordHistoryEntry } from '../types/online';
import type { WordPair, Role } from '../types/game';
import { shuffleArray } from '../utils/gameLogic';

function generateSessionId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function ensureAuth(): Promise<string> {
  if (auth.currentUser) return auth.currentUser.uid;
  const { user } = await signInAnonymously(auth);
  return user.uid;
}

function toArray<T>(val: T[] | Record<string, T> | null | undefined): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return Object.values(val);
}

function normalizeSession(data: Record<string, unknown>): OnlineSession {
  const wordHistoryRaw = data.wordHistory as Record<string, WordHistoryEntry> | null;
  const wordHistory = toArray(wordHistoryRaw).sort((a, b) => a.timestamp - b.timestamp);

  const speakingOrderRaw = data.speakingOrder as string[] | Record<string, string> | null;
  const speakingOrder = toArray(speakingOrderRaw);

  return {
    id: data.id as string,
    hostId: data.hostId as string,
    phase: data.phase as OnlineSession['phase'],
    config: data.config as OnlineSession['config'],
    selectedWordPair: (data.selectedWordPair as WordPair | null) ?? null,
    currentRound: (data.currentRound as number) ?? 1,
    currentSpeakerIndex: (data.currentSpeakerIndex as number) ?? 0,
    speakingOrder,
    players: (data.players as Record<string, OnlinePlayer>) ?? {},
    playerRoles: (data.playerRoles as Record<string, PlayerRole>) ?? {},
    wordHistory,
    votes: (data.votes as Record<string, string>) ?? {},
    winner: (data.winner as OnlineSession['winner']) ?? null,
  };
}

export async function createSession(hostName: string): Promise<{ sessionId: string; uid: string }> {
  const uid = await ensureAuth();

  let sessionId: string;
  while (true) {
    sessionId = generateSessionId();
    const snap = await get(ref(db, `sessions/${sessionId}/id`));
    if (!snap.exists()) break;
  }

  const hostPlayer: OnlinePlayer = {
    id: uid,
    name: hostName.trim(),
    isHost: true,
    isEliminated: false,
    joinedAt: Date.now(),
  };

  await set(ref(db, `sessions/${sessionId}`), {
    id: sessionId,
    hostId: uid,
    phase: 'lobby',
    config: { undercoverCount: 1, hasMrWhite: false, unanimousVote: false },
    selectedWordPair: null,
    currentRound: 1,
    currentSpeakerIndex: 0,
    speakingOrder: [],
    players: { [uid]: hostPlayer },
    playerRoles: {},
    wordHistory: {},
    votes: {},
    winner: null,
  });

  return { sessionId, uid };
}

export async function joinSession(sessionId: string, playerName: string): Promise<string> {
  const uid = await ensureAuth();

  const snap = await get(ref(db, `sessions/${sessionId}`));
  if (!snap.exists()) throw new Error('Session introuvable. Vérifiez le code.');

  const data = snap.val();
  if (data.phase !== 'lobby') throw new Error('La partie a déjà commencé.');

  const existingPlayers = Object.values(data.players ?? {}) as OnlinePlayer[];
  if (existingPlayers.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase())) {
    throw new Error('Ce nom est déjà pris dans cette session.');
  }

  const player: OnlinePlayer = {
    id: uid,
    name: playerName.trim(),
    isHost: false,
    isEliminated: false,
    joinedAt: Date.now(),
  };

  await set(ref(db, `sessions/${sessionId}/players/${uid}`), player);
  return uid;
}

export function subscribeToSession(
  sessionId: string,
  callback: (session: OnlineSession | null) => void
): () => void {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const listener = onValue(sessionRef, snap => {
    callback(snap.exists() ? normalizeSession(snap.val()) : null);
  });
  return () => off(sessionRef, 'value', listener);
}

export async function updateSessionConfig(
  sessionId: string,
  config: { undercoverCount: number; hasMrWhite: boolean; unanimousVote: boolean }
): Promise<void> {
  await update(ref(db, `sessions/${sessionId}/config`), config);
}

export async function setWordPairForSession(sessionId: string, wordPair: WordPair): Promise<void> {
  await set(ref(db, `sessions/${sessionId}/selectedWordPair`), wordPair);
}

export async function startOnlineGame(sessionId: string): Promise<void> {
  const uid = await ensureAuth();
  const snap = await get(ref(db, `sessions/${sessionId}`));
  if (!snap.exists()) throw new Error('Session introuvable');

  const data = snap.val();
  if (data.hostId !== uid) throw new Error('Seul le host peut démarrer');
  if (!data.selectedWordPair) throw new Error('Aucun mot sélectionné');

  const players = Object.values(data.players ?? {}) as OnlinePlayer[];
  const wordPair = data.selectedWordPair as WordPair;
  const config = data.config as { undercoverCount: number; hasMrWhite: boolean };

  const shuffled = shuffleArray(players);
  const roles: Record<string, PlayerRole> = {};
  let idx = 0;

  if (config.hasMrWhite) {
    roles[shuffled[idx++].id] = { role: 'mrwhite' as Role, word: '' };
  }
  for (let i = 0; i < config.undercoverCount; i++) {
    roles[shuffled[idx++].id] = { role: 'undercover' as Role, word: wordPair.undercover };
  }
  while (idx < shuffled.length) {
    roles[shuffled[idx++].id] = { role: 'civil' as Role, word: wordPair.civil };
  }

  const speakingOrder = shuffleArray(players.map(p => p.id));

  await update(ref(db, `sessions/${sessionId}`), {
    playerRoles: roles,
    phase: 'playing',
    currentRound: 1,
    currentSpeakerIndex: 0,
    speakingOrder,
  });
}

export async function submitWord(sessionId: string, word: string): Promise<void> {
  const uid = await ensureAuth();
  const snap = await get(ref(db, `sessions/${sessionId}`));
  const data = snap.val();

  const player = (data.players as Record<string, OnlinePlayer>)?.[uid];
  const speakingOrder = toArray(data.speakingOrder as string[] | Record<string, string> | null);
  const nextIndex = (data.currentSpeakerIndex as number) + 1;
  const isRoundComplete = nextIndex >= speakingOrder.length;

  const activePlayers = Object.values(data.players as Record<string, OnlinePlayer>)
    .filter(p => !p.isEliminated);

  const entry: WordHistoryEntry = {
    playerId: uid,
    playerName: player?.name ?? uid,
    word: word.trim(),
    round: data.currentRound as number,
    timestamp: Date.now(),
  };

  const historyKey = `${Date.now()}_${uid.slice(0, 8)}`;
  const updates: Record<string, unknown> = {
    [`sessions/${sessionId}/wordHistory/${historyKey}`]: entry,
  };

  if (isRoundComplete) {
    const newOrder = shuffleArray(activePlayers.map(p => p.id));
    updates[`sessions/${sessionId}/currentRound`] = (data.currentRound as number) + 1;
    updates[`sessions/${sessionId}/currentSpeakerIndex`] = 0;
    updates[`sessions/${sessionId}/speakingOrder`] = newOrder;
  } else {
    updates[`sessions/${sessionId}/currentSpeakerIndex`] = nextIndex;
  }

  await update(ref(db), updates);
}

export async function startVoting(sessionId: string): Promise<void> {
  await set(ref(db, `sessions/${sessionId}/phase`), 'voting');
}

export async function castVote(sessionId: string, targetId: string): Promise<void> {
  const uid = await ensureAuth();
  await set(ref(db, `sessions/${sessionId}/votes/${uid}`), targetId);
}

export async function resolveVotes(sessionId: string): Promise<void> {
  const uid = await ensureAuth();
  const snap = await get(ref(db, `sessions/${sessionId}`));
  const data = snap.val();
  if (data.hostId !== uid) return;

  const votes = (data.votes as Record<string, string>) ?? {};
  const activePlayers = Object.values(data.players as Record<string, OnlinePlayer>)
    .filter(p => !p.isEliminated);
  const unanimousVote = (data.config as { unanimousVote: boolean })?.unanimousVote ?? false;

  // Unanimity mode: all active players must vote for the same person
  if (unanimousVote) {
    const uniqueTargets = new Set(Object.values(votes));
    const allVoted = Object.keys(votes).length === activePlayers.length;
    const isUnanimous = allVoted && uniqueTargets.size === 1;

    if (!isUnanimous) {
      // Not unanimous → undercovers win immediately
      await update(ref(db, `sessions/${sessionId}`), {
        phase: 'results',
        winner: 'undercovers',
        votes: {},
      });
      return;
    }
    // Unanimous → fall through with the single target as eliminated
  }

  const voteCounts: Record<string, number> = {};
  for (const targetId of Object.values(votes)) {
    voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1;
  }

  let maxVotes = 0;
  let eliminated: string | null = null;
  for (const [playerId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) { maxVotes = count; eliminated = playerId; }
  }

  if (!eliminated) {
    // Tie (majority mode) — no elimination, new round
    const newOrder = shuffleArray(activePlayers.map(p => p.id));
    await update(ref(db, `sessions/${sessionId}`), {
      votes: {},
      phase: 'playing',
      currentRound: (data.currentRound as number) + 1,
      currentSpeakerIndex: 0,
      speakingOrder: newOrder,
    });
    return;
  }

  const roles = (data.playerRoles as Record<string, PlayerRole>) ?? {};
  const eliminatedRole = roles[eliminated]?.role;

  const updatedActivePlayers = activePlayers.filter(p => p.id !== eliminated);
  const activeCivils = updatedActivePlayers.filter(p => roles[p.id]?.role === 'civil').length;
  const activeUndercovers = updatedActivePlayers.filter(p => roles[p.id]?.role === 'undercover').length;
  const activeMrWhite = updatedActivePlayers.filter(p => roles[p.id]?.role === 'mrwhite').length;

  let winner: string | null = null;
  let phase = 'playing';

  if (eliminatedRole === 'mrwhite') {
    phase = 'mrwhite-guess';
  } else if (activeUndercovers === 0 && activeMrWhite === 0) {
    winner = 'civils';
    phase = 'results';
  } else if (activeUndercovers >= activeCivils) {
    winner = 'undercovers';
    phase = 'results';
  }

  const newOrder = shuffleArray(updatedActivePlayers.map(p => p.id));
  const updates: Record<string, unknown> = {
    [`sessions/${sessionId}/players/${eliminated}/isEliminated`]: true,
    [`sessions/${sessionId}/votes`]: {},
    [`sessions/${sessionId}/phase`]: phase,
    [`sessions/${sessionId}/winner`]: winner,
  };

  if (phase === 'playing') {
    updates[`sessions/${sessionId}/currentRound`] = (data.currentRound as number) + 1;
    updates[`sessions/${sessionId}/currentSpeakerIndex`] = 0;
    updates[`sessions/${sessionId}/speakingOrder`] = newOrder;
  }

  await update(ref(db), updates);
}

export async function submitMrWhiteGuess(sessionId: string, guess: string): Promise<'win' | 'lose'> {
  const snap = await get(ref(db, `sessions/${sessionId}`));
  const data = snap.val();
  const wordPair = data.selectedWordPair as WordPair;
  const isCorrect = guess.trim().toLowerCase() === wordPair.civil.trim().toLowerCase();

  if (isCorrect) {
    await update(ref(db, `sessions/${sessionId}`), { phase: 'results', winner: 'mrwhite' });
    return 'win';
  }

  const roles = (data.playerRoles as Record<string, PlayerRole>) ?? {};
  const activePlayers = Object.values(data.players as Record<string, OnlinePlayer>)
    .filter(p => !p.isEliminated);
  const activeCivils = activePlayers.filter(p => roles[p.id]?.role === 'civil').length;
  const activeUndercovers = activePlayers.filter(p => roles[p.id]?.role === 'undercover').length;

  let phase = 'playing';
  let winner: string | null = null;

  if (activeUndercovers >= activeCivils) {
    winner = 'undercovers';
    phase = 'results';
  }

  const newOrder = shuffleArray(activePlayers.map(p => p.id));
  const updates: Record<string, unknown> = { [`sessions/${sessionId}/phase`]: phase, [`sessions/${sessionId}/winner`]: winner };
  if (phase === 'playing') {
    updates[`sessions/${sessionId}/currentRound`] = (data.currentRound as number) + 1;
    updates[`sessions/${sessionId}/currentSpeakerIndex`] = 0;
    updates[`sessions/${sessionId}/speakingOrder`] = newOrder;
  }

  await update(ref(db), updates);
  return 'lose';
}

export async function resetSession(sessionId: string): Promise<void> {
  const uid = await ensureAuth();
  const snap = await get(ref(db, `sessions/${sessionId}`));
  if (!snap.exists()) return;
  const data = snap.val();
  if (data.hostId !== uid) return;

  await update(ref(db, `sessions/${sessionId}`), {
    phase: 'lobby',
    playerRoles: {},
    wordHistory: {},
    votes: {},
    speakingOrder: [],
    currentRound: 1,
    currentSpeakerIndex: 0,
    winner: null,
    selectedWordPair: null,
  });
}

export async function addWordToPush(sessionId: string, word: string): Promise<void> {
  const uid = await ensureAuth();
  const snap = await get(ref(db, `sessions/${sessionId}/players/${uid}`));
  const player = snap.val() as OnlinePlayer;
  const roundSnap = await get(ref(db, `sessions/${sessionId}/currentRound`));

  const entry: WordHistoryEntry = {
    playerId: uid,
    playerName: player?.name ?? uid,
    word: word.trim(),
    round: roundSnap.val() as number,
    timestamp: Date.now(),
  };

  await push(ref(db, `sessions/${sessionId}/wordHistory`), entry);
}
