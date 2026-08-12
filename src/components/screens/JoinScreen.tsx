import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinSession } from '../../services/sessionService';
import { Button } from '../ui/Button';

export function JoinScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (!name.trim() || code.trim().length < 6) return;
    setIsLoading(true);
    setError(null);
    try {
      await joinSession(code.trim().toUpperCase(), name.trim());
      navigate(`/online/lobby/${code.trim().toUpperCase()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de rejoindre la session.');
      setIsLoading(false);
    }
  }

  const canJoin = name.trim().length > 0 && code.trim().length === 6;

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-gray-950 px-6">
      <div className="w-full max-w-xs">
        <button onClick={() => navigate('/')} className="text-gray-400 text-2xl mb-8 block">←</button>

        <div className="text-5xl mb-6 text-center">🔗</div>
        <h1 className="text-white text-2xl font-bold mb-2 text-center">Rejoindre une partie</h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          Entrez le code partagé par l'hôte.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Votre nom</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex : Bob"
              maxLength={20}
              className="w-full bg-gray-900 border border-gray-700 text-white py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
              autoFocus
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Code de session</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter' && canJoin) handleJoin(); }}
              placeholder="Ex : ABC123"
              maxLength={6}
              className="w-full bg-gray-900 border border-gray-700 text-white py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600 tracking-widest text-center text-xl font-bold"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button size="lg" fullWidth disabled={!canJoin || isLoading} onClick={handleJoin}>
            {isLoading ? 'Connexion...' : 'Rejoindre'}
          </Button>
        </div>
      </div>
    </div>
  );
}
