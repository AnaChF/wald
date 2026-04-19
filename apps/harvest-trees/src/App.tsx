import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DomainsPage from './pages/DomainsPage';
import TreesPage from './pages/TreesPage';
import TreeEditorPage from './pages/TreeEditorPage';
import ReportPage from './pages/ReportPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DomainsPage />} />
          <Route path="/trees" element={<TreesPage />} />
          <Route path="/tree/:id" element={<TreeEditorPage />} />
          <Route path="/tree/:id/report" element={<ReportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
