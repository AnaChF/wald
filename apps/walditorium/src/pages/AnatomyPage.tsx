import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BeliefAnatomyGraph } from '../components/BeliefAnatomyGraph';
import { useAuditStore } from '../store';
import type { BOLT } from '../types';

export function AnatomyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSession, loadSession, runAudit, loading } = useAuditStore();
  const [expandedBolts, setExpandedBolts] = useState<Set<string>>(new Set());
  const [selectedBolt, setSelectedBolt] = useState<BOLT | null>(null);

  useEffect(() => {
    if (!currentSession && id) {
      loadSession(id);
    }
  }, [id, currentSession, loadSession]);

  async function handleRunAudit() {
    if (!id) return;
    await runAudit(id);
    navigate(`/audit/${id}/running`);
  }

  function toggleBolt(boltId: string) {
    setExpandedBolts((prev) => {
      const next = new Set(prev);
      if (next.has(boltId)) next.delete(boltId);
      else next.add(boltId);
      return next;
    });
  }

  if (!currentSession) {
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
        LOADING SESSION…
      </div>
    );
  }

  const { bolts, nuts, bricks } = currentSession;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '20px 28px 16px',
          borderBottom: '1px solid rgba(201,148,10,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontWeight: 600,
              fontSize: '1.5rem',
              color: 'var(--wald-parchment)',
              margin: '0 0 4px 0',
            }}
          >
            Belief Anatomy
          </h2>
          <div
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '10px',
              color: 'rgba(245,240,232,0.35)',
              letterSpacing: '0.1em',
            }}
          >
            {bolts.length} BOLTS · {nuts.length} NUTS · {bricks.length} BRICKS
          </div>
        </div>
        <button
          onClick={handleRunAudit}
          disabled={loading}
          style={{
            padding: '10px 22px',
            backgroundColor: 'var(--wald-ochre)',
            color: 'var(--wald-forest)',
            border: 'none',
            borderRadius: '6px',
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          Run Full Audit →
        </button>
      </div>

      {/* Content split */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: BOLT accordion */}
        <div
          style={{
            width: '40%',
            minWidth: '280px',
            overflowY: 'auto',
            borderRight: '1px solid rgba(201,148,10,0.1)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {bolts.map((bolt) => {
            const boltNuts = nuts.filter((n) => n.bolt_id === bolt.id);
            const boltBricks = bricks.filter((b) => b.bolt_id === bolt.id);
            const isExpanded = expandedBolts.has(bolt.id);
            const isSelected = selectedBolt?.id === bolt.id;

            return (
              <div
                key={bolt.id}
                style={{
                  backgroundColor: isSelected ? 'rgba(201,148,10,0.08)' : 'rgba(245,240,232,0.03)',
                  border: `1px solid ${isSelected ? 'rgba(201,148,10,0.35)' : 'rgba(245,240,232,0.08)'}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                <button
                  onClick={() => {
                    toggleBolt(bolt.id);
                    setSelectedBolt(isSelected ? null : bolt);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 14px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '9px',
                      color: 'var(--wald-ochre)',
                      backgroundColor: 'rgba(201,148,10,0.12)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      flexShrink: 0,
                      marginTop: '2px',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {bolt.id.toUpperCase()}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontFamily: '"Cormorant Garamond", serif',
                        fontSize: '0.92rem',
                        color: 'var(--wald-parchment)',
                        margin: '0 0 4px 0',
                        lineHeight: 1.45,
                      }}
                    >
                      {bolt.text}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {bolt.is_brick && (
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: '#d4820a' }}>
                          ⚠ BRICK
                        </span>
                      )}
                      {boltBricks.length > 0 && !bolt.is_brick && (
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: '#d4820a' }}>
                          ⚠ {boltBricks.length} RESISTANCE
                        </span>
                      )}
                      <span
                        style={{
                          fontFamily: '"DM Mono", monospace',
                          fontSize: '9px',
                          color: 'rgba(245,240,232,0.3)',
                        }}
                      >
                        {boltNuts.length} NUT{boltNuts.length !== 1 ? 'S' : ''}
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '10px',
                      color: 'rgba(245,240,232,0.3)',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    ▶
                  </span>
                </button>

                {isExpanded && (
                  <div
                    style={{
                      borderTop: '1px solid rgba(245,240,232,0.06)',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {/* C/W intension */}
                    <div>
                      <div
                        style={{
                          fontFamily: '"DM Mono", monospace',
                          fontSize: '9px',
                          color: 'rgba(245,240,232,0.35)',
                          letterSpacing: '0.08em',
                          marginBottom: '3px',
                        }}
                      >
                        C-INTENSION
                      </div>
                      <p
                        style={{
                          fontFamily: '"Cormorant Garamond", serif',
                          fontStyle: 'italic',
                          fontSize: '0.85rem',
                          color: 'rgba(245,240,232,0.6)',
                          margin: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        {bolt.c_intension}
                      </p>
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: '"DM Mono", monospace',
                          fontSize: '9px',
                          color: 'rgba(245,240,232,0.35)',
                          letterSpacing: '0.08em',
                          marginBottom: '3px',
                        }}
                      >
                        W-INTENSION
                      </div>
                      <p
                        style={{
                          fontFamily: '"Cormorant Garamond", serif',
                          fontStyle: 'italic',
                          fontSize: '0.85rem',
                          color: 'rgba(245,240,232,0.5)',
                          margin: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        {bolt.w_intension}
                      </p>
                    </div>

                    {/* NUTs */}
                    {boltNuts.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontFamily: '"DM Mono", monospace',
                            fontSize: '9px',
                            color: 'rgba(245,240,232,0.35)',
                            letterSpacing: '0.08em',
                            marginBottom: '6px',
                          }}
                        >
                          NUTS
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {boltNuts.map((nut) => (
                            <div
                              key={nut.id}
                              style={{
                                padding: '7px 10px',
                                backgroundColor: 'rgba(245,240,232,0.04)',
                                border: '1px solid rgba(245,240,232,0.07)',
                                borderRadius: '4px',
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: '"DM Mono", monospace',
                                  fontSize: '8px',
                                  color: 'rgba(245,240,232,0.3)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                  marginRight: '6px',
                                }}
                              >
                                {nut.type}
                              </span>
                              <span
                                style={{
                                  fontFamily: '"Cormorant Garamond", serif',
                                  fontSize: '0.82rem',
                                  color: 'rgba(245,240,232,0.65)',
                                }}
                              >
                                {nut.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* BRICKs */}
                    {boltBricks.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontFamily: '"DM Mono", monospace',
                            fontSize: '9px',
                            color: '#d4820a',
                            letterSpacing: '0.08em',
                            marginBottom: '6px',
                          }}
                        >
                          ⚠ RESISTANCE BRICKS
                        </div>
                        {boltBricks.map((brick) => (
                          <div
                            key={brick.id}
                            style={{
                              padding: '8px 10px',
                              backgroundColor: 'rgba(212,130,10,0.06)',
                              border: '1px solid rgba(212,130,10,0.2)',
                              borderRadius: '4px',
                            }}
                          >
                            <div
                              style={{
                                fontFamily: '"DM Mono", monospace',
                                fontSize: '8px',
                                color: '#d4820a',
                                letterSpacing: '0.06em',
                                marginBottom: '3px',
                              }}
                            >
                              {brick.resistance_type.toUpperCase()} · {brick.severity.toUpperCase()}
                            </div>
                            <p
                              style={{
                                fontFamily: '"Cormorant Garamond", serif',
                                fontSize: '0.82rem',
                                color: 'rgba(245,240,232,0.65)',
                                margin: 0,
                                lineHeight: 1.4,
                              }}
                            >
                              {brick.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: D3 graph */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflow: 'hidden',
          }}
        >
          <BeliefAnatomyGraph
            bolts={bolts}
            nuts={nuts}
            bricks={bricks}
            onBoltClick={(bolt) => {
              setSelectedBolt(bolt);
              if (!expandedBolts.has(bolt.id)) {
                setExpandedBolts((prev) => new Set([...prev, bolt.id]));
              }
            }}
            width={Math.max(400, 560)}
            height={500}
          />
          <div
            style={{
              marginTop: '10px',
              fontFamily: '"DM Mono", monospace',
              fontSize: '9px',
              color: 'rgba(245,240,232,0.2)',
              letterSpacing: '0.08em',
            }}
          >
            SCROLL TO ZOOM · DRAG TO PAN · CLICK NODE TO INSPECT
          </div>
        </div>
      </div>
    </div>
  );
}
