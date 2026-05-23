import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserSessions } from '../api';
import type { CanopySession } from '../types';

export function SessionsListPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<CanopySession[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('wald_user_id') ?? '';

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    getUserSessions(userId)
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 py-16"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="w-full max-w-2xl">
        <h1
          className="font-cormorant font-light text-5xl mb-2"
          style={{ color: 'var(--parchment-text)' }}
        >
          Canopy™
        </h1>
        <p
          className="font-spectral text-base mb-12"
          style={{ color: 'rgba(245,240,232,0.45)' }}
        >
          Strategic foresight. Third instrument of the Wald™ ecosystem.
        </p>

        <button
          onClick={() => navigate('/canopy/session/new')}
          className="w-full py-5 rounded-lg font-cormorant text-xl font-light mb-10 transition-slow"
          style={{
            background: 'rgba(45,96,72,0.2)',
            border: '1px solid rgba(45,96,72,0.5)',
            color: 'var(--parchment-text)',
          }}
        >
          Begin a new foresight session
        </button>

        {loading ? (
          <p className="font-mono-dm text-sm" style={{ color: 'rgba(245,240,232,0.3)' }}>
            Loading sessions…
          </p>
        ) : sessions.length > 0 ? (
          <div className="flex flex-col gap-3">
            <h2
              className="font-mono-dm text-xs mb-2"
              style={{ color: 'rgba(245,240,232,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            >
              Previous sessions
            </h2>
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/canopy/session/${s.id}/signals`)}
                className="w-full text-left px-5 py-4 rounded-lg transition-slow"
                style={{
                  background: 'rgba(245,240,232,0.04)',
                  border: '1px solid rgba(245,240,232,0.1)',
                  color: 'var(--parchment-text)',
                }}
              >
                <p className="font-cormorant text-lg font-light">
                  {s.title || 'Untitled session'}
                </p>
                {s.foresight_question && (
                  <p
                    className="font-spectral text-sm mt-1 truncate"
                    style={{ color: 'rgba(245,240,232,0.45)' }}
                  >
                    {s.foresight_question}
                  </p>
                )}
                <p className="font-mono-dm mt-2" style={{ fontSize: 10, color: 'rgba(245,240,232,0.25)' }}>
                  {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' '}· {s.status}
                </p>
              </button>
            ))}
          </div>
        ) : (
          !loading && userId && (
            <p className="font-spectral text-sm" style={{ color: 'rgba(245,240,232,0.3)' }}>
              No sessions yet.
            </p>
          )
        )}

        {!userId && (
          <p className="font-spectral text-sm" style={{ color: 'rgba(245,240,232,0.35)' }}>
            Sign in to your Wald account to begin.
          </p>
        )}
      </div>

      <footer
        className="mt-20 font-mono-dm text-center"
        style={{ fontSize: 10, color: 'rgba(245,240,232,0.18)' }}
      >
        Canopy™ · Part of the Wald™ ecosystem · CC BY-NC-SA 4.0 INTL
      </footer>
    </div>
  );
}
