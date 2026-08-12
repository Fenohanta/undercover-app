import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  subscribeToSession,
  ensureAuth,
  submitWord,
  startVoting,
  castVote,
  resolveVotes,
  submitMrWhiteGuess,
  resetSession,
} from '../../services/sessionService';
import type { OnlineSession, PlayerRole } from '../../types/online';
import { Button } from '../ui/Button';

const ROLE_LABELS: Record<string, string> = {
  civil: 'Civil',
  undercover: 'Undercover',
  mrwhite: 'Mr. White',
};

const ROLE_COLORS: Record<string, string> = {
  civil: 'text-blue-400',
  undercover: 'text-red-400',
  mrwhite: 'text-gray-400',
};

const WINNER_MESSAGES: Record<string, { emoji: string; title: string; sub: string }> = {
  civils: { emoji: '🎉', title: 'Les Civils gagnent !', sub: "L'imposteur a été démasqué." },
  undercovers: { emoji: '🕵️', title: 'Les Undercovers gagnent !', sub: 'Ils ont survécu jusqu\'au bout.' },
  mrwhite: { emoji: '⬜', title: 'Mr. White gagne !', sub: 'Il a deviné le bon mot.' },
};

export function OnlineGameScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<OnlineSession | null>(null);
  const [myUid, setMyUid] = useState('');
  const [myRole, setMyRole] = useState<PlayerRole | null>(null);
  const [wordInput, setWordInput] = useState('');
  const [myVote, setMyVote] = useState<string | null>(null);
  const [mrWhiteGuess, setMrWhiteGuess] = useState('');
  const [mrWhiteResult, setMrWhiteResult] = useState<'win' | 'lose' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const historyBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureAuth().then(setMyUid);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const unsub = subscribeToSession(sessionId, (s) => {
      if (!s) { navigate('/'); return; }
      // Host reset the session → everyone goes back to lobby
      if (s.phase === 'lobby') {
        navigate(`/online/lobby/${sessionId}`);
        return;
      }
      setSession(s);
      if (myUid && s.playerRoles[myUid] && !myRole) {
        setMyRole(s.playerRoles[myUid]);
      }
    });
    return unsub;
  }, [sessionId, navigate, myUid, myRole]);

  useEffect(() => {
    if (myUid && session?.playerRoles[myUid] && !myRole) {
      setMyRole(session.playerRoles[myUid]);
    }
  }, [myUid, session, myRole]);

  useEffect(() => {
    historyBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.wordHistory.length]);

  // Auto-resolve en mode unanime dès que tous ont voté (exécuté par le host)
  useEffect(() => {
    if (!session || !sessionId || !myUid) return;
    if (session.phase !== 'voting') return;
    if (!session.config.unanimousVote) return;
    if (session.hostId !== myUid) return;
    const activePlayers = Object.values(session.players).filter(p => !p.isEliminated);
    if (Object.keys(session.votes).length >= activePlayers.length) {
      resolveVotes(sessionId);
    }
  }, [session, sessionId, myUid]);

  if (!session || !myUid) {
    return (
      <div className="flex items-center justify-center min-h-svh bg-gray-950">
        <p className="text-gray-400">Connexion...</p>
      </div>
    );
  }

  const isHost = session.hostId === myUid;
  const activePlayers = Object.values(session.players).filter(p => !p.isEliminated);
  const currentSpeakerId = session.speakingOrder[session.currentSpeakerIndex];
  const isMyTurn = currentSpeakerId === myUid;
  const hasVoted = myVote !== null || session.votes[myUid] !== undefined;
  const iAmMrWhite = myRole?.role === 'mrwhite';

  async function handleSubmitWord() {
    if (!wordInput.trim() || !sessionId || isSubmitting) return;
    setIsSubmitting(true);
    await submitWord(sessionId, wordInput.trim());
    setWordInput('');
    setIsSubmitting(false);
  }

  async function handleStartVoting() {
    if (!sessionId) return;
    await startVoting(sessionId);
  }

  async function handleVote(targetId: string) {
    if (!sessionId || hasVoted) return;
    setMyVote(targetId);
    await castVote(sessionId, targetId);
  }

  async function handleResolveVotes() {
    if (!sessionId) return;
    await resolveVotes(sessionId);
  }

  async function handleMrWhiteGuess() {
    if (!sessionId || !mrWhiteGuess.trim() || mrWhiteResult) return;
    setIsSubmitting(true);
    const result = await submitMrWhiteGuess(sessionId, mrWhiteGuess.trim());
    setMrWhiteResult(result);
    setIsSubmitting(false);
  }

  async function handleReplay() {
    if (!sessionId) return;
    await resetSession(sessionId);
    // Non-host players will redirect automatically via subscription
    navigate(`/online/lobby/${sessionId}`);
  }

  // Results screen
  if (session.phase === 'results') {
    const msg = WINNER_MESSAGES[session.winner ?? ''] ?? { emoji: '🏁', title: 'Partie terminée', sub: '' };
    const wordPair = session.selectedWordPair;
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-gray-950 px-6 text-center">
        <div className="text-7xl mb-4">{msg.emoji}</div>
        <h1 className="text-white text-3xl font-bold mb-2">{msg.title}</h1>
        <p className="text-gray-400 mb-8">{msg.sub}</p>
        {wordPair && (
          <div className="bg-gray-900 rounded-2xl p-5 mb-6 w-full max-w-xs">
            <p className="text-gray-500 text-xs mb-3">Les mots secrets</p>
            <div className="flex justify-around">
              <div>
                <p className="text-blue-400 text-xs mb-1">Civil</p>
                <p className="text-white font-bold text-lg">{wordPair.civil}</p>
              </div>
              <div>
                <p className="text-red-400 text-xs mb-1">Undercover</p>
                <p className="text-white font-bold text-lg">{wordPair.undercover}</p>
              </div>
            </div>
          </div>
        )}
        <div className="w-full max-w-xs space-y-3">
          <div className="bg-gray-900 rounded-2xl p-4 mb-2">
            <p className="text-gray-400 text-xs mb-2">Rôles</p>
            {Object.values(session.players).map(p => {
              const role = session.playerRoles[p.id];
              return (
                <div key={p.id} className="flex justify-between items-center py-1">
                  <span className="text-white">{p.name}</span>
                  <span className={`text-sm font-medium ${ROLE_COLORS[role?.role ?? ''] ?? 'text-gray-400'}`}>
                    {ROLE_LABELS[role?.role ?? ''] ?? '?'}
                    {role?.word ? ` · ${role.word}` : ''}
                  </span>
                </div>
              );
            })}
          </div>
          {isHost && (
            <Button fullWidth onClick={handleReplay}>
              🔄 Rejouer (nouveau thème)
            </Button>
          )}
          {!isHost && (
            <p className="text-gray-600 text-sm">En attente que l'hôte relance...</p>
          )}
          <Button fullWidth variant="ghost" onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // Mr. White guess screen
  if (session.phase === 'mrwhite-guess') {
    const mrWhitePlayer = Object.values(session.players).find(p => session.playerRoles[p.id]?.role === 'mrwhite');
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-gray-950 px-6 text-center">
        <div className="text-6xl mb-4">⬜</div>
        <h2 className="text-white text-2xl font-bold mb-2">Mr. White est éliminé !</h2>
        <p className="text-gray-400 mb-6">
          {mrWhitePlayer?.name}, vous avez une dernière chance.<br />
          Devinez le mot des civils.
        </p>

        {iAmMrWhite ? (
          mrWhiteResult === null ? (
            <div className="w-full max-w-sm space-y-3">
              <input
                type="text"
                value={mrWhiteGuess}
                onChange={e => setMrWhiteGuess(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleMrWhiteGuess(); }}
                placeholder="Votre réponse…"
                className="w-full bg-gray-800 text-white py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <Button fullWidth disabled={!mrWhiteGuess.trim() || isSubmitting} onClick={handleMrWhiteGuess}>
                Valider
              </Button>
            </div>
          ) : (
            <p className={`text-xl font-bold ${mrWhiteResult === 'win' ? 'text-green-400' : 'text-red-400'}`}>
              {mrWhiteResult === 'win' ? '🎉 Bonne réponse !' : '❌ Mauvaise réponse !'}
            </p>
          )
        ) : (
          <p className="text-gray-500 italic">En attente de la réponse de Mr. White...</p>
        )}
      </div>
    );
  }

  // Voting screen
  if (session.phase === 'voting') {
    const totalVotes = Object.keys(session.votes).length;
    const voterIds = new Set(Object.keys(session.votes));
    const myVoteTargetId = session.votes[myUid];
    const myVoteTargetName = myVoteTargetId ? session.players[myVoteTargetId]?.name : null;
    const isUnanimous = session.config.unanimousVote;

    return (
      <div className="min-h-svh bg-gray-950 px-6 py-8">
        <div className="max-w-sm mx-auto">
          <h2 className="text-white text-2xl font-bold mb-1 text-center">Vote</h2>
          <p className="text-gray-500 text-center text-sm mb-2">
            {totalVotes} / {activePlayers.length} joueurs ont voté
          </p>

          {isUnanimous && (
            <div className="mb-5 bg-yellow-950/40 border border-yellow-800 rounded-xl px-4 py-3 text-center">
              <p className="text-yellow-400 text-xs font-semibold">🗳️ Vote unanime requis</p>
              <p className="text-yellow-700 text-xs mt-1">
                Tous doivent désigner la même personne, sinon les Undercovers gagnent.
              </p>
            </div>
          )}

          {/* Avant de voter : liste cliquable */}
          {!hasVoted ? (
            <>
              <p className="text-gray-400 mb-3">Qui désignez-vous ?</p>
              <div className="space-y-2">
                {activePlayers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleVote(p.id)}
                    disabled={p.id === myUid}
                    className="w-full flex items-center justify-between bg-gray-900 hover:bg-gray-800 disabled:opacity-40 border border-gray-700 text-white font-medium py-4 px-6 rounded-2xl transition-all active:scale-95"
                  >
                    <span>{p.name}{p.id === myUid ? ' (vous)' : ''}</span>
                    {voterIds.has(p.id) && (
                      <span className="text-green-500 text-xs font-semibold">a voté</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Après avoir voté */
            <div className="space-y-3">
              {myVoteTargetName && (
                <div className="bg-indigo-900/40 border border-indigo-700 rounded-2xl px-5 py-4 text-center">
                  <p className="text-gray-400 text-xs mb-1">Vous avez désigné</p>
                  <p className="text-white text-xl font-bold">{myVoteTargetName}</p>
                </div>
              )}

              <div className="space-y-2">
                {activePlayers.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3"
                  >
                    <span className="text-white">{p.name}{p.id === myUid ? ' (vous)' : ''}</span>
                    {voterIds.has(p.id) ? (
                      <span className="text-green-500 text-xs font-semibold">a voté ✓</span>
                    ) : (
                      <span className="text-gray-600 text-xs">en attente...</span>
                    )}
                  </div>
                ))}
              </div>

              {isUnanimous && (
                <p className="text-gray-600 text-xs text-center pt-1">
                  Résolution automatique dès que tous ont voté.
                </p>
              )}
            </div>
          )}

          {/* Bouton résoudre — seulement en mode majorité */}
          {isHost && !isUnanimous && (
            <div className="mt-6">
              <Button variant="danger" fullWidth onClick={handleResolveVotes}>
                Résoudre le vote
              </Button>
              <p className="text-gray-600 text-xs text-center mt-2">
                Le joueur avec le plus de votes est éliminé. Égalité = personne éliminé.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Playing screen
  const currentSpeakerName = session.players[currentSpeakerId]?.name ?? '...';

  return (
    <div className="min-h-svh bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs">Tour {session.currentRound}</p>
          <p className="text-white font-bold">{activePlayers.length} joueurs restants</p>
        </div>

        {/* Mot secret — affiché sans label de rôle */}
        {myRole && (
          <div className="text-right">
            <p className="text-gray-500 text-xs mb-0.5">Mon mot</p>
            <p className="text-white font-bold text-sm">
              {myRole.word || '—'}
            </p>
          </div>
        )}
      </div>

      {/* Speaking turn indicator */}
      <div className={`px-6 py-3 ${isMyTurn ? 'bg-indigo-900/40 border-b border-indigo-800' : 'bg-gray-900/50 border-b border-gray-800'}`}>
        {isMyTurn ? (
          <div className="flex items-center gap-3">
            <span className="text-indigo-400 text-xl">▶</span>
            <p className="text-indigo-200 font-semibold">C'est votre tour !</p>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            Tour de <span className="text-gray-300 font-medium">{currentSpeakerName}</span>
          </p>
        )}
      </div>

      {/* Word history */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {session.wordHistory.length === 0 ? (
          <p className="text-gray-700 text-center text-sm mt-8">Aucun mot dit pour l'instant...</p>
        ) : (
          <>
            {session.wordHistory.map((entry, i) => {
              const isMe = entry.playerId === myUid;
              return (
                <div
                  key={i}
                  className={`flex items-baseline gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <span className="text-gray-600 text-xs flex-shrink-0">{entry.playerName}</span>
                  <div className={`px-4 py-2 rounded-2xl text-sm font-medium ${
                    isMe
                      ? 'bg-indigo-700 text-white rounded-tr-sm'
                      : 'bg-gray-800 text-gray-200 rounded-tl-sm'
                  }`}>
                    {entry.word}
                  </div>
                  {entry.round !== session.currentRound && (
                    <span className="text-gray-700 text-xs">T{entry.round}</span>
                  )}
                </div>
              );
            })}
            <div ref={historyBottomRef} />
          </>
        )}
      </div>

      {/* Speaking order pills */}
      <div className="px-6 py-2 border-t border-gray-800 overflow-x-auto">
        <div className="flex gap-2">
          {session.speakingOrder.map((pid, i) => {
            const p = session.players[pid];
            const isCurrent = i === session.currentSpeakerIndex;
            return (
              <div
                key={pid}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                  isCurrent ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {i + 1}. {p?.name ?? pid}
              </div>
            );
          })}
        </div>
      </div>

      {/* Input / controls */}
      <div className="px-6 py-4 border-t border-gray-800 space-y-2">
        {isMyTurn ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={wordInput}
              onChange={e => setWordInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && wordInput.trim()) handleSubmitWord(); }}
              placeholder="Votre mot..."
              className="flex-1 bg-gray-900 border border-gray-700 text-white py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
              disabled={isSubmitting}
              autoFocus
            />
            <Button onClick={handleSubmitWord} disabled={!wordInput.trim() || isSubmitting}>
              Envoyer
            </Button>
          </div>
        ) : (
          <p className="text-gray-600 text-sm text-center py-2">
            En attente de {currentSpeakerName}...
          </p>
        )}

        {isHost && session.currentRound > 2 && (
          <Button variant="danger" fullWidth onClick={handleStartVoting}>
            🗳️ Passer au vote
          </Button>
        )}
      </div>
    </div>
  );
}
