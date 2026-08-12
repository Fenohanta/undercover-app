import { useNavigate } from 'react-router-dom';

export function NewGameScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-gray-950 px-6 text-center">
      <div className="mb-10">
        <button onClick={() => navigate('/')} className="text-gray-400 text-2xl absolute top-6 left-6">←</button>
        <div className="text-7xl mb-4">🕵️</div>
        <h1 className="text-white text-3xl font-bold mb-2">Nouvelle Partie</h1>
        <p className="text-gray-500 text-sm">Choisissez votre mode de jeu</p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={() => navigate('/setup')}
          className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 rounded-2xl p-6 text-left transition-all active:scale-95"
        >
          <div className="text-3xl mb-2">📱</div>
          <p className="text-white font-bold text-lg">En local</p>
          <p className="text-gray-500 text-sm mt-1">Pass &amp; Play · Un seul appareil</p>
        </button>

        <button
          onClick={() => navigate('/online/host')}
          className="w-full bg-gray-900 hover:bg-gray-800 border border-indigo-700 hover:border-indigo-500 rounded-2xl p-6 text-left transition-all active:scale-95"
        >
          <div className="text-3xl mb-2">🌐</div>
          <p className="text-white font-bold text-lg">En ligne</p>
          <p className="text-gray-500 text-sm mt-1">Multi-appareils · Code de session à 6 chiffres</p>
        </button>
      </div>
    </div>
  );
}
