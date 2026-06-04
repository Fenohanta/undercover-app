import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { RoleReveal } from '../ui/RoleReveal';

type SubPhase = 'handoff' | 'reveal';

export function DistributionScreen() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [subPhase, setSubPhase] = useState<SubPhase>('handoff');

  const { players, currentDistributionIndex } = state;
  const currentPlayer = players[currentDistributionIndex];

  if (!currentPlayer) {
    navigate('/game');
    return null;
  }

  function handlePlayerReady() {
    setSubPhase('reveal');
  }

  function handleWordSeen() {
    dispatch({ type: 'CONFIRM_WORD_SEEN' });
    const isLast = currentDistributionIndex >= players.length - 1;
    if (isLast) {
      navigate('/game');
    } else {
      setSubPhase('handoff');
    }
  }

  if (subPhase === 'handoff') {
    return (
      <div className="flex items-center justify-center min-h-svh bg-gray-950">
        <div className="text-center px-6 max-w-sm">
          <div className="text-7xl mb-6">🙈</div>
          <h2 className="text-white text-2xl font-bold mb-2">
            Passez le téléphone à
          </h2>
          <p className="text-indigo-400 text-3xl font-bold mb-4">{currentPlayer.name}</p>
          <p className="text-gray-500 text-sm mb-8">
            Ne regardez pas l'écran pendant le passage.
          </p>
          <div className="text-gray-600 text-sm mb-6">
            Joueur {currentDistributionIndex + 1} / {players.length}
          </div>
          <button
            onClick={handlePlayerReady}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95"
          >
            Je suis {currentPlayer.name} — Continuer
          </button>
        </div>
      </div>
    );
  }

  return <RoleReveal player={currentPlayer} onConfirm={handleWordSeen} />;
}
