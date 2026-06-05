import type { GameConfig, Player, Role, WordPair } from '../types/game';
import { wordPairs } from '../data/wordPairs';

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function pickRandomWordPair(category?: string): WordPair {
  const pool = category
    ? wordPairs.filter(wp => wp.category === category)
    : wordPairs;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function assignRoles(config: GameConfig, wordPair: WordPair, playerNames: string[]): Player[] {
  const { playerCount, undercoverCount, hasMrWhite } = config;

  const roles: Role[] = [];
  for (let i = 0; i < undercoverCount; i++) roles.push('undercover');
  if (hasMrWhite) roles.push('mrwhite');
  const civilCount = playerCount - undercoverCount - (hasMrWhite ? 1 : 0);
  for (let i = 0; i < civilCount; i++) roles.push('civil');

  if (roles.length !== playerCount) {
    throw new Error(`Incohérence : ${roles.length} rôles pour ${playerCount} joueurs.`);
  }

  const shuffledRoles = shuffleArray(roles);

  return shuffledRoles.map((role, index) => ({
    id: index + 1,
    name: playerNames[index] || `Joueur ${index + 1}`,
    role,
    word: getWordForRole(role, wordPair),
    isEliminated: false,
    hasSeenWord: false,
  }));
}

function getWordForRole(role: Role, wordPair: WordPair): string {
  switch (role) {
    case 'civil':      return wordPair.civil;
    case 'undercover': return wordPair.undercover;
    case 'mrwhite':    return '';
    default: throw new Error(`Rôle inconnu : ${role}`);
  }
}

export function generateSpeakingOrder(players: Player[]): number[] {
  return shuffleArray(players.filter(p => !p.isEliminated).map(p => p.id));
}

export function checkWinCondition(
  players: Player[]
): 'civils' | 'undercovers' | 'mrwhite' | null {
  const active = players.filter(p => !p.isEliminated);
  const activeCivils = active.filter(p => p.role === 'civil').length;
  const activeUndercovers = active.filter(p => p.role === 'undercover').length;
  const activeMrWhite = active.filter(p => p.role === 'mrwhite').length;

  if (activeUndercovers === 0 && activeMrWhite === 0) return 'civils';
  if (activeUndercovers >= activeCivils) return 'undercovers';
  return null;
}

export function checkMrWhiteGuess(guess: string, civilWord: string): boolean {
  return guess.trim().toLowerCase() === civilWord.trim().toLowerCase();
}
