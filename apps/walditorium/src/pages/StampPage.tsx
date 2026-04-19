import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WalditoriumStamp } from '../components/WalditoriumStamp';
import { useAuditStore } from '../store';
import type { WaldconsistencyLevel } from '../types';

const LEVEL_ORDER: WaldconsistencyLevel[] = ['CE', 'CY', 'CS', 'L', 'S', 'CN', 'K', 'CR'];

const LEVEL_NAMES: Record<WaldconsistencyLevel, string> = {
  CE: 'Conceptual Extension',
  CY: 'Causal Yield',
  CS: 'Counterfactual Stability',
  L: 'Logical Entailment',
  S: 'Scope Consistency',
  CN: 'Contextual Normativity',
  K: 'Knowledge Grounding',
  CR: 'Coherence Resistance',
};

function getSeverityColor(severity: 'critical' | 'moderate' | 'minor') {
  if (severity === 'critical') return 'var(--verdict-ungrounded)';
  if (severity === 'moderate') return 'var(--wald-amber)';
  return '#5a8c3e';
}

function getVerdictColor(verdict: string) {
  switch (verdict) {
    case 'GROUNDED': return 'var(--verdict-grounded)';
    case 'CONDITIONAL': return 'var(--verdict-conditional)';
    case 'CONTESTED': return 'var(--verdict-contested)';
    case 'UNGROUNDED': return 'var(--verdict-ungrounded)';
    default: return 'var(--wald-parchment)';
  }
}

export function StampPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSession, loadSession } = useAuditStore();

  useEffect(() => {
    if (!currentSession && id) {
      loadSession(id);
    }
  }, [id, currentSession, loadSession]);

  if (!currentSession || !currentSession.audit_result) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(245,240,232,0.4)',
          fontFamily: '"DM Mono", monospace',
          fontSize: '12px',
          letterSpacing: '0.1em',
        }}
      >
        LOADING STAMP…
      </div>
    );
  }

  const result = currentSession.audit_result;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '36px 24px 60px',
        backgroundColor: 'var(--wald-forest)',
      }}
    >
      {/* Title */}
      <h2
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontWeight: 600,
          fontSize: '1.6rem',
          color: 'var(--wald-parchment)',
          margin: '0 0 6px 0',
          textAlign: 'center',
        }}
      >
        Audit Stamp
      </h2>
      <div
        style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '10px',
          color: 'rgba(245,240,232,0.3)',
          letterSpacing: '0.12em',
          marginBottom: '32px',
        }}
      >
        {currentSession.id}
      </div>

      {/* Stamp */}
      <div className="animate-stamp">
        <WalditoriumStamp auditResult={result} size={380} animated={false} />
      </div>

      {/* Verdict badge */}
      <div
        style={{
          marginTop: '24px',
          padding: '8px 24px',
          border: `1px solid ${getVerdictColor(result.verdict)}`,
          borderRadius: '4px',
          fontFamily: '"Cormorant Garamond", serif',
          fontWeight: 600,
          fontSize: '1.3rem',
          color: getVerdictColor(result.verdict),
          letterSpacing: '0.12em',
        }}
      >
        {result.verdict}
      </div>

      {/* Scores */}
      <div
        style={{
          marginTop: '24px',
          display: 'flex',
          gap: '32px',
          alignItems: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '28px',
              fontWeight: 500,
              color: 'var(--wald-ochre)',
              lineHeight: 1,
            }}
          >
            {result.cl_score}
          </div>
          <div
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '9px',
              color: 'rgba(245,240,232,0.4)',
              letterSpacing: '0.1em',
              marginTop: '4px',
            }}
          >
            CL SCORE
          </div>
        </div>
        <div style={{ width: '1px', height: '40px', backgroundColor: 'rgba(245,240,232,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '28px',
              fontWeight: 500,
              color: 'rgba(245,240,232,0.7)',
              lineHeight: 1,
            }}
          >
            {result.sci_score}
          </div>
          <div
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '9px',
              color: 'rgba(245,240,232,0.4)',
              letterSpacing: '0.1em',
              marginTop: '4px',
            }}
          >
            SCI SCORE
          </div>
        </div>
      </div>

      {/* Waldconsistency scores */}
      <div
        style={{
          marginTop: '28px',
          width: '100%',
          maxWidth: '480px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
        }}
      >
        {LEVEL_ORDER.map((level) => {
          const score = result.waldconsistency[level];
          const isLow = score < 60;
          return (
            <div
              key={level}
              style={{
                backgroundColor: 'rgba(245,240,232,0.03)',
                border: `1px solid ${isLow ? 'rgba(212,130,10,0.3)' : 'rgba(245,240,232,0.08)'}`,
                borderRadius: '6px',
                padding: '10px 8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '20px',
                  fontWeight: 500,
                  color: isLow ? 'var(--wald-amber)' : 'var(--wald-parchment)',
                  lineHeight: 1,
                }}
              >
                {score}
              </div>
              <div
                style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '9px',
                  color: 'rgba(245,240,232,0.4)',
                  letterSpacing: '0.08em',
                  marginTop: '4px',
                }}
              >
                {level}
              </div>
            </div>
          );
        })}
      </div>

      {/* Failures */}
      {result.failures.length > 0 && (
        <div
          style={{
            marginTop: '28px',
            width: '100%',
            maxWidth: '480px',
          }}
        >
          <div
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '10px',
              color: 'rgba(245,240,232,0.35)',
              letterSpacing: '0.12em',
              marginBottom: '12px',
            }}
          >
            FAILURES & FLAGS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.failures.map((failure, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'rgba(245,240,232,0.03)',
                  border: `1px solid ${getSeverityColor(failure.severity)}33`,
                  borderLeft: `3px solid ${getSeverityColor(failure.severity)}`,
                  borderRadius: '6px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    marginBottom: '5px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '9px',
                      color: getSeverityColor(failure.severity),
                      letterSpacing: '0.08em',
                    }}
                  >
                    {failure.level} · {failure.severity.toUpperCase()}
                  </span>
                  {failure.bolt_id && (
                    <span
                      style={{
                        fontFamily: '"DM Mono", monospace',
                        fontSize: '9px',
                        color: 'rgba(245,240,232,0.25)',
                      }}
                    >
                      {failure.bolt_id}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '0.9rem',
                    color: 'rgba(245,240,232,0.7)',
                    margin: 0,
                    lineHeight: 1.45,
                  }}
                >
                  {failure.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waldconsistency level names */}
      <div
        style={{
          marginTop: '24px',
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {LEVEL_ORDER.map((level) => (
          <div
            key={level}
            style={{
              display: 'flex',
              gap: '10px',
              fontFamily: '"DM Mono", monospace',
              fontSize: '10px',
            }}
          >
            <span style={{ color: 'var(--wald-ochre)', width: '28px', flexShrink: 0 }}>{level}</span>
            <span style={{ color: 'rgba(245,240,232,0.35)' }}>{LEVEL_NAMES[level]}</span>
          </div>
        ))}
      </div>

      {/* Generate Plan button */}
      <button
        onClick={() => navigate(`/audit/${id}/plan`)}
        style={{
          marginTop: '36px',
          padding: '14px 36px',
          backgroundColor: 'transparent',
          border: '1px solid var(--wald-ochre)',
          borderRadius: '6px',
          color: 'var(--wald-ochre)',
          fontFamily: '"Cormorant Garamond", serif',
          fontWeight: 600,
          fontSize: '1.1rem',
          letterSpacing: '0.06em',
          cursor: 'pointer',
          transition: 'background-color 0.2s, color 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--wald-ochre)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--wald-forest)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--wald-ochre)';
        }}
      >
        Generate Regenerative Plan →
      </button>
    </div>
  );
}
