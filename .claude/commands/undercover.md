---
name: undercover-pwa
description: >
  Guide de réalisation complet pour construire le jeu Undercover en mode Pass & Play.
  Stack : React 18 + Vite + TypeScript + Tailwind CSS + PWA.
  Fonctionnalité clé : dictionnaire de mots local + génération de paires par thème libre via l'API Gemini (gemini-2.0-flash, gratuite).
  À utiliser dans Claude Code pour scaffolder le projet, implémenter la logique métier et les écrans.
triggers:
  - "undercover"
  - "jeu undercover"
  - "pass and play"
  - "word game pwa"
  - "génération de mots par thème"
---

# 🕵️ Guide Technique — Jeu Undercover (Mode Pass & Play)

> **Architecte :** Guide de réalisation complet pour un développeur solo ou une petite équipe.
> **Objectif :** Livrer une application mobile fonctionnelle, jouable en local sur un seul téléphone.
> **Stack choisie :** PWA (React + Vite + TypeScript + Tailwind CSS).

---

## Table des Matières

1. [Analyse du Besoin & Contraintes](#1-analyse-du-besoin--contraintes)
2. [Choix Technologiques — PWA Retenu](#2-choix-technologiques--pwa-retenu)
3. [Architecture & Modèle de Données](#3-architecture--modèle-de-données)
4. [Plan d'Action Étape par Étape](#4-plan-daction-étape-par-étape)
5. [Exemple de Code Clé — Logique de Distribution](#5-exemple-de-code-clé--logique-de-distribution)
6. [Sécurité & UX du Mode Pass & Play](#6-sécurité--ux-du-mode-pass--play)
7. [Dictionnaire de Mots — Structure de Données](#7-dictionnaire-de-mots--structure-de-données)
8. [Génération de Mots par Thème — API Gemini](#8-génération-de-mots-par-thème--api-gemini)
9. [Checklist de Lancement](#9-checklist-de-lancement)

---

## 1. Analyse du Besoin & Contraintes

Avant tout choix technique, listons les contraintes structurantes :

| Contrainte | Impact Technique |
|---|---|
| **Un seul appareil** partagé entre joueurs | Pas besoin de réseau/multijoueur. Zéro backend obligatoire. |
| **Confidentialité des rôles** | L'écran doit masquer le mot après validation. Pas de persistance entre joueurs. |
| **Déploiement rapide** | Éviter les cycles App Store/Google Play. PWA = URL immédiate. |
| **Public large** | Interface simple, lisible, pas d'apprentissage requis. |
| **Contenu évolutif** | Dictionnaire local + génération dynamique par thème via IA. |

---

## 2. Choix Technologiques — PWA Retenu

**La PWA est le choix définitif pour ce projet.** Voici pourquoi :

**Déploiement en quelques minutes.** Une PWA se déploie sur Vercel ou Netlify gratuitement. Le lien est partageable immédiatement, sans validation d'App Store. Les joueurs peuvent l'installer sur leur écran d'accueil en un tap pour une expérience quasi-native.

**Zéro friction pour l'utilisateur.** Pas d'installation d'app obligatoire. Un QR code suffit pour que tout le groupe accède au jeu.

**Stack JavaScript universel.** React est maîtrisé par la grande majorité des développeurs web. Aucun langage exotique à apprendre.

**Tailwind CSS** permet de construire une UI soignée, responsive et "mobile-first" très rapidement.

**Offline natif.** Avec un Service Worker, le jeu fonctionne sans connexion internet — la génération de mots par IA nécessite une connexion, mais le dictionnaire local prend le relais hors-ligne.

> **Note stores :** Si une présence App Store / Play Store devient nécessaire ultérieurement, la logique métier est entièrement découplée de l'UI et portable vers Flutter ou React Native sans réécriture majeure.

### Stack Technique Finale

```
Framework UI     : React 18 (avec Vite comme bundler)
Styling          : Tailwind CSS v3
Gestion d'état   : React Context API + useReducer
Routing          : React Router v6
Données locales  : JSON statique (dictionnaire de mots embarqué)
Données dynamiques : API Gemini (gemini-2.0-flash, gratuite) — génération par thème
Déploiement      : Vercel (gratuit, CI/CD automatique sur push GitHub)
PWA              : vite-plugin-pwa (Service Worker + manifest)
Langage          : TypeScript
```

---

## 3. Architecture & Modèle de Données

### 3.1 Structure des Écrans (Routes)

```
/                   → Écran d'accueil (titre + bouton "Nouvelle Partie")
/setup              → Configuration (nb joueurs, nb undercovers, Mr. White, choix du thème)
/distribution       → Distribution secrète des rôles (Pass & Play)
/game               → Écran de jeu (ordre de parole + votes)
/results            → Écran de fin (victoire d'un camp)
```

### 3.2 Modèle de Données TypeScript

```typescript
// types/game.ts

export type Role = 'civil' | 'undercover' | 'mrwhite';

export type WordSource = 'local' | 'ai-generated';

export interface Player {
  id: number;
  name: string;           // "Joueur 1", "Joueur 2", etc.
  role: Role;
  word: string;           // Le mot attribué (vide pour Mr. White)
  isEliminated: boolean;
  hasSeenWord: boolean;   // Pour le flow de distribution
}

export interface WordPair {
  civil: string;
  undercover: string;
  category: string;       // Ex: "Fruits", "Animaux", "Sports"
  source?: WordSource;    // 'local' | 'ai-generated'
}

export interface GameConfig {
  playerCount: number;        // 3 à 12
  undercoverCount: number;    // 1 à N
  hasMrWhite: boolean;
  wordTheme?: string;         // Thème libre saisi par l'utilisateur (ex: "Harry Potter", "Cuisine japonaise")
  wordSource: WordSource;     // Choix de la source de mots
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
  isLoadingWords: boolean;    // Vrai pendant la génération IA
  wordLoadError: string | null;
}
```

### 3.3 Structure du Projet

```
undercover-app/
├── public/
│   └── icons/              # Icônes PWA (192x192, 512x512)
├── src/
│   ├── components/
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── SetupScreen.tsx       # Inclut le sélecteur de thème
│   │   │   ├── DistributionScreen.tsx
│   │   │   ├── GameScreen.tsx
│   │   │   └── ResultsScreen.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── PlayerCard.tsx
│   │       ├── RoleReveal.tsx
│   │       └── ThemeSelector.tsx     # Nouveau : saisie du thème libre
│   ├── context/
│   │   ├── GameContext.tsx
│   │   └── gameReducer.ts
│   ├── data/
│   │   └── wordPairs.ts              # Dictionnaire local
│   ├── services/
│   │   └── wordGeneration.ts         # Nouveau : appel API Claude
│   ├── types/
│   │   └── game.ts
│   ├── utils/
│   │   └── gameLogic.ts
│   └── App.tsx
├── vite.config.ts
└── tailwind.config.js
```

### 3.4 Gestion d'État avec useReducer

```typescript
// context/gameReducer.ts

type GameAction =
  | { type: 'START_GAME'; payload: GameConfig }
  | { type: 'CONFIRM_WORD_SEEN'; payload: { playerId: number } }
  | { type: 'START_ROUND' }
  | { type: 'ELIMINATE_PLAYER'; payload: { playerId: number } }
  | { type: 'MRWHITE_GUESS'; payload: { guess: string } }
  | { type: 'SET_WORD_PAIR'; payload: WordPair }         // Reçu après génération IA
  | { type: 'SET_LOADING_WORDS'; payload: boolean }
  | { type: 'SET_WORD_ERROR'; payload: string | null }
  | { type: 'RESET_GAME' };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return initializeGame(action.payload);

    case 'SET_WORD_PAIR':
      return { ...state, selectedWordPair: action.payload, isLoadingWords: false };

    case 'SET_LOADING_WORDS':
      return { ...state, isLoadingWords: action.payload, wordLoadError: null };

    case 'SET_WORD_ERROR':
      return { ...state, wordLoadError: action.payload, isLoadingWords: false };

    case 'CONFIRM_WORD_SEEN': {
      const nextIndex = state.currentDistributionIndex + 1;
      const allSeen = nextIndex >= state.players.length;
      return {
        ...state,
        currentDistributionIndex: nextIndex,
        phase: allSeen ? 'playing' : 'distribution',
      };
    }

    case 'ELIMINATE_PLAYER': {
      const updatedPlayers = state.players.map(p =>
        p.id === action.payload.playerId ? { ...p, isEliminated: true } : p
      );
      const winner = checkWinCondition(updatedPlayers);
      return {
        ...state,
        players: updatedPlayers,
        phase: winner ? 'results' : 'playing',
        winner,
      };
    }

    case 'RESET_GAME':
      return initialGameState;

    default:
      return state;
  }
}
```

---

## 4. Plan d'Action Étape par Étape

### Phase 1 — Initialisation du Projet (Jour 1)

```bash
# Créer le projet avec Vite + React + TypeScript
npm create vite@latest undercover-app -- --template react-ts
cd undercover-app

# Installer les dépendances
npm install react-router-dom
npm install -D tailwindcss postcss autoprefixer
npm install -D vite-plugin-pwa

# Initialiser Tailwind
npx tailwindcss init -p
```

**Objectifs de la phase :**
- Projet qui compile et s'affiche dans le navigateur
- Tailwind fonctionnel
- Routing de base entre les 5 écrans (placeholders)
- Types TypeScript définis (`types/game.ts`)

---

### Phase 2 — Logique Métier (Jours 2-3)

**2.1 — Dictionnaire de mots** (`src/data/wordPairs.ts`)
Minimum 30 paires civil/undercover organisées par catégorie (voir section 7).

**2.2 — Service de génération IA** (`src/services/wordGeneration.ts`)
Appel à l'API Gemini (gratuite) pour générer une paire de mots sur un thème libre (voir section 8).

**2.3 — Fonctions utilitaires** (`src/utils/gameLogic.ts`)
- `shuffleArray<T>(arr: T[]): T[]` — Fisher-Yates
- `assignRoles(config: GameConfig, wordPair: WordPair): Player[]`
- `checkWinCondition(players: Player[]): WinResult | null`
- `generateSpeakingOrder(players: Player[]): number[]`

**2.4 — Context & Reducer** (`src/context/`)
- `gameReducer` complet avec les nouvelles actions `SET_WORD_PAIR`, `SET_LOADING_WORDS`, `SET_WORD_ERROR`
- `GameContext` avec Provider
- Hook `useGame()`

**Tests unitaires conseillés :**
```typescript
describe('assignRoles', () => {
  it('assigne exactement le bon nombre d\'undercovers', () => {
    const config = { playerCount: 6, undercoverCount: 2, hasMrWhite: true, wordSource: 'local' };
    const players = assignRoles(config, mockWordPair);
    expect(players.filter(p => p.role === 'undercover').length).toBe(2);
    expect(players.filter(p => p.role === 'mrwhite').length).toBe(1);
    expect(players.filter(p => p.role === 'civil').length).toBe(3);
  });
});
```

---

### Phase 3 — Interface Utilisateur (Jours 4-6)

**3.1 — `SetupScreen`**
- Sélecteurs : nombre de joueurs (3-12), nombre d'undercovers, toggle Mr. White
- Validation : undercovers + Mr. White ≤ joueurs - 2
- **Sélecteur de source de mots :**
  - Option A : "Dictionnaire local" → liste de catégories à choisir (ou aléatoire)
  - Option B : "Thème libre 🤖" → champ texte libre + bouton "Générer"
- Indicateur de chargement pendant la génération IA
- Message d'erreur clair si l'API est indisponible (fallback sur le dictionnaire local)
- Bouton "Lancer la Distribution" (désactivé tant que le mot n'est pas prêt)

**3.2 — `DistributionScreen`** *(Écran le plus critique pour la sécurité)*
- "Joueur X, prenez le téléphone"
- Bouton "Révéler mon rôle"
- Mot affiché jusqu'à tap sur "J'ai mémorisé" (avec countdown 5s)
- Écran de transition "bouclier" entre chaque joueur

**3.3 — `GameScreen`**
- Ordre de parole aléatoire avec avatars/numéros
- Bouton "Voter" → liste des joueurs actifs
- Confirmation avant élimination
- Si Mr. White éliminé : champ de devinette du mot civil

**3.4 — `ResultsScreen`**
- Animation de victoire selon le camp
- Révélation de tous les rôles et mots
- Bouton "Nouvelle Partie"

---

### Phase 4 — Polish & Déploiement (Jour 7)

**4.1 — Configuration PWA** (`vite.config.ts`)
```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Undercover',
        short_name: 'Undercover',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

**4.2 — Variable d'environnement pour la clé API**
```bash
# .env.local (ne jamais committer ce fichier)
# Clé obtenue gratuitement sur aistudio.google.com
VITE_GEMINI_API_KEY=AIzaSy...
```

```bash
# .gitignore — vérifier que ces lignes sont présentes
.env
.env.local
.env.*.local
```

**4.3 — Déploiement Vercel**
```bash
npm install -g vercel
vercel --prod
# Ajouter VITE_GEMINI_API_KEY dans les variables d'env Vercel (Dashboard > Settings > Environment Variables)
```

**4.4 — Tests finaux**
- Test sur iOS Safari (bouton "Ajouter à l'écran d'accueil")
- Test sur Android Chrome
- Test en mode avion (vérifier le fallback dictionnaire local)
- Partie complète avec 6 joueurs réels

---

## 5. Exemple de Code Clé — Logique de Distribution

```typescript
// src/utils/gameLogic.ts

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

export function assignRoles(config: GameConfig, wordPair: WordPair): Player[] {
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
    name: `Joueur ${index + 1}`,
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
): 'civils' | 'undercovers' | null {
  const active = players.filter(p => !p.isEliminated);
  const activeCivils = active.filter(p => p.role === 'civil').length;
  const activeUndercovers = active.filter(p => p.role === 'undercover').length;

  if (activeUndercovers >= activeCivils) return 'undercovers';
  if (activeUndercovers === 0) return 'civils';
  return null;
}

export function checkMrWhiteGuess(guess: string, civilWord: string): boolean {
  return guess.trim().toLowerCase() === civilWord.trim().toLowerCase();
}
```

---

## 6. Sécurité & UX du Mode Pass & Play

### 6.1 Composant `RoleReveal` — Affichage Sécurisé

```tsx
// src/components/ui/RoleReveal.tsx

import { useState, useEffect } from 'react';
import type { Player } from '../../types/game';

interface RoleRevealProps {
  player: Player;
  onConfirm: () => void;
}

export function RoleReveal({ player, onConfirm }: RoleRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isRevealed || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [isRevealed, countdown]);

  const roleLabels = {
    civil:      { label: '🏡 Civil',      color: 'text-blue-400' },
    undercover: { label: '🕵️ Undercover', color: 'text-red-400' },
    mrwhite:    { label: '⬜ Mr. White',  color: 'text-gray-300' },
  };

  const { label, color } = roleLabels[player.role];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 px-6 text-center">
      <h2 className="text-white text-2xl font-bold mb-2">{player.name}</h2>
      <p className="text-gray-400 mb-8 text-sm">
        Assurez-vous que les autres ne voient pas l'écran.
      </p>

      {!isRevealed ? (
        <button
          onClick={() => setIsRevealed(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-2xl text-xl transition-all active:scale-95"
        >
          👁 Révéler mon rôle
        </button>
      ) : (
        <div className="w-full max-w-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 mb-6">
            <p className={`text-xl font-semibold mb-2 ${color}`}>{label}</p>
            {player.word ? (
              <p className="text-white text-4xl font-bold tracking-wide">{player.word}</p>
            ) : (
              <p className="text-gray-500 text-lg italic">Vous ne connaissez pas le mot.</p>
            )}
          </div>
          <button
            onClick={onConfirm}
            disabled={countdown > 0}
            className={`w-full font-bold py-4 rounded-2xl text-lg transition-all
              ${countdown > 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 text-white active:scale-95'
              }`}
          >
            {countdown > 0
              ? `J'ai mémorisé (${countdown}s)`
              : "✅ J'ai mémorisé — Passer le téléphone"}
          </button>
        </div>
      )}
    </div>
  );
}
```

### 6.2 Écran de Transition "Bouclier"

```tsx
<div className="flex items-center justify-center min-h-screen bg-gray-950">
  <div className="text-center">
    <div className="text-6xl mb-6">🙈</div>
    <h2 className="text-white text-2xl font-bold">
      Passez le téléphone à<br/>
      <span className="text-indigo-400">{nextPlayerName}</span>
    </h2>
    <p className="text-gray-500 mt-4 text-sm">Ne regardez pas l'écran pendant le passage.</p>
    <button
      onClick={onNextPlayerReady}
      className="mt-8 bg-indigo-600 text-white py-3 px-8 rounded-xl"
    >
      Je suis {nextPlayerName} — Continuer
    </button>
  </div>
</div>
```

---

## 7. Dictionnaire de Mots — Structure de Données

Le dictionnaire local est la source de mots par défaut. Il fonctionne hors-ligne et sert de fallback si l'API Gemini est indisponible.

```typescript
// src/data/wordPairs.ts

export const wordPairs: WordPair[] = [
  // Fruits
  { category: 'Fruits', civil: 'Pomme',      undercover: 'Poire',           source: 'local' },
  { category: 'Fruits', civil: 'Orange',     undercover: 'Clémentine',      source: 'local' },
  { category: 'Fruits', civil: 'Fraise',     undercover: 'Framboise',       source: 'local' },
  { category: 'Fruits', civil: 'Raisin',     undercover: 'Groseille',       source: 'local' },

  // Animaux
  { category: 'Animaux', civil: 'Chien',     undercover: 'Loup',            source: 'local' },
  { category: 'Animaux', civil: 'Chat',      undercover: 'Tigre',           source: 'local' },
  { category: 'Animaux', civil: 'Cheval',    undercover: 'Zèbre',           source: 'local' },
  { category: 'Animaux', civil: 'Grenouille',undercover: 'Crapaud',         source: 'local' },

  // Boissons
  { category: 'Boissons', civil: 'Café',     undercover: 'Thé',             source: 'local' },
  { category: 'Boissons', civil: 'Bière',    undercover: 'Cidre',           source: 'local' },
  { category: 'Boissons', civil: 'Coca-Cola',undercover: 'Pepsi',           source: 'local' },
  { category: 'Boissons', civil: 'Eau',      undercover: 'Limonade',        source: 'local' },

  // Lieux
  { category: 'Lieux', civil: 'Plage',       undercover: 'Piscine',         source: 'local' },
  { category: 'Lieux', civil: 'Cinéma',      undercover: 'Théâtre',         source: 'local' },
  { category: 'Lieux', civil: 'Forêt',       undercover: 'Jungle',          source: 'local' },
  { category: 'Lieux', civil: 'Montagne',    undercover: 'Colline',         source: 'local' },

  // Sports
  { category: 'Sports', civil: 'Football',   undercover: 'Rugby',           source: 'local' },
  { category: 'Sports', civil: 'Tennis',     undercover: 'Badminton',       source: 'local' },
  { category: 'Sports', civil: 'Natation',   undercover: 'Plongée',         source: 'local' },
  { category: 'Sports', civil: 'Ski',        undercover: 'Snowboard',       source: 'local' },

  // Objets
  { category: 'Objets', civil: 'Stylo',      undercover: 'Crayon',          source: 'local' },
  { category: 'Objets', civil: 'Lunettes',   undercover: 'Jumelles',        source: 'local' },
  { category: 'Objets', civil: 'Sac à dos',  undercover: 'Valise',          source: 'local' },
  { category: 'Objets', civil: 'Montre',     undercover: 'Réveil',          source: 'local' },

  // Nourriture
  { category: 'Nourriture', civil: 'Pizza',        undercover: 'Quiche',          source: 'local' },
  { category: 'Nourriture', civil: 'Sushi',        undercover: 'Maki',            source: 'local' },
  { category: 'Nourriture', civil: 'Croissant',    undercover: 'Pain au chocolat',source: 'local' },
  { category: 'Nourriture', civil: 'Glace',        undercover: 'Sorbet',          source: 'local' },

  // Tech
  { category: 'Tech', civil: 'Téléphone',    undercover: 'Tablette',        source: 'local' },
  { category: 'Tech', civil: 'Casque audio', undercover: 'Écouteurs',       source: 'local' },
];

// Liste des catégories disponibles (pour l'UI du SetupScreen)
export const LOCAL_CATEGORIES = [...new Set(wordPairs.map(wp => wp.category))];
```

---

## 8. Génération de Mots par Thème — API Gemini

Cette fonctionnalité permet aux joueurs de saisir n'importe quel thème libre ("Harry Potter", "Cuisine japonaise", "Années 80"...) et d'obtenir une paire de mots inédite générée par l'IA.

**Pourquoi Gemini ?** L'API Gemini de Google est **gratuite** via Google AI Studio (aistudio.google.com) : 15 req/min et 1 500 req/jour avec `gemini-2.0-flash`, sans carte bancaire requise.

### 8.1 Service de Génération

```typescript
// src/services/wordGeneration.ts

import type { WordPair } from '../types/game';
import { pickRandomWordPair } from '../utils/gameLogic';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function generateWordPairFromTheme(theme: string): Promise<WordPair> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Clé API Gemini manquante. Vérifiez votre fichier .env.local.');
  }

  const prompt = `Tu es un générateur de paires de mots pour le jeu Undercover.

Le thème choisi par les joueurs est : "${theme}"

Génère UNE paire de mots respectant ces règles :
1. Les deux mots appartiennent à l'univers du thème.
2. Les mots sont proches mais distincts (pas de synonymes exacts, pas trop éloignés).
3. Les mots doivent être des noms simples (1-3 mots maximum).

Exemples :
- Thème "Harry Potter" → civil: "Gryffondor", undercover: "Serdaigle"
- Thème "Cuisine japonaise" → civil: "Ramen", undercover: "Udon"
- Thème "Années 80" → civil: "Walkman", undercover: "Discman"

Réponds UNIQUEMENT avec un objet JSON, sans backticks, sans explication :
{"civil": "...", "undercover": "...", "category": "${theme}"}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 100, temperature: 0.9 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur API Gemini : ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  try {
    // Gemini peut envelopper le JSON dans des backticks markdown
    const cleaned = rawText.trim().replace(/^```json?\n?/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.civil || !parsed.undercover || !parsed.category) {
      throw new Error('Réponse JSON incomplète');
    }
    return { ...parsed, source: 'ai-generated' } as WordPair;
  } catch {
    throw new Error(`Réponse inattendue de l'IA : ${rawText}`);
  }
}

export async function generateWordPairSafe(
  theme: string,
  onFallback?: (reason: string) => void
): Promise<WordPair> {
  try {
    return await generateWordPairFromTheme(theme);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Erreur inconnue';
    onFallback?.(reason);
    return pickRandomWordPair();
  }
}
```

### 8.2 Composant `ThemeSelector` (intégré dans `SetupScreen`)

```tsx
// src/components/ui/ThemeSelector.tsx

import { useState } from 'react';
import type { WordPair, WordSource } from '../../types/game';
import { LOCAL_CATEGORIES, pickRandomWordPair } from '../../data/wordPairs';
import { generateWordPairSafe } from '../../services/wordGeneration';

interface ThemeSelectorProps {
  onWordPairReady: (pair: WordPair) => void;
}

export function ThemeSelector({ onWordPairReady }: ThemeSelectorProps) {
  const [source, setSource] = useState<WordSource>('local');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customTheme, setCustomTheme] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);
    setFallbackUsed(false);

    if (source === 'local') {
      const pair = pickRandomWordPair(selectedCategory || undefined);
      onWordPairReady(pair);
      setIsLoading(false);
      return;
    }

    // Source : IA
    if (!customTheme.trim()) {
      setError('Entrez un thème pour générer des mots.');
      setIsLoading(false);
      return;
    }

    const pair = await generateWordPairSafe(customTheme.trim(), (reason) => {
      setFallbackUsed(true);
      setError(`IA indisponible (${reason}). Paire du dictionnaire local utilisée.`);
    });

    onWordPairReady(pair);
    setIsLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Toggle source */}
      <div className="flex gap-2">
        <button
          onClick={() => setSource('local')}
          className={`flex-1 py-2 rounded-xl font-medium transition-all
            ${source === 'local' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          📚 Dictionnaire
        </button>
        <button
          onClick={() => setSource('ai-generated')}
          className={`flex-1 py-2 rounded-xl font-medium transition-all
            ${source === 'ai-generated' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          🤖 Thème libre
        </button>
      </div>

      {/* Options selon la source */}
      {source === 'local' ? (
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="w-full bg-gray-800 text-white py-3 px-4 rounded-xl"
        >
          <option value="">Catégorie aléatoire</option>
          {LOCAL_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      ) : (
        <div>
          <input
            type="text"
            value={customTheme}
            onChange={e => setCustomTheme(e.target.value)}
            placeholder="Ex: Harry Potter, Cuisine japonaise, Sport…"
            className="w-full bg-gray-800 text-white py-3 px-4 rounded-xl placeholder-gray-500"
          />
          <p className="text-gray-500 text-xs mt-1 px-1">
            Nécessite une connexion internet. Fallback sur le dictionnaire si indisponible.
          </p>
        </div>
      )}

      {/* Feedback d'erreur */}
      {error && (
        <p className={`text-sm px-1 ${fallbackUsed ? 'text-yellow-400' : 'text-red-400'}`}>
          {fallbackUsed ? '⚠️ ' : '❌ '}{error}
        </p>
      )}

      {/* Bouton Générer */}
      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className={`w-full py-3 rounded-xl font-bold text-white transition-all
          ${isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'}`}
      >
        {isLoading ? '⏳ Génération en cours…' : '✨ Choisir les mots'}
      </button>
    </div>
  );
}
```

### 8.3 Flux de Sélection des Mots dans `SetupScreen`

```tsx
// Extrait de SetupScreen.tsx

const [wordPair, setWordPair] = useState<WordPair | null>(null);

function handleStartDistribution() {
  if (!wordPair) return;
  dispatch({ type: 'START_GAME', payload: { ...config, wordPair } });
  navigate('/distribution');
}

return (
  <div>
    {/* ... autres config ... */}

    <section>
      <h3 className="text-white font-semibold mb-3">Mots du jeu</h3>
      <ThemeSelector onWordPairReady={setWordPair} />
      {wordPair && (
        <p className="text-green-400 text-sm mt-2">
          ✅ Mots prêts ({wordPair.source === 'ai-generated' ? `thème : ${wordPair.category}` : wordPair.category})
        </p>
      )}
    </section>

    <button
      onClick={handleStartDistribution}
      disabled={!wordPair}
      className="..."
    >
      Lancer la Distribution
    </button>
  </div>
);
```

---

## 9. Checklist de Lancement

### Fonctionnel
- [ ] Config : limites de joueurs et d'undercovers validées (min/max)
- [ ] Distribution : chaque joueur voit son mot une seule fois
- [ ] Distribution : le bouton "confirmer" est désactivé pendant le countdown
- [ ] Jeu : l'ordre de parole est bien aléatoire à chaque tour
- [ ] Vote : confirmation avant élimination
- [ ] Mr. White : champ de devinette affiché lors de son élimination
- [ ] Conditions de victoire : tous les cas testés
- [ ] Reset : retour complet à l'état initial après une partie
- [ ] **Mots locaux** : sélection par catégorie ou aléatoire fonctionnelle
- [ ] **Génération IA** : paire générée sur thème libre en < 5 secondes
- [ ] **Fallback** : si l'API est indisponible, le dictionnaire local est utilisé silencieusement
- [ ] **Clé API** : `VITE_GEMINI_API_KEY` absente = message d'erreur clair, pas de crash
- [ ] **Sécurité** : la clé API ne doit jamais apparaître dans les logs ou le DOM

### UX & Mobile
- [ ] Testé sur iOS 16+ (Safari) — bouton "Ajouter à l'écran d'accueil"
- [ ] Testé sur Android 12+ (Chrome)
- [ ] Interface lisible en pleine lumière (contraste élevé)
- [ ] Boutons suffisamment grands (min 44px de hauteur)
- [ ] Fonctionne en mode portrait uniquement (`orientation: portrait` dans le manifest)
- [ ] Fonctionne hors-ligne avec le dictionnaire local (Service Worker actif)
- [ ] Indicateur de chargement visible pendant la génération IA

### Qualité
- [ ] Aucune information de rôle lisible dans le DOM ou la console
- [ ] Pas de données persistées dans localStorage entre parties
- [ ] Tests unitaires pour `assignRoles` et `checkWinCondition`
- [ ] Chargement initial < 2 secondes sur 4G
- [ ] `.env.local` et toutes les variantes `.env*` dans `.gitignore`

---

## Notes d'Implémentation Claude Code

Quand tu crées ce projet dans Claude Code, suis cet ordre :

1. **Scaffold** : `npm create vite@latest undercover-app -- --template react-ts`
2. **Types d'abord** : crée `src/types/game.ts` avec tous les types avant tout composant
3. **Données** : crée `src/data/wordPairs.ts` (dictionnaire complet avec champ `source`)
4. **Utilitaires** : crée `src/utils/gameLogic.ts` (aucune dépendance React)
5. **Service IA** : crée `src/services/wordGeneration.ts` (aucune dépendance React)
6. **État** : crée `src/context/gameReducer.ts` puis `src/context/GameContext.tsx`
7. **Composants UI** : `Button`, `RoleReveal`, `ThemeSelector`
8. **Écrans** : dans l'ordre du flux — `Home → Setup → Distribution → Game → Results`
9. **PWA** : configure `vite.config.ts` en dernier, une fois les écrans validés

**Variables d'environnement à créer :**
```
VITE_GEMINI_API_KEY=<clé obtenue sur aistudio.google.com — gratuite>
```

**Commandes de démarrage :**
```bash
npm install
npm run dev      # dev local
npm run build    # build production
vercel --prod    # déploiement
```

---

*Guide rédigé pour une mise en production en 7 jours. Logique métier découplée de l'UI pour faciliter un portage ultérieur si nécessaire.*
