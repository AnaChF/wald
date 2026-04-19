import { useEffect, useState } from 'react';

type Stage = 'fact-checker' | '2d-probe' | 'waldconsistency' | 'complete';

interface AuditProgressTrackerProps {
  currentStage: Stage;
}

interface StageConfig {
  id: Stage | 'complete';
  key: Stage;
  title: string;
  subtitle: string;
  icon: string;
}

const STAGES: StageConfig[] = [
  {
    id: 'fact-checker',
    key: 'fact-checker',
    title: 'Fact-Checker',
    subtitle: 'Verifying empirical claims',
    icon: '✓',
  },
  {
    id: '2d-probe',
    key: '2d-probe',
    title: '2D AI Probe',
    subtitle: 'Analysing C-intension vs W-intension',
    icon: '⊙',
  },
  {
    id: 'waldconsistency',
    key: 'waldconsistency',
    title: 'Waldconsistency Engine',
    subtitle: '8-level consistency scoring',
    icon: 'W',
  },
];

const STAGE_ORDER: Stage[] = ['fact-checker', '2d-probe', 'waldconsistency'];

function getStageStatus(stageKey: Stage, currentStage: Stage): 'pending' | 'active' | 'complete' {
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const stageIdx = STAGE_ORDER.indexOf(stageKey);
  if (currentStage === 'complete') return 'complete';
  if (stageIdx < currentIdx) return 'complete';
  if (stageIdx === currentIdx) return 'active';
  return 'pending';
}

function ProgressBar({ active }: { active: boolean }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!active) {
      setWidth(0);
      return;
    }
    setWidth(0);
    const timer = setTimeout(() => setWidth(100), 50);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;
  return (
    <div
      style={{
        height: '3px',
        backgroundColor: 'rgba(201,148,10,0.15)',
        borderRadius: '2px',
        marginTop: '10px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          backgroundColor: 'var(--wald-ochre)',
          borderRadius: '2px',
          transition: 'width 3s linear',
        }}
      />
    </div>
  );
}

function StatusIcon({ status, icon }: { status: 'pending' | 'active' | 'complete'; icon: string }) {
  if (status === 'complete') {
    return (
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'var(--verdict-grounded)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  return (
    <div
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor:
          status === 'active' ? 'rgba(201,148,10,0.2)' : 'rgba(245,240,232,0.08)',
        border: `2px solid ${status === 'active' ? 'var(--wald-ochre)' : 'rgba(245,240,232,0.2)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        animation: status === 'active' ? 'pulse-glow 2s ease-in-out infinite' : 'none',
      }}
    >
      <span
        style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '11px',
          color: status === 'active' ? 'var(--wald-ochre)' : 'rgba(245,240,232,0.3)',
          fontWeight: 500,
        }}
      >
        {icon}
      </span>
    </div>
  );
}

export function AuditProgressTracker({ currentStage }: AuditProgressTrackerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '480px', width: '100%' }}>
      {STAGES.map((stage) => {
        const status = getStageStatus(stage.key, currentStage);
        const isActive = status === 'active';
        const isComplete = status === 'complete';

        return (
          <div
            key={stage.key}
            style={{
              backgroundColor: 'rgba(245,240,232,0.04)',
              borderRadius: '10px',
              border: `1px solid ${isActive ? 'var(--wald-ochre)' : isComplete ? 'rgba(26,92,26,0.4)' : 'rgba(245,240,232,0.08)'}`,
              borderLeft: `3px solid ${isActive ? 'var(--wald-ochre)' : isComplete ? 'var(--verdict-grounded)' : 'rgba(245,240,232,0.12)'}`,
              padding: '14px 16px',
              transition: 'border-color 0.4s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <StatusIcon status={status} icon={stage.icon} />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontWeight: 600,
                    fontSize: '1.05rem',
                    color: isActive
                      ? 'var(--wald-ochre)'
                      : isComplete
                      ? 'var(--verdict-grounded)'
                      : 'rgba(245,240,232,0.4)',
                    marginBottom: '2px',
                  }}
                >
                  {stage.title}
                </div>
                <div
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '11px',
                    color: isActive
                      ? 'rgba(245,240,232,0.7)'
                      : isComplete
                      ? 'rgba(245,240,232,0.5)'
                      : 'rgba(245,240,232,0.25)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {stage.subtitle}
                </div>
              </div>
              {isActive && (
                <div
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '9px',
                    color: 'var(--wald-ochre)',
                    letterSpacing: '0.1em',
                    animation: 'pulse-glow 1.5s ease-in-out infinite',
                  }}
                >
                  RUNNING
                </div>
              )}
              {isComplete && (
                <div
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '9px',
                    color: 'var(--verdict-grounded)',
                    letterSpacing: '0.1em',
                  }}
                >
                  DONE
                </div>
              )}
            </div>
            <ProgressBar active={isActive} />
          </div>
        );
      })}

      {/* Overall status */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '8px',
          fontFamily: '"DM Mono", monospace',
          fontSize: '11px',
          color: currentStage === 'complete' ? 'var(--verdict-grounded)' : 'rgba(245,240,232,0.35)',
          letterSpacing: '0.12em',
        }}
      >
        {currentStage === 'complete' ? 'AUDIT COMPLETE' : 'PROCESSING…'}
      </div>
    </div>
  );
}
