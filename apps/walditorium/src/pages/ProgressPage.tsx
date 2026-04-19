import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuditProgressTracker } from '../components/AuditProgressTracker';
import { useAuditStore } from '../store';

type TrackerStage = 'fact-checker' | '2d-probe' | 'waldconsistency' | 'complete';

const STAGE_SEQUENCE: TrackerStage[] = ['fact-checker', '2d-probe', 'waldconsistency', 'complete'];

export function ProgressPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { runAudit } = useAuditStore();
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    // Kick off audit run (will use mock on failure)
    runAudit(id);

    // Advance stages every 2 seconds
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => setStageIndex(1), 2000),   // → 2d-probe
      setTimeout(() => setStageIndex(2), 4000),   // → waldconsistency
      setTimeout(() => setStageIndex(3), 6000),   // → complete
      setTimeout(() => navigate(`/audit/${id}/stamp`), 7200)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const currentStage = STAGE_SEQUENCE[stageIndex];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        backgroundColor: 'var(--wald-forest)',
      }}
    >
      {/* Title */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h2
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 600,
            fontSize: '1.8rem',
            color: 'var(--wald-parchment)',
            margin: '0 0 8px 0',
          }}
        >
          Running Audit
        </h2>
        <div
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '10px',
            color: 'rgba(245,240,232,0.3)',
            letterSpacing: '0.12em',
          }}
        >
          {id}
        </div>
      </div>

      <AuditProgressTracker currentStage={currentStage} />

      {/* Animated dots */}
      {currentStage !== 'complete' && (
        <div
          style={{
            marginTop: '32px',
            display: 'flex',
            gap: '6px',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--wald-ochre)',
                animation: `pulse-glow 1.4s ease-in-out ${i * 0.22}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {currentStage === 'complete' && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: '32px',
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1.1rem',
            color: 'var(--verdict-grounded)',
            letterSpacing: '0.06em',
          }}
        >
          Audit complete. Generating stamp…
        </div>
      )}
    </div>
  );
}
