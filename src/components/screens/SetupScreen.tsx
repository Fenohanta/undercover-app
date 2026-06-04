import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WordPair } from '../../types/game';
import { useGame } from '../../context/GameContext';
import { ThemeSelector } from '../ui/ThemeSelector';
import { Button } from '../ui/Button';

export function SetupScreen() {
  const navigate = useNavigate();
  const { dispatch } = useGame();

  const [playerCount, setPlayerCount] = useState(4);
  const [undercoverCount, setUndercoverCount] = useState(1);
  const [hasMrWhite, setHasMrWhite] = useState(false);
  const [wordPair, setWordPair] = useState<WordPair | null>(null);

  const maxUndercovers = playerCount - (hasMrWhite ? 1 : 0) - 2;

  function handleUndercoverChange(val: number) {
    setUndercoverCount(Math.min(val, maxUndercovers));
  }

  function handlePlayerCountChange(val: number) {
    setPlayerCount(val);
    const max = val - (hasMrWhite ? 1 : 0) - 2;
    setUndercoverCount(prev => Math.min(prev, max));
  }

  function handleMrWhiteToggle(checked: boolean) {
    setHasMrWhite(checked);
    const max = playerCount - (checked ? 1 : 0) - 2;
    setUndercoverCount(prev => Math.min(prev, max));
  }

  function handleStart() {
    if (!wordPair) return;
    dispatch({
      type: 'START_GAME',
      payload: {
        config: { playerCount, undercoverCount, hasMrWhite, wordSource: wordPair.source ?? 'local' },
        wordPair,
      },
    });
    navigate('/distribution');
  }

  return (
    <div className="min-h-svh bg-gray-950 px-6 py-8">
      <div className="max-w-sm mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-400 text-2xl">←</button>
          <h1 className="text-white text-2xl font-bold">Configuration</h1>
        </div>

        {/* Nombre de joueurs */}
        <section>
          <h2 className="text-gray-300 font-semibold mb-3">
            Joueurs : <span className="text-white">{playerCount}</span>
          </h2>
          <input
            type="range"
            min={3}
            max={12}
            value={playerCount}
            onChange={e => handlePlayerCountChange(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-gray-500 text-xs mt-1">
            <span>3</span><span>12</span>
          </div>
        </section>

        {/* Nombre d'undercovers */}
        <section>
          <h2 className="text-gray-300 font-semibold mb-3">
            Undercovers : <span className="text-white">{undercoverCount}</span>
          </h2>
          <input
            type="range"
            min={1}
            max={Math.max(1, maxUndercovers)}
            value={undercoverCount}
            onChange={e => handleUndercoverChange(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-gray-500 text-xs mt-1">
            <span>1</span><span>{Math.max(1, maxUndercovers)}</span>
          </div>
        </section>

        {/* Mr. White */}
        <section>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-gray-300 font-semibold">⬜ Mr. White</p>
              <p className="text-gray-500 text-sm">Ne connaît pas son mot. Doit deviner s'il est éliminé.</p>
            </div>
            <div
              onClick={() => handleMrWhiteToggle(!hasMrWhite)}
              className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                hasMrWhite ? 'bg-indigo-600' : 'bg-gray-700'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                hasMrWhite ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </div>
          </label>
        </section>

        {/* Résumé des rôles */}
        <div className="bg-gray-900 rounded-2xl p-4 text-sm space-y-1">
          <p className="text-gray-400">
            <span className="text-blue-400 font-medium">
              {playerCount - undercoverCount - (hasMrWhite ? 1 : 0)} Civils
            </span>
            {' · '}
            <span className="text-red-400 font-medium">{undercoverCount} Undercover{undercoverCount > 1 ? 's' : ''}</span>
            {hasMrWhite && (
              <><span className="text-gray-400"> · </span><span className="text-gray-300 font-medium">1 Mr. White</span></>
            )}
          </p>
        </div>

        {/* Sélecteur de mots */}
        <section>
          <h2 className="text-gray-300 font-semibold mb-3">Mots du jeu</h2>
          <ThemeSelector onWordPairReady={setWordPair} />
          {wordPair && (
            <p className="text-green-400 text-sm mt-2">
              ✅ Mots prêts ({wordPair.source === 'ai-generated' ? `thème : ${wordPair.category}` : wordPair.category})
            </p>
          )}
        </section>

        <Button size="lg" fullWidth disabled={!wordPair} onClick={handleStart}>
          Lancer la Distribution
        </Button>
      </div>
    </div>
  );
}
