import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RegenerativePlanTree } from '../components/RegenerativePlanTree';
import { useAuditStore } from '../store';

export function PlanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { regenerativePlan, generatePlan, loading } = useAuditStore();

  useEffect(() => {
    if (!regenerativePlan && id) {
      generatePlan(id);
    }
  }, [id, regenerativePlan, generatePlan]);

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '36px 24px 60px',
        backgroundColor: 'var(--wald-forest)',
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto 40px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 600,
            fontSize: '2rem',
            color: 'var(--wald-parchment)',
            margin: '0 0 8px 0',
          }}
        >
          Regenerative Plan
        </h2>
        <div
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '10px',
            color: 'rgba(245,240,232,0.35)',
            letterSpacing: '0.12em',
            marginBottom: '16px',
          }}
        >
          BELIEF REPAIR PATHWAY · {id}
        </div>
        <p
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: '1.05rem',
            color: 'rgba(245,240,232,0.5)',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          A structured remediation pathway derived from Waldconsistency failures,
          organised by epistemic depth from foundational roots to fruitful conclusions.
        </p>
      </div>

      {loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 0',
            fontFamily: '"DM Mono", monospace',
            fontSize: '11px',
            color: 'rgba(245,240,232,0.3)',
            letterSpacing: '0.1em',
          }}
        >
          GENERATING PLAN…
        </div>
      )}

      {!loading && regenerativePlan && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
          {/* Tree visualization */}
          <div
            className="animate-fade-in"
            style={{
              backgroundColor: 'rgba(245,240,232,0.03)',
              border: '1px solid rgba(201,148,10,0.12)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <RegenerativePlanTree plan={regenerativePlan} />
          </div>

          {/* Layer detail cards */}
          {(
            [
              { key: 'fruits' as const, label: 'Fruits', color: '#c9940a', description: 'Reframed conclusions and strengthened theses' },
              { key: 'leaves' as const, label: 'Leaves', color: '#2d7a2d', description: 'Supporting evidence and acknowledgements' },
              { key: 'branches' as const, label: 'Branches', color: '#5a8c3e', description: 'Scoping and normative calibration' },
              { key: 'trunk' as const, label: 'Trunk', color: '#8b6914', description: 'Core causal and uncertainty repairs' },
              { key: 'roots' as const, label: 'Roots', color: '#4a2c0a', description: 'Foundational conceptual and knowledge fixes' },
            ] as const
          ).map((layer) => {
            const items = regenerativePlan.layers[layer.key];
            if (items.length === 0) return null;
            return (
              <div
                key={layer.key}
                className="animate-fade-in"
                style={{
                  width: '100%',
                  maxWidth: '600px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: layer.color,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontWeight: 600,
                      fontSize: '1.15rem',
                      color: layer.color,
                    }}
                  >
                    {layer.label}
                  </div>
                  <div
                    style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '9px',
                      color: 'rgba(245,240,232,0.3)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {layer.description}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '14px 16px',
                        backgroundColor: 'rgba(245,240,232,0.03)',
                        border: '1px solid rgba(245,240,232,0.07)',
                        borderLeft: `3px solid ${layer.color}55`,
                        borderRadius: '6px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          marginBottom: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: '"DM Mono", monospace',
                            fontSize: '9px',
                            color: layer.color,
                            backgroundColor: `${layer.color}18`,
                            padding: '2px 6px',
                            borderRadius: '3px',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {item.failure_level}
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily: '"Cormorant Garamond", serif',
                          fontSize: '0.95rem',
                          color: 'rgba(245,240,232,0.7)',
                          margin: '0 0 8px 0',
                          fontStyle: 'italic',
                        }}
                      >
                        {item.text}
                      </p>
                      <div
                        style={{
                          fontFamily: '"DM Mono", monospace',
                          fontSize: '9px',
                          color: 'rgba(245,240,232,0.4)',
                          letterSpacing: '0.05em',
                          marginBottom: '4px',
                        }}
                      >
                        ACTION
                      </div>
                      <p
                        style={{
                          fontFamily: '"Cormorant Garamond", serif',
                          fontSize: '0.88rem',
                          color: 'rgba(245,240,232,0.55)',
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {item.action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Back button */}
          <button
            onClick={() => navigate(`/audit/${id}/stamp`)}
            style={{
              padding: '10px 24px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(245,240,232,0.2)',
              borderRadius: '6px',
              color: 'rgba(245,240,232,0.5)',
              fontFamily: '"DM Mono", monospace',
              fontSize: '11px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
            }}
          >
            ← BACK TO STAMP
          </button>
        </div>
      )}
    </div>
  );
}
