import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SessionsListPage } from './pages/SessionsListPage';
import { SessionFramingPage } from './pages/SessionFramingPage';
import { SignalObservatoryPage } from './pages/SignalObservatoryPage';
import { FuturesTrianglePage } from './pages/FuturesTrianglePage';
import { DepthLensPage } from './pages/DepthLensPage';
import { ScenarioStudioPage } from './pages/ScenarioStudioPage';
import { ForecastPage } from './pages/ForecastPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/canopy" replace />} />
        <Route path="/canopy" element={<SessionsListPage />} />
        <Route path="/canopy/session/new" element={<SessionFramingPage />} />
        <Route
          path="/canopy/session/:id/*"
          element={
            <Layout>
              <Routes>
                <Route path="signals" element={<SignalObservatoryPage />} />
                <Route path="triangle" element={<FuturesTrianglePage />} />
                <Route path="cla" element={<DepthLensPage />} />
                <Route path="scenarios" element={<ScenarioStudioPage />} />
                <Route path="forecast" element={<ForecastPage />} />
                <Route path="*" element={<Navigate to="signals" replace />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
