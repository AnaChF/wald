import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { WaldenWoodsPage } from './pages/WaldenWoodsPage';
import { TerritoriesPage } from './pages/TerritoriesPage';
import { CardDeckPage } from './pages/CardDeckPage';
import { CharacterPage } from './pages/CharacterPage';
import { TrainStationPage } from './pages/TrainStationPage';
import { PWTCPage } from './pages/PWTCPage';
import { ForumPage } from './pages/ForumPage';
import { JourneyPage } from './pages/JourneyPage';
import { useStore } from './store';
import type { Zone } from './types';

function AppRoutes() {
  const location = useLocation();
  const { currentTerritory } = useStore();

  const isHome = location.pathname === '/';
  const zone: Zone | 'walden' = currentTerritory?.zone ?? 'walden';

  if (isHome) {
    return <WaldenWoodsPage />;
  }

  return (
    <Layout zone={zone}>
      <Routes>
        <Route path="/territories" element={<TerritoriesPage />} />
        <Route path="/territory/:id/cards" element={<CardDeckPage />} />
        <Route path="/character" element={<CharacterPage />} />
        <Route path="/station/:territory_id" element={<TrainStationPage />} />
        <Route path="/pwtc" element={<PWTCPage />} />
        <Route path="/forum/:territory_id" element={<ForumPage />} />
        <Route path="/journey" element={<JourneyPage />} />
      </Routes>
    </Layout>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WaldenWoodsPage />} />
        <Route path="/*" element={<AppWithLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

function AppWithLayout() {
  const { currentTerritory } = useStore();
  const zone: Zone | 'walden' = currentTerritory?.zone ?? 'walden';

  return (
    <Layout zone={zone}>
      <Routes>
        <Route path="/territories" element={<TerritoriesPage />} />
        <Route path="/territory/:id/cards" element={<CardDeckPage />} />
        <Route path="/character" element={<CharacterPage />} />
        <Route path="/station/:territory_id" element={<TrainStationPage />} />
        <Route path="/pwtc" element={<PWTCPage />} />
        <Route path="/forum/:territory_id" element={<ForumPage />} />
        <Route path="/journey" element={<JourneyPage />} />
      </Routes>
    </Layout>
  );
}
