import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { HomeScreen } from './components/screens/HomeScreen';
import { SetupScreen } from './components/screens/SetupScreen';
import { DistributionScreen } from './components/screens/DistributionScreen';
import { GameScreen } from './components/screens/GameScreen';
import { ResultsScreen } from './components/screens/ResultsScreen';

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/setup" element={<SetupScreen />} />
          <Route path="/distribution" element={<DistributionScreen />} />
          <Route path="/game" element={<GameScreen />} />
          <Route path="/results" element={<ResultsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GameProvider>
    </BrowserRouter>
  );
}
