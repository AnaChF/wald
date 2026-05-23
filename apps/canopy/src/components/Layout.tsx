import { useParams, useNavigate } from 'react-router-dom';
import { SessionSidebar } from './SessionSidebar';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <SessionSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
