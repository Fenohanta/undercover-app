import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { HomeScreen } from './components/screens/HomeScreen';
import { NewGameScreen } from './components/screens/NewGameScreen';
import { SetupScreen } from './components/screens/SetupScreen';
import { DistributionScreen } from './components/screens/DistributionScreen';
import { GameScreen } from './components/screens/GameScreen';
import { ResultsScreen } from './components/screens/ResultsScreen';
import { OnlineHostScreen } from './components/screens/OnlineHostScreen';
import { JoinScreen } from './components/screens/JoinScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { OnlineGameScreen } from './components/screens/OnlineGameScreen';

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/new-game" element={<NewGameScreen />} />
          <Route path="/setup" element={<SetupScreen />} />
          <Route path="/distribution" element={<DistributionScreen />} />
          <Route path="/game" element={<GameScreen />} />
          <Route path="/results" element={<ResultsScreen />} />
          <Route path="/online/host" element={<OnlineHostScreen />} />
          <Route path="/join" element={<JoinScreen />} />
          <Route path="/online/lobby/:sessionId" element={<LobbyScreen />} />
          <Route path="/online/game/:sessionId" element={<OnlineGameScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GameProvider>
    </BrowserRouter>
  );
}
