import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';

const winnerConfig = {
  civils:      { emoji: '🏡', label: 'Les Civils gagnent !',      color: 'text-blue-400' },
  undercovers: { emoji: '🕵️', label: 'Les Undercovers gagnent !', color: 'text-red-400' },
  mrwhite:     { emoji: '⬜', label: 'Mr. White gagne !',          color: 'text-gray-200' },
};

const roleLabel = {
  civil:      { label: 'Civil',      color: 'text-blue-400' },
  undercover: { label: 'Undercover', color: 'text-red-400' },
  mrwhite:    { label: 'Mr. White',  color: 'text-gray-300' },
};

export function ResultsScreen() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { winner, players, selectedWordPair } = state;

  const config = winner ? winnerConfig[winner] : winnerConfig.civils;

  function handleRestart() {
    dispatch({ type: 'RESET_GAME' });
    navigate('/');
  }

  return (
    <div className="min-h-svh bg-gray-950 px-6 py-8">
      <div className="max-w-sm mx-auto text-center">
        <div className="text-8xl mb-4">{config.emoji}</div>
        <h1 className={`text-3xl font-bold mb-2 ${config.color}`}>{config.label}</h1>

        {selectedWordPair && (
          <div className="bg-gray-900 rounded-2xl p-4 mb-6 text-left">
            <p className="text-gray-400 text-sm mb-2">Les mots de cette partie :</p>
            <p className="text-white">
              <span className="text-blue-400 font-medium">Civils :</span> {selectedWordPair.civil}
            </p>
            <p className="text-white">
              <span className="text-red-400 font-medium">Undercovers :</span> {selectedWordPair.undercover}
            </p>
          </div>
        )}

        <h2 className="text-gray-300 font-semibold mb-3 text-left">Révélation des rôles</h2>
        <div className="space-y-2 mb-8">
          {players.map(player => {
            const { label, color } = roleLabel[player.role];
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between bg-gray-900 rounded-2xl px-4 py-3 ${
                  player.isEliminated ? 'opacity-50' : ''
                }`}
              >
                <span className="text-white font-medium">
                  {player.name}
                  {player.isEliminated && <span className="text-gray-600 text-sm ml-2">(éliminé)</span>}
                </span>
                <div className="text-right">
                  <span className={`font-semibold text-sm ${color}`}>{label}</span>
                  {player.word && (
                    <p className="text-gray-500 text-xs">"{player.word}"</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Button size="lg" fullWidth onClick={handleRestart}>
          🏠 Nouvelle Partie
        </Button>
      </div>
    </div>
  );
}
