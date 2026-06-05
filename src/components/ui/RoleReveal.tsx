import { useState, useEffect } from 'react';
import type { Player } from '../../types/game';
import { Button } from './Button';

interface RoleRevealProps {
  player: Player;
  onConfirm: () => void;
}

const COUNTDOWN_SECONDS = 5;

const roleLabels = {
  civil:      { label: 'Civil',      color: 'text-blue-400',  emoji: '🏡' },
  undercover: { label: 'Undercover', color: 'text-red-400',   emoji: '🕵️' },
  mrwhite:    { label: 'Mr. White',  color: 'text-gray-300',  emoji: '⬜' },
};

export function RoleReveal({ player, onConfirm }: RoleRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (!isRevealed || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [isRevealed, countdown]);

  const { label, color, emoji } = roleLabels[player.role];

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-gray-950 px-6 text-center">
      <h2 className="text-white text-2xl font-bold mb-2">{player.name}</h2>
      <p className="text-gray-400 mb-8 text-sm">
        Assurez-vous que les autres ne voient pas l'écran.
      </p>

      {!isRevealed ? (
        <Button size="lg" onClick={() => setIsRevealed(true)}>
          👁 Révéler mon rôle
        </Button>
      ) : (
        <div className="w-full max-w-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 mb-6">
            {player.role === 'mrwhite' && (
              <p className={`text-xl font-semibold mb-4 ${color}`}>
                {emoji} {label}
              </p>
            )}
            {player.word ? (
              <p className="text-white text-4xl font-bold tracking-wide">{player.word}</p>
            ) : (
              <p className="text-gray-500 text-lg italic">Vous ne connaissez pas le mot.</p>
            )}
          </div>
          <Button
            fullWidth
            size="lg"
            variant={countdown > 0 ? 'secondary' : 'primary'}
            disabled={countdown > 0}
            onClick={onConfirm}
            className={countdown === 0 ? 'bg-green-600 hover:bg-green-500' : ''}
          >
            {countdown > 0
              ? `J'ai mémorisé (${countdown}s)`
              : "✅ J'ai mémorisé — Passer le téléphone"}
          </Button>
        </div>
      )}
    </div>
  );
}
