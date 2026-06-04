import { useState } from 'react';
import type { WordPair, WordSource } from '../../types/game';
import { LOCAL_CATEGORIES } from '../../data/wordPairs';
import { pickRandomWordPair } from '../../utils/gameLogic';
import { generateWordPairSafe } from '../../services/wordGeneration';
import { Button } from './Button';

interface ThemeSelectorProps {
  onWordPairReady: (pair: WordPair) => void;
}

export function ThemeSelector({ onWordPairReady }: ThemeSelectorProps) {
  const [source, setSource] = useState<WordSource>('local');
  const [selectedCategory, setSelectedCategory] = useState('');
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
      <div className="flex gap-2">
        <button
          onClick={() => setSource('local')}
          className={`flex-1 py-2 rounded-xl font-medium transition-all ${
            source === 'local' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          📚 Dictionnaire
        </button>
        <button
          onClick={() => setSource('ai-generated')}
          className={`flex-1 py-2 rounded-xl font-medium transition-all ${
            source === 'ai-generated' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          🤖 Thème libre
        </button>
      </div>

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
            onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); }}
            placeholder="Ex: Harry Potter, Cuisine japonaise, Sport…"
            className="w-full bg-gray-800 text-white py-3 px-4 rounded-xl placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-gray-500 text-xs mt-1 px-1">
            Nécessite une connexion internet. Fallback sur le dictionnaire si indisponible.
          </p>
        </div>
      )}

      {error && (
        <p className={`text-sm px-1 ${fallbackUsed ? 'text-yellow-400' : 'text-red-400'}`}>
          {fallbackUsed ? '⚠️ ' : '❌ '}{error}
        </p>
      )}

      <Button fullWidth disabled={isLoading} onClick={handleGenerate}>
        {isLoading ? '⏳ Génération en cours…' : '✨ Choisir les mots'}
      </Button>
    </div>
  );
}
