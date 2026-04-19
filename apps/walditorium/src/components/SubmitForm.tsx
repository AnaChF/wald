import React, { useState } from 'react';

interface SubmitFormProps {
  onSubmit: (input: { type: string; content: string }, agentContext?: { description: string; known_beliefs: string[] }) => void;
  loading: boolean;
}

type TabKey = 'text' | 'url' | 'pdf';

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: 'text', label: 'Text' },
  { key: 'url', label: 'URL' },
  { key: 'pdf', label: 'PDF' },
];

export function SubmitForm({ onSubmit, loading }: SubmitFormProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('text');
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [showAgentContext, setShowAgentContext] = useState(false);
  const [agentDescription, setAgentDescription] = useState('');
  const [agentBeliefs, setAgentBeliefs] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = activeTab === 'text' ? textContent : activeTab === 'url' ? urlContent : '';
    if (!content.trim() && activeTab !== 'pdf') return;

    const agentContext =
      agentDescription.trim() || agentBeliefs.trim()
        ? {
            description: agentDescription.trim(),
            known_beliefs: agentBeliefs
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
          }
        : undefined;

    onSubmit({ type: activeTab, content: content.trim() }, agentContext);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'rgba(245,240,232,0.05)',
    border: '1px solid rgba(201,148,10,0.2)',
    borderRadius: '6px',
    color: 'var(--wald-parchment)',
    fontFamily: '"Cormorant Garamond", serif',
    fontSize: '1rem',
    padding: '10px 14px',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical' as const,
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          borderBottom: '1px solid rgba(201,148,10,0.2)',
          marginBottom: '20px',
        }}
      >
        {TAB_LABELS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '11px',
              letterSpacing: '0.08em',
              padding: '8px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.key ? 'var(--wald-ochre)' : 'transparent'}`,
              color: activeTab === tab.key ? 'var(--wald-ochre)' : 'rgba(245,240,232,0.45)',
              cursor: 'pointer',
              transition: 'color 0.2s',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      {activeTab === 'text' && (
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Paste your text, document, or statement here..."
          rows={9}
          style={{ ...inputStyle, minHeight: '200px' }}
          disabled={loading}
        />
      )}

      {activeTab === 'url' && (
        <input
          type="url"
          value={urlContent}
          onChange={(e) => setUrlContent(e.target.value)}
          placeholder="https://..."
          style={{ ...inputStyle, resize: undefined }}
          disabled={loading}
        />
      )}

      {activeTab === 'pdf' && (
        <div
          style={{
            ...inputStyle,
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'not-allowed',
            opacity: 0.5,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '0.08em' }}>
            PDF UPLOAD — COMING SOON
          </span>
        </div>
      )}

      {/* Agent context collapsible */}
      <div style={{ marginTop: '16px' }}>
        <button
          type="button"
          onClick={() => setShowAgentContext(!showAgentContext)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(245,240,232,0.5)',
            cursor: 'pointer',
            padding: '0',
            fontFamily: '"DM Mono", monospace',
            fontSize: '11px',
            letterSpacing: '0.08em',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              transform: showAgentContext ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            ▶
          </span>
          AGENT CONTEXT (OPTIONAL)
        </button>

        {showAgentContext && (
          <div
            style={{
              marginTop: '12px',
              padding: '14px',
              backgroundColor: 'rgba(245,240,232,0.03)',
              border: '1px solid rgba(201,148,10,0.12)',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '10px',
                  color: 'rgba(245,240,232,0.45)',
                  marginBottom: '6px',
                  letterSpacing: '0.08em',
                }}
              >
                AGENT / AUTHOR DESCRIPTION
              </label>
              <input
                type="text"
                value={agentDescription}
                onChange={(e) => setAgentDescription(e.target.value)}
                placeholder="e.g. Technology futurist writing a policy brief..."
                style={{ ...inputStyle, resize: undefined }}
                disabled={loading}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '10px',
                  color: 'rgba(245,240,232,0.45)',
                  marginBottom: '6px',
                  letterSpacing: '0.08em',
                }}
              >
                KNOWN BELIEFS (ONE PER LINE)
              </label>
              <textarea
                value={agentBeliefs}
                onChange={(e) => setAgentBeliefs(e.target.value)}
                placeholder="One known belief per line..."
                rows={4}
                style={{ ...inputStyle }}
                disabled={loading}
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: '20px',
          width: '100%',
          padding: '14px 20px',
          backgroundColor: loading ? 'rgba(201,148,10,0.15)' : 'var(--wald-parchment)',
          color: loading ? 'rgba(201,148,10,0.6)' : 'var(--wald-ochre)',
          border: '1px solid rgba(201,148,10,0.3)',
          borderRadius: '6px',
          fontFamily: '"Cormorant Garamond", serif',
          fontWeight: 600,
          fontSize: '1.1rem',
          letterSpacing: '0.05em',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s, color 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--wald-ochre)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--wald-forest)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--wald-parchment)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--wald-ochre)';
          }
        }}
      >
        {loading ? (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            Extracting beliefs…
          </>
        ) : (
          'Begin Audit'
        )}
      </button>
    </form>
  );
}
