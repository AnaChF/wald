import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalditoriumStamp } from '../components/WalditoriumStamp';
import { useAuditStore } from '../store';

function getVerdictColor(verdict: string) {
  switch (verdict) {
    case 'GROUNDED': return 'var(--verdict-grounded)';
    case 'CONDITIONAL': return 'var(--verdict-conditional)';
    case 'CONTESTED': return 'var(--verdict-contested)';
    case 'UNGROUNDED': return 'var(--verdict-ungrounded)';
    default: return 'var(--wald-parchment)';
  }
}

export function StampsPage() {
  const navigate = useNavigate();
  const { sessions, loadMyStamps } = useAuditStore();

  useEffect(() => {
    loadMyStamps();
  }, [loadMyStamps]);

  const stamped = sessions.filter((s) => s.audit_result != null);

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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '36px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontWeight: 600,
              fontSize: '1.7rem',
              color: 'var(--wald-parchment)',
              margin: '0 0 4px 0',
            }}
          >
            My Stamps
          </h2>
          <div
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '10px',
              color: 'rgba(245,240,232,0.35)',
              letterSpacing: '0.1em',
            }}
          >
            {stamped.length} AUDIT{stamped.length !== 1 ? 'S' : ''} ON RECORD
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 22px',
            backgroundColor: 'var(--wald-ochre)',
            color: 'var(--wald-forest)',
            border: 'none',
            borderRadius: '6px',
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          + New Audit
        </button>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        {stamped.map((session) => {
          const result = session.audit_result!;
          const verdictColor = getVerdictColor(result.verdict);
          const inputContent = session.input?.content ?? '';

          return (
            <div
              key={session.id}
              onClick={() => navigate(`/audit/${session.id}/stamp`)}
              style={{
                backgroundColor: 'rgba(245,240,232,0.03)',
                border: '1px solid rgba(201,148,10,0.14)',
                borderRadius: '12px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background-color 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,148,10,0.4)';
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(245,240,232,0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,148,10,0.14)';
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(245,240,232,0.03)';
              }}
            >
              <WalditoriumStamp auditResult={result} size={200} animated={false} />

              <div style={{ width: '100%', textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    color: verdictColor,
                    letterSpacing: '0.08em',
                    marginBottom: '6px',
                  }}
                >
                  {result.verdict}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '16px',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '12px',
                      color: 'var(--wald-ochre)',
                    }}
                  >
                    CL {result.cl_score}
                  </span>
                  <span
                    style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '12px',
                      color: 'rgba(245,240,232,0.5)',
                    }}
                  >
                    SCI {result.sci_score}
                  </span>
                </div>
                {inputContent && (
                  <div
                    style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontStyle: 'italic',
                      fontSize: '0.85rem',
                      color: 'rgba(245,240,232,0.45)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '260px',
                      margin: '0 auto',
                    }}
                    title={inputContent.slice(0, 80)}
                  >
                    {inputContent.slice(0, 60)}
                    {inputContent.length > 60 ? '…' : ''}
                  </div>
                )}
                <div
                  style={{
                    marginTop: '6px',
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '9px',
                    color: 'rgba(245,240,232,0.25)',
                    letterSpacing: '0.08em',
                  }}
                >
                  {new Date(session.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {stamped.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 24px',
          }}
        >
          <div
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '1.4rem',
              color: 'rgba(245,240,232,0.35)',
              marginBottom: '16px',
            }}
          >
            No audits yet
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 28px',
              backgroundColor: 'transparent',
              border: '1px solid var(--wald-ochre)',
              borderRadius: '6px',
              color: 'var(--wald-ochre)',
              fontFamily: '"Cormorant Garamond", serif',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Begin your first audit
          </button>
        </div>
      )}
    </div>
  );
}
