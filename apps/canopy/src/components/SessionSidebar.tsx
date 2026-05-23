import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCanopyStore } from '../store';

const STEPS = [
  { step: 1, label: 'Framing', path: '', icon: '○' },
  { step: 2, label: 'Signal Observatory', path: 'signals', icon: '○' },
  { step: 3, label: 'Futures Triangle', path: 'triangle', icon: '○' },
  { step: 4, label: 'Depth Lens', path: 'cla', icon: '○' },
  { step: 5, label: 'Scenario Studio', path: 'scenarios', icon: '○' },
  { step: 6, label: 'Forecast', path: 'forecast', icon: '○' },
];

export function SessionSidebar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, currentStep, signals, scenarios } = useCanopyStore();

  const completionMap: Record<number, boolean> = {
    1: !!session?.foresight_question,
    2: signals.length > 0,
    3: !!session?.audit_result_seed,
    4: !!session?.brick_seed,
    5: scenarios.some((s) => s.consistency_certified),
    6: false,
  };

  return (
    <nav
      className="w-56 shrink-0 flex flex-col py-8 px-4 border-r"
      style={{
        background: 'rgba(10,26,14,0.95)',
        borderColor: 'rgba(45,96,72,0.3)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="mb-8 px-2">
        <h1
          className="text-xl font-cormorant font-light tracking-wide"
          style={{ color: 'var(--parchment-text)' }}
        >
          Canopy™
        </h1>
        {session?.title && (
          <p
            className="mt-1 text-xs font-spectral truncate"
            style={{ color: 'rgba(245,240,232,0.5)' }}
            title={session.title}
          >
            {session.title}
          </p>
        )}
      </div>

      <ol className="flex flex-col gap-1 flex-1">
        {STEPS.map(({ step, label, path }) => {
          const href = id ? `/canopy/session/${id}/${path}` : '#';
          const isActive = id ? location.pathname.includes(`/${path}`) : false;
          const isDone = completionMap[step];

          return (
            <li key={step}>
              <button
                onClick={() => id && navigate(href)}
                disabled={!id}
                className="w-full text-left flex items-center gap-3 px-3 py-2 rounded transition-slow group"
                style={{
                  background: isActive ? 'rgba(45,96,72,0.35)' : 'transparent',
                  color: isActive
                    ? 'var(--parchment-text)'
                    : isDone
                    ? 'rgba(245,240,232,0.65)'
                    : 'rgba(245,240,232,0.38)',
                  cursor: id ? 'pointer' : 'default',
                }}
              >
                <span
                  className="w-5 h-5 flex items-center justify-center rounded-full shrink-0"
                  style={{
                    border: isDone
                      ? '1.5px solid var(--positive)'
                      : isActive
                      ? '1.5px solid rgba(245,240,232,0.7)'
                      : '1.5px solid rgba(245,240,232,0.2)',
                    background: isDone ? 'var(--positive)' : 'transparent',
                  }}
                >
                  {isDone && (
                    <svg viewBox="0 0 10 8" className="w-3 h-3" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                  {!isDone && (
                    <span className="font-mono-dm text-xs" style={{ fontSize: '9px' }}>
                      {step}
                    </span>
                  )}
                </span>
                <span className="text-sm font-spectral">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 px-3 py-3 rounded" style={{ background: 'rgba(45,96,72,0.1)' }}>
        <p className="text-xs font-mono-dm" style={{ color: 'rgba(245,240,232,0.3)', fontSize: '10px' }}>
          Wald™ ecosystem
        </p>
      </div>
    </nav>
  );
}
