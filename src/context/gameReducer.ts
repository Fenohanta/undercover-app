import type { GameState, GameConfig, WordPair } from '../types/game';
import { assignRoles, checkWinCondition, generateSpeakingOrder } from '../utils/gameLogic';

export type GameAction =
  | { type: 'START_GAME'; payload: { config: GameConfig; wordPair: WordPair } }
  | { type: 'CONFIRM_WORD_SEEN' }
  | { type: 'START_ROUND' }
  | { type: 'ELIMINATE_PLAYER'; payload: { playerId: number } }
  | { type: 'MRWHITE_GUESS_SUCCESS' }
  | { type: 'SET_WORD_PAIR'; payload: WordPair }
  | { type: 'SET_LOADING_WORDS'; payload: boolean }
  | { type: 'SET_WORD_ERROR'; payload: string | null }
  | { type: 'RESET_GAME' };

export const initialGameState: GameState = {
  phase: 'setup',
  config: {
    playerCount: 4,
    undercoverCount: 1,
    hasMrWhite: false,
    wordSource: 'local',
  },
  players: [],
  currentDistributionIndex: 0,
  currentRound: 1,
  speakingOrder: [],
  selectedWordPair: null,
  winner: null,
  isLoadingWords: false,
  wordLoadError: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const { config, wordPair } = action.payload;
      const players = assignRoles(config, wordPair);
      return {
        ...state,
        phase: 'distribution',
        config,
        players,
        selectedWordPair: wordPair,
        currentDistributionIndex: 0,
        currentRound: 1,
        winner: null,
        speakingOrder: [],
      };
    }

    case 'SET_WORD_PAIR':
      return { ...state, selectedWordPair: action.payload, isLoadingWords: false };

    case 'SET_LOADING_WORDS':
      return { ...state, isLoadingWords: action.payload, wordLoadError: null };

    case 'SET_WORD_ERROR':
      return { ...state, wordLoadError: action.payload, isLoadingWords: false };

    case 'CONFIRM_WORD_SEEN': {
      const nextIndex = state.currentDistributionIndex + 1;
      const allSeen = nextIndex >= state.players.length;
      if (allSeen) {
        return {
          ...state,
          currentDistributionIndex: nextIndex,
          phase: 'playing',
          speakingOrder: generateSpeakingOrder(state.players),
        };
      }
      return { ...state, currentDistributionIndex: nextIndex };
    }

    case 'START_ROUND':
      return {
        ...state,
        phase: 'playing',
        currentRound: state.currentRound + 1,
        speakingOrder: generateSpeakingOrder(state.players),
      };

    case 'ELIMINATE_PLAYER': {
      const updatedPlayers = state.players.map(p =>
        p.id === action.payload.playerId ? { ...p, isEliminated: true } : p
      );

      // Check if eliminated player is Mr. White — they get a guess
      const eliminatedPlayer = state.players.find(p => p.id === action.payload.playerId);
      if (eliminatedPlayer?.role === 'mrwhite') {
        return {
          ...state,
          players: updatedPlayers,
          phase: 'voting',
        };
      }

      const winner = checkWinCondition(updatedPlayers);
      return {
        ...state,
        players: updatedPlayers,
        phase: winner ? 'results' : 'playing',
        winner,
        speakingOrder: winner ? [] : generateSpeakingOrder(updatedPlayers),
      };
    }

    case 'MRWHITE_GUESS_SUCCESS':
      return { ...state, phase: 'results', winner: 'mrwhite' };

    case 'RESET_GAME':
      return initialGameState;

    default:
      return state;
  }
}
