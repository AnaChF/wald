import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SubmitPage } from './pages/SubmitPage';
import { AnatomyPage } from './pages/AnatomyPage';
import { ProgressPage } from './pages/ProgressPage';
import { StampPage } from './pages/StampPage';
import { PlanPage } from './pages/PlanPage';
import { StampsPage } from './pages/StampsPage';

export function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<SubmitPage />} />
          <Route path="/audit/:id/anatomy" element={<AnatomyPage />} />
          <Route path="/audit/:id/running" element={<ProgressPage />} />
          <Route path="/audit/:id/stamp" element={<StampPage />} />
          <Route path="/audit/:id/plan" element={<PlanPage />} />
          <Route path="/stamps" element={<StampsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
