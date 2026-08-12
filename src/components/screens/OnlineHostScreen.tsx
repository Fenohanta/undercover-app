import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../../services/sessionService';
import { Button } from '../ui/Button';

export function OnlineHostScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const { sessionId } = await createSession(name.trim());
      navigate(`/online/lobby/${sessionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création de la session.');
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-gray-950 px-6">
      <div className="w-full max-w-xs">
        <button onClick={() => navigate('/new-game')} className="text-gray-400 text-2xl mb-8 block">←</button>

        <div className="text-5xl mb-6 text-center">🌐</div>
        <h1 className="text-white text-2xl font-bold mb-2 text-center">Créer une partie en ligne</h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          Un code de session sera généré. Partagez-le avec vos amis.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Votre nom</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && name.trim()) handleCreate(); }}
              placeholder="Ex : Alice"
              maxLength={20}
              className="w-full bg-gray-900 border border-gray-700 text-white py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
              autoFocus
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button size="lg" fullWidth disabled={!name.trim() || isLoading} onClick={handleCreate}>
            {isLoading ? 'Création...' : 'Créer la session'}
          </Button>
        </div>
      </div>
    </div>
  );
}
