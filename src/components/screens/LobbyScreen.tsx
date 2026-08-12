import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  subscribeToSession,
  updateSessionConfig,
  setWordPairForSession,
  startOnlineGame,
  ensureAuth,
} from '../../services/sessionService';
import type { OnlineSession } from '../../types/online';
import type { WordPair } from '../../types/game';
import { ThemeSelector } from '../ui/ThemeSelector';
import { Button } from '../ui/Button';

export function LobbyScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<OnlineSession | null>(null);
  const [myUid, setMyUid] = useState('');
  const [wordPair, setWordPair] = useState<WordPair | null>(null);
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureAuth().then(setMyUid);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const unsub = subscribeToSession(sessionId, (s) => {
      if (!s) { navigate('/'); return; }
      setSession(s);
      // Reset local wordPair if host reset the session
      if (!s.selectedWordPair) setWordPair(null);
      if (s.phase === 'playing' || s.phase === 'voting' || s.phase === 'mrwhite-guess' || s.phase === 'results') {
        navigate(`/online/game/${sessionId}`);
      }
    });
    return unsub;
  }, [sessionId, navigate]);

  const isHost = myUid && session?.hostId === myUid;
  const players = session ? Object.values(session.players).sort((a, b) => a.joinedAt - b.joinedAt) : [];
  const playerCount = players.length;
  const maxUndercovers = playerCount - (session?.config.hasMrWhite ? 1 : 0) - 2;

  const handleCopy = useCallback(() => {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [sessionId]);

  async function handleConfigChange(
    field: 'undercoverCount' | 'hasMrWhite' | 'unanimousVote',
    value: number | boolean
  ) {
    if (!sessionId || !session) return;
    const newConfig = {
      undercoverCount: field === 'undercoverCount'
        ? Math.min(value as number, Math.max(1, maxUndercovers))
        : Math.min(session.config.undercoverCount, Math.max(1, playerCount - (field === 'hasMrWhite' && value ? 1 : session.config.hasMrWhite ? 1 : 0) - 2)),
      hasMrWhite: field === 'hasMrWhite' ? (value as boolean) : session.config.hasMrWhite,
      unanimousVote: field === 'unanimousVote' ? (value as boolean) : session.config.unanimousVote,
    };
    await updateSessionConfig(sessionId, newConfig);
  }

  async function handleWordPairReady(pair: WordPair) {
    setWordPair(pair);
    if (sessionId) await setWordPairForSession(sessionId, pair);
  }

  async function handleStart() {
    if (!sessionId) return;
    setIsStarting(true);
    setError(null);
    try {
      await startOnlineGame(sessionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du démarrage.');
      setIsStarting(false);
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-svh bg-gray-950">
        <p className="text-gray-400">Connexion...</p>
      </div>
    );
  }

  const effectiveMax = Math.max(1, maxUndercovers);
  const civils = playerCount - session.config.undercoverCount - (session.config.hasMrWhite ? 1 : 0);

  return (
    <div className="min-h-svh bg-gray-950 px-6 py-8">
      <div className="max-w-sm mx-auto space-y-6">

        {/* Code session */}
        <div className="bg-gray-900 rounded-2xl p-5 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Code de session</p>
          <button onClick={handleCopy} className="flex items-center justify-center gap-3 w-full group">
            <span className="text-white text-4xl font-bold tracking-[0.2em]">{sessionId}</span>
            <span className="text-gray-500 group-hover:text-gray-300 text-lg transition-colors">
              {copied ? '✅' : '📋'}
            </span>
          </button>
          <p className="text-gray-600 text-xs mt-2">{copied ? 'Copié !' : 'Appuyez pour copier'}</p>
        </div>

        {/* Joueurs */}
        <section>
          <h2 className="text-gray-400 text-sm uppercase tracking-widest mb-3">
            Joueurs ({playerCount})
          </h2>
          <div className="space-y-2">
            {players.map(p => (
              <div key={p.id} className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3">
                <span className="text-lg">{p.isHost ? '👑' : '👤'}</span>
                <span className="text-white font-medium">{p.name}</span>
                {p.id === myUid && <span className="ml-auto text-indigo-400 text-xs">Vous</span>}
              </div>
            ))}
          </div>
          {playerCount < 3 && (
            <p className="text-yellow-600 text-sm mt-2 text-center">
              Minimum 3 joueurs pour démarrer
            </p>
          )}
        </section>

        {/* Config (host only) */}
        {isHost && (
          <>
            <section className="space-y-5">
              <h2 className="text-gray-400 text-sm uppercase tracking-widest">Configuration</h2>

              <div>
                <p className="text-gray-300 font-semibold mb-2">
                  Undercovers : <span className="text-white">{session.config.undercoverCount}</span>
                </p>
                <input
                  type="range"
                  min={1}
                  max={effectiveMax}
                  value={Math.min(session.config.undercoverCount, effectiveMax)}
                  onChange={e => handleConfigChange('undercoverCount', Number(e.target.value))}
                  className="w-full accent-indigo-500"
                  disabled={playerCount < 3}
                />
                <div className="flex justify-between text-gray-600 text-xs mt-1">
                  <span>1</span><span>{effectiveMax}</span>
                </div>
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-gray-300 font-semibold">⬜ Mr. White</p>
                  <p className="text-gray-500 text-sm">Ne connaît pas son mot</p>
                </div>
                <div
                  onClick={() => handleConfigChange('hasMrWhite', !session.config.hasMrWhite)}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                    session.config.hasMrWhite ? 'bg-indigo-600' : 'bg-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                    session.config.hasMrWhite ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-gray-300 font-semibold">🗳️ 2 tours, vote unanime</p>
                  <p className="text-gray-500 text-sm">Tous doivent voter la même personne, sinon les Undercovers gagnent</p>
                </div>
                <div
                  onClick={() => handleConfigChange('unanimousVote', !session.config.unanimousVote)}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                    session.config.unanimousVote ? 'bg-indigo-600' : 'bg-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                    session.config.unanimousVote ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </div>
              </label>

              <div className="bg-gray-900 rounded-xl p-3 text-sm text-gray-400">
                <span className="text-blue-400 font-medium">{Math.max(0, civils)} Civil{civils !== 1 ? 's' : ''}</span>
                {' · '}
                <span className="text-red-400 font-medium">
                  {session.config.undercoverCount} Undercover{session.config.undercoverCount > 1 ? 's' : ''}
                </span>
                {session.config.hasMrWhite && (
                  <><span className="text-gray-600"> · </span><span className="text-gray-300">1 Mr. White</span></>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-gray-400 text-sm uppercase tracking-widest mb-3">Mots du jeu</h2>
              <ThemeSelector onWordPairReady={handleWordPairReady} />
              {wordPair && (
                <p className="text-green-400 text-sm mt-2">
                  ✅ Mots prêts ({wordPair.source === 'ai-generated' ? `thème : ${wordPair.category}` : wordPair.category})
                </p>
              )}
            </section>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <Button
              size="lg"
              fullWidth
              disabled={!wordPair || playerCount < 3 || isStarting}
              onClick={handleStart}
            >
              {isStarting ? 'Démarrage...' : 'Lancer la partie'}
            </Button>
          </>
        )}

        {/* Non-host waiting */}
        {!isHost && (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-400">En attente que l'hôte configure et lance la partie...</p>
          </div>
        )}
      </div>
    </div>
  );
}
