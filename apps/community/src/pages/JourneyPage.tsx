import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_TERRITORIES } from '../mockData';

const STAGES = [
  { id: 1, name: 'Arrival', description: 'Enter Walden Woods and name your purpose', icon: '🌲', complete: true },
  { id: 2, name: 'First Cards', description: 'Complete your first card deck', icon: '🃏', complete: true },
  { id: 3, name: 'First Action', description: 'Log your first required action', icon: '✋', complete: false },
  { id: 4, name: 'Character', description: 'Unlock your Totemic Character', icon: '🦉', complete: false },
  { id: 5, name: 'Train Station', description: 'Access Train Station resources', icon: '🚉', complete: false },
  { id: 6, name: 'Forum', description: 'Post in a Territory forum', icon: '💬', complete: false },
  { id: 7, name: 'Cross-App', description: 'Link your journey to Walditorium or Harvest Trees', icon: '🔗', complete: false },
];

export function JourneyPage() {
  const navigate = useNavigate();
  const nextStage = STAGES.find(s => !s.complete);
  const completedCount = STAGES.filter(s => s.complete).length;

  return (
    <div style={{ background: '#0a1509', minHeight: '100vh', color: '#f5e6c8', padding: '48px 40px' }}>
      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '14px', letterSpacing: '0.12em', color: '#c9940a', marginBottom: '8px' }}>
        YOUR WALDORION JOURNEY
      </div>
      <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '40px', fontWeight: 600, margin: '0 0 40px' }}>
        Stage {completedCount} of {STAGES.length}
      </h1>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', maxWidth: '600px', marginBottom: '48px' }}>
        {STAGES.map((stage, i) => {
          const isComplete = stage.complete;
          const isNext = !stage.complete && (i === 0 || STAGES[i - 1].complete);
          const isPending = !isComplete && !isNext;

          return (
            <div key={stage.id} style={{ display: 'flex', gap: '20px', position: 'relative' }}>
              {/* Connector line */}
              {i < STAGES.length - 1 && (
                <div style={{
                  position: 'absolute', left: '19px', top: '44px',
                  width: '2px', height: 'calc(100% - 20px)',
                  background: isComplete ? '#2d5016' : 'rgba(245,230,200,0.1)',
                }} />
              )}

              {/* Circle */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isComplete ? '#2d5016' : isNext ? '#c9940a' : 'rgba(245,230,200,0.08)',
                border: `2px solid ${isComplete ? '#2d5016' : isNext ? '#c9940a' : 'rgba(245,230,200,0.2)'}`,
                fontSize: '18px',
                animation: isNext ? 'pulse-stage 2s ease-in-out infinite' : 'none',
              }}>
                {isComplete ? '✓' : stage.icon}
              </div>

              {/* Content */}
              <div style={{ paddingBottom: '24px' }}>
                <div style={{
                  fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, fontSize: '18px',
                  color: isComplete ? '#7dca5a' : isNext ? '#c9940a' : 'rgba(245,230,200,0.4)',
                  marginBottom: '2px',
                }}>
                  {stage.name}
                </div>
                <div style={{
                  fontFamily: 'Spectral, serif', fontSize: '13px',
                  color: isPending ? 'rgba(245,230,200,0.25)' : 'rgba(245,230,200,0.6)',
                }}>
                  {stage.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visited territories */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '0.1em', color: '#c9940a', marginBottom: '12px' }}>
          TERRITORIES VISITED
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {MOCK_TERRITORIES.slice(0, 2).map(t => (
            <span key={t.id} style={{
              fontFamily: '"DM Mono", monospace', fontSize: '11px',
              background: 'rgba(201,148,10,0.15)', border: '1px solid rgba(201,148,10,0.3)',
              color: '#c9940a', padding: '4px 12px', borderRadius: '99px',
            }}>
              {t.name}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      {nextStage && (
        <div>
          <p style={{ fontFamily: 'Spectral, serif', fontStyle: 'italic', color: 'rgba(245,230,200,0.6)', marginBottom: '16px' }}>
            Next: {nextStage.name} — {nextStage.description}
          </p>
          <button
            onClick={() => navigate('/territory/busyness-park/cards')}
            style={{
              background: '#c9940a', color: '#fff', border: 'none', borderRadius: '4px',
              fontFamily: '"Cormorant Garamond", serif', fontWeight: 600,
              fontSize: '18px', padding: '12px 32px', cursor: 'pointer',
              transition: 'background 0.3s',
            }}
          >
            Continue →
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse-stage {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,148,10,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(201,148,10,0); }
        }
      `}</style>
    </div>
  );
}
