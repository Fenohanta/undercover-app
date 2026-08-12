import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

export function HomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-gray-950 px-6 text-center">
      <div className="mb-12">
        <div className="text-8xl mb-6">🕵️</div>
        <h1 className="text-white text-5xl font-bold tracking-tight mb-3">Undercover</h1>
        <p className="text-gray-400 text-lg max-w-xs mx-auto">
          Le jeu de déduction sociale. Trouvez qui est l'imposteur.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <Button size="lg" fullWidth onClick={() => navigate('/new-game')}>
          Nouvelle Partie
        </Button>

        <Button size="lg" fullWidth variant="secondary" onClick={() => navigate('/join')}>
          Rejoindre une partie
        </Button>

        <div className="text-gray-600 text-sm mt-6 space-y-1">
          <p>3 à 12 joueurs · Local &amp; En ligne</p>
          <p className="mt-2 text-gray-700">v{__APP_VERSION__}</p>
        </div>
      </div>
    </div>
  );
}
