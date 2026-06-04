export type Role = 'civil' | 'undercover' | 'mrwhite';

export type WordSource = 'local' | 'ai-generated';

export interface Player {
  id: number;
  name: string;
  role: Role;
  word: string;
  isEliminated: boolean;
  hasSeenWord: boolean;
}

export interface WordPair {
  civil: string;
  undercover: string;
  category: string;
  source?: WordSource;
}

export interface GameConfig {
  playerCount: number;
  undercoverCount: number;
  hasMrWhite: boolean;
  wordTheme?: string;
  wordSource: WordSource;
}

export interface GameState {
  phase: 'setup' | 'distribution' | 'playing' | 'voting' | 'results';
  config: GameConfig;
  players: Player[];
  currentDistributionIndex: number;
  currentRound: number;
  speakingOrder: number[];
  selectedWordPair: WordPair | null;
  winner: 'civils' | 'undercovers' | 'mrwhite' | null;
  isLoadingWords: boolean;
  wordLoadError: string | null;
}
