import { useNavigate } from 'react-router-dom';
import { SubmitForm } from '../components/SubmitForm';
import { useAuditStore } from '../store';

export function SubmitPage() {
  const navigate = useNavigate();
  const { submitAudit, loading } = useAuditStore();

  async function handleSubmit(
    input: { type: string; content: string },
    agentContext?: { description: string; known_beliefs: string[] }
  ) {
    const sessionId = await submitAudit(input, agentContext);
    navigate(`/audit/${sessionId}/anatomy`);
  }

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
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 600,
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            color: 'var(--wald-parchment)',
            letterSpacing: '0.15em',
            margin: '0 0 8px 0',
          }}
        >
          WALDITORIUM™
        </h1>
        <div
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '11px',
            color: 'var(--wald-ochre)',
            letterSpacing: '0.2em',
            opacity: 0.8,
          }}
        >
          EPISTEMIC AUDIT INSTRUMENT
        </div>
        <div
          style={{
            marginTop: '16px',
            width: '40px',
            height: '1px',
            backgroundColor: 'var(--wald-ochre)',
            margin: '16px auto 0',
            opacity: 0.4,
          }}
        />
      </div>

      {/* Form card */}
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: 'rgba(245,240,232,0.03)',
          border: '1px solid rgba(201,148,10,0.18)',
          borderRadius: '12px',
          padding: '32px',
        }}
      >
        <div
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1.2rem',
            color: 'rgba(245,240,232,0.6)',
            marginBottom: '24px',
            fontStyle: 'italic',
          }}
        >
          Submit a text, document, or URL for epistemic audit.
        </div>
        <SubmitForm onSubmit={handleSubmit} loading={loading} />
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '32px',
          fontFamily: '"DM Mono", monospace',
          fontSize: '10px',
          color: 'rgba(245,240,232,0.2)',
          letterSpacing: '0.08em',
          textAlign: 'center',
        }}
      >
        WALDCONSISTENCY ENGINE v0.1 · 8-LEVEL EPISTEMIC EVALUATION
      </div>
    </div>
  );
}
