# 🕵️ Undercover

Jeu de déduction sociale jouable à plusieurs sur un seul téléphone (mode Pass & Play).

## Comment jouer

Chaque joueur reçoit secrètement un mot. La majorité des joueurs sont des **civils** et partagent le même mot. Un ou plusieurs **undercovers** reçoivent un mot proche mais différent. **Mr. White** ne reçoit aucun mot.

Chaque manche, chaque joueur décrit son mot en une phrase sans le nommer. Le groupe vote ensuite pour éliminer le joueur qu'il soupçonne être l'imposteur.

- Les **civils** gagnent en éliminant tous les undercovers et Mr. White.
- Les **undercovers** gagnent si leur nombre égale ou dépasse celui des civils.
- **Mr. White** gagne s'il est éliminé et devine le mot civil.

## Stack

React 19 · TypeScript · Tailwind CSS v4 · Vite · PWA

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner VITE_GEMINI_API_KEY
npm run dev
```

La clé Gemini est gratuite sur [aistudio.google.com](https://aistudio.google.com).
