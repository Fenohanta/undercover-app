import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { checkMrWhiteGuess } from '../../utils/gameLogic';
import { Button } from '../ui/Button';

type GamePhase = 'speaking' | 'voting' | 'mrwhite-guess';

export function GameScreen() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [localPhase, setLocalPhase] = useState<GamePhase>('speaking');
  const [pendingElimination, setPendingElimination] = useState<number | null>(null);
  const [mrWhiteGuess, setMrWhiteGuess] = useState('');
  const [mrWhiteResult, setMrWhiteResult] = useState<'win' | 'lose' | null>(null);

  const { players, speakingOrder, currentRound, selectedWordPair } = state;
  const activePlayers = players.filter(p => !p.isEliminated);

  if (state.phase === 'results') {
    navigate('/results');
    return null;
  }

  // Mr. White vient d'être éliminé → lui donner sa chance de deviner
  if (state.phase === 'voting' && localPhase !== 'mrwhite-guess') {
    setLocalPhase('mrwhite-guess');
  }

  function handleVoteClick(playerId: number) {
    setPendingElimination(playerId);
  }

  function handleConfirmElimination() {
    if (pendingElimination === null) return;
    dispatch({ type: 'ELIMINATE_PLAYER', payload: { playerId: pendingElimination } });
    setPendingElimination(null);
    setLocalPhase('speaking');
  }

  function handleMrWhiteGuess() {
    const civilWord = selectedWordPair?.civil ?? '';
    if (checkMrWhiteGuess(mrWhiteGuess, civilWord)) {
      setMrWhiteResult('win');
      setTimeout(() => {
        dispatch({ type: 'MRWHITE_GUESS_SUCCESS' });
        navigate('/results');
      }, 1500);
    } else {
      setMrWhiteResult('lose');
      setTimeout(() => {
        // Mr. White a perdu sa chance — vérifier la condition de victoire normale
        const updatedPlayers = players.map(p =>
          p.role === 'mrwhite' ? { ...p, isEliminated: true } : p
        );
        const activeCivils = updatedPlayers.filter(p => !p.isEliminated && p.role === 'civil').length;
        const activeUndercovers = updatedPlayers.filter(p => !p.isEliminated && p.role === 'undercover').length;
        if (activeUndercovers >= activeCivils) {
          dispatch({ type: 'ELIMINATE_PLAYER', payload: { playerId: players.find(p => p.role === 'mrwhite')!.id } });
        } else {
          dispatch({ type: 'START_ROUND' });
          setLocalPhase('speaking');
        }
        setMrWhiteResult(null);
        setMrWhiteGuess('');
      }, 2000);
    }
  }

  // Écran de devinette Mr. White
  if (localPhase === 'mrwhite-guess') {
    const mrWhitePlayer = players.find(p => p.role === 'mrwhite');
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-gray-950 px-6 text-center">
        <div className="text-6xl mb-6">⬜</div>
        <h2 className="text-white text-2xl font-bold mb-2">Mr. White est éliminé !</h2>
        <p className="text-gray-400 mb-8">
          {mrWhitePlayer?.name}, vous avez une chance de gagner.<br />
          Devinez le mot des civils.
        </p>
        {mrWhiteResult === 'win' && (
          <p className="text-green-400 text-xl font-bold mb-4">🎉 Bonne réponse ! Mr. White gagne !</p>
        )}
        {mrWhiteResult === 'lose' && (
          <p className="text-red-400 text-xl font-bold mb-4">❌ Mauvaise réponse !</p>
        )}
        {mrWhiteResult === null && (
          <div className="w-full max-w-sm space-y-4">
            <input
              type="text"
              value={mrWhiteGuess}
              onChange={e => setMrWhiteGuess(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleMrWhiteGuess(); }}
              placeholder="Votre réponse…"
              className="w-full bg-gray-800 text-white py-3 px-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button fullWidth onClick={handleMrWhiteGuess} disabled={!mrWhiteGuess.trim()}>
              Valider ma réponse
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Écran de vote
  if (localPhase === 'voting') {
    return (
      <div className="min-h-svh bg-gray-950 px-6 py-8">
        <div className="max-w-sm mx-auto">
          <h2 className="text-white text-2xl font-bold mb-2 text-center">Vote</h2>
          <p className="text-gray-400 text-center mb-6">Qui éliminez-vous ?</p>

          {pendingElimination !== null ? (
            <div className="bg-gray-900 rounded-2xl p-6 text-center space-y-4">
              <p className="text-white text-lg">
                Éliminer{' '}
                <span className="text-red-400 font-bold">
                  {players.find(p => p.id === pendingElimination)?.name}
                </span>{' '}?
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" fullWidth onClick={() => setPendingElimination(null)}>
                  Annuler
                </Button>
                <Button variant="danger" fullWidth onClick={handleConfirmElimination}>
                  Confirmer
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {activePlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => handleVoteClick(player.id)}
                  className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white font-medium py-4 px-6 rounded-2xl text-left transition-all active:scale-95"
                >
                  {player.name}
                </button>
              ))}
              <Button variant="ghost" fullWidth onClick={() => setLocalPhase('speaking')}>
                Revenir au jeu
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Écran de parole
  return (
    <div className="min-h-svh bg-gray-950 px-6 py-8">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-bold">Manche {currentRound}</h2>
          <span className="text-gray-500 text-sm">{activePlayers.length} joueurs restants</span>
        </div>

        <p className="text-gray-400 mb-4">Ordre de parole :</p>
        <div className="space-y-2 mb-8">
          {speakingOrder.map((playerId, index) => {
            const player = players.find(p => p.id === playerId);
            if (!player) return null;
            return (
              <div
                key={playerId}
                className="flex items-center gap-4 bg-gray-900 rounded-2xl px-4 py-3"
              >
                <span className="text-indigo-400 font-bold text-lg w-6">{index + 1}</span>
                <span className="text-white font-medium">{player.name}</span>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <Button fullWidth variant="danger" onClick={() => setLocalPhase('voting')}>
            🗳️ Passer au vote
          </Button>
          <Button fullWidth variant="ghost" onClick={() => dispatch({ type: 'START_ROUND' })}>
            🔄 Nouvelle manche
          </Button>
        </div>
      </div>
    </div>
  );
}
