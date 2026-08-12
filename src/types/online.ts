import type { Role, WordPair } from './game';

export interface OnlinePlayer {
  id: string;
  name: string;
  isHost: boolean;
  isEliminated: boolean;
  joinedAt: number;
}

export interface PlayerRole {
  role: Role;
  word: string;
}

export interface WordHistoryEntry {
  playerId: string;
  playerName: string;
  word: string;
  round: number;
  timestamp: number;
}

export type SessionPhase = 'lobby' | 'playing' | 'voting' | 'mrwhite-guess' | 'results';

export interface OnlineSession {
  id: string;
  hostId: string;
  phase: SessionPhase;
  config: {
    undercoverCount: number;
    hasMrWhite: boolean;
    unanimousVote: boolean;
  };
  selectedWordPair: WordPair | null;
  currentRound: number;
  currentSpeakerIndex: number;
  speakingOrder: string[];
  players: Record<string, OnlinePlayer>;
  playerRoles: Record<string, PlayerRole>;
  wordHistory: WordHistoryEntry[];
  votes: Record<string, string>;
  winner: 'civils' | 'undercovers' | 'mrwhite' | null;
}
