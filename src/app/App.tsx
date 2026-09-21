import { Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { AccountPage } from '../pages/AccountPage';
import { DashboardPage } from '../pages/DashboardPage';
import { GameDetailPage } from '../pages/GameDetailPage';
import { GamesPage } from '../pages/GamesPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { NewGamePage } from '../pages/NewGamePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { TrackerPage } from '../pages/TrackerPage';

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/new" element={<NewGamePage />} />
        <Route path="/games/:gameId" element={<GameDetailPage />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
