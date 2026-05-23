import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { SessionSidebar } from './SessionSidebar';
import { useCanopyStore } from '../store';
import { getSession, getSignals, getScenarios, getForecast } from '../api';

export function Layout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { session, setSession, setSignals, setScenarios, setForecast, setTriangle, setCLA } = useCanopyStore();
  const [hydrating, setHydrating] = useState(false);

  useEffect(() => {
    if (!id || session?.id === id) return;
    const shareToken = new URLSearchParams(location.search).get('share_token') ?? undefined;
    setHydrating(true);
    Promise.all([
      getSession(id, shareToken),
      getSignals(id, shareToken),
      getScenarios(id, shareToken),
      getForecast(id, shareToken).catch(() => null),
    ])
      .then(([sess, sigs, scens, fore]) => {
        setSession(sess);
        setSignals(sigs);
        setScenarios(scens);
        if (fore) setForecast(fore);
        const triangle = sess.audit_result_seed?.futures_triangle;
        if (triangle) setTriangle(triangle);
        const cla = sess.brick_seed;
        if (cla?.litany) setCLA(cla);
      })
      .catch((err) => console.error('Session hydration failed:', err))
      .finally(() => setHydrating(false));
  }, [id, location.search]);

  if (hydrating) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: 'var(--bg-primary)' }}
      >
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
          Loading session…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <SessionSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
