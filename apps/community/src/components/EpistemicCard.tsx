import React, { useState } from 'react';
import type { EpistemicCard as EpistemicCardType } from '../types';

interface EpistemicCardProps {
  card: EpistemicCardType;
  onComplete?: (actionId: string) => void;
  cardNumber: number;
  totalCards: number;
}

const SepiaSVG = () => (
  <svg width="100%" height="60" viewBox="0 0 380 60" style={{ display: 'block' }}>
    <rect width="380" height="60" fill="#f5f0e8" />
    {[14, 20, 28, 36, 44].map((r, i) => (
      <ellipse key={i} cx="190" cy="80" rx={r * 8} ry={r * 3}
        fill="none" stroke="#8B7355" strokeWidth="0.8" opacity={0.4 + i * 0.1} />
    ))}
    <rect x="0" y="48" width="380" height="12" fill="#f5f0e8" />
    <line x1="60" y1="55" x2="320" y2="55" stroke="#8B7355" strokeWidth="0.5" opacity="0.3" />
  </svg>
);

export function EpistemicCard({ card, onComplete, cardNumber, totalCards }: EpistemicCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [done, setDone] = useState(false);

  const handleComplete = () => {
    setDone(true);
    if (onComplete) onComplete(card.required_action.id);
  };

  const firstEvidence = card.evidence[0];

  return (
    <div className="card-flip-container" style={{ width: '380px', height: '520px', position: 'relative' }}>
      <div
        className={`card-inner${isFlipped ? ' flipped' : ''}`}
        style={{ width: '100%', height: '100%' }}
      >
        {/* FRONT */}
        <div
          className="card-front"
          onClick={() => setIsFlipped(true)}
          style={{
            background: '#f5f0e8',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'relative' }}>
            <SepiaSVG />
            <span style={{
              position: 'absolute', top: '8px', right: '12px',
              fontFamily: '"DM Mono", monospace', fontSize: '11px',
              color: '#8B7355', opacity: 0.7,
            }}>
              {cardNumber} / {totalCards}
            </span>
          </div>

          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px 24px 16px',
          }}>
            <p style={{
              fontFamily: '"Cormorant Garamond", serif', fontWeight: 600,
              fontSize: '22px', lineHeight: 1.45, color: '#1a1a1a',
              textAlign: 'center', margin: 0,
            }}>
              {card.claim}
            </p>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            padding: '12px 20px 10px',
            borderTop: '1px solid rgba(139,115,85,0.2)',
          }}>
            <div>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: '#c9940a', letterSpacing: '0.1em', marginBottom: '2px' }}>
                EVIDENCE
              </div>
              <div style={{ fontFamily: 'Spectral, serif', fontSize: '11px', fontStyle: 'italic', color: '#555' }}>
                {firstEvidence ? firstEvidence.source : 'No source cited'}
              </div>
            </div>
            <div style={{ textAlign: 'right', maxWidth: '160px' }}>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: '#c9940a', letterSpacing: '0.1em', marginBottom: '2px' }}>
                POSSIBLE WORLDS
              </div>
              <div style={{ fontFamily: 'Spectral, serif', fontSize: '11px', fontStyle: 'italic', color: '#555', lineHeight: 1.3 }}>
                {card.possible_worlds_note.length > 80
                  ? card.possible_worlds_note.slice(0, 77) + '…'
                  : card.possible_worlds_note}
              </div>
            </div>
          </div>
          <div style={{
            textAlign: 'center', padding: '6px',
            fontFamily: '"DM Mono", monospace', fontSize: '9px', color: '#8B7355', opacity: 0.6,
          }}>
            tap to reveal challenge →
          </div>
        </div>

        {/* BACK */}
        <div
          className="card-back"
          onClick={() => setIsFlipped(false)}
          style={{
            background: '#1a1a14',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            padding: '28px 24px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#c9940a', letterSpacing: '0.15em' }}>
            CHALLENGE
          </div>
          <p style={{
            fontFamily: '"Cormorant Garamond", serif', fontWeight: 600,
            fontSize: '20px', lineHeight: 1.4, color: '#f5f0e8',
            marginTop: '16px',
          }}>
            {card.challenge_question}
          </p>
          <hr style={{ border: 'none', borderTop: '1px solid #c9940a44', margin: '20px 0' }} />
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#c9940a', letterSpacing: '0.15em' }}>
            ACTION
          </div>
          <p style={{
            fontFamily: 'Spectral, serif', fontSize: '14px',
            color: '#d4c8b0', marginTop: '8px', lineHeight: 1.55, flex: 1,
          }}>
            {card.required_action.description}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); if (!done) handleComplete(); }}
            disabled={done}
            style={{
              width: '100%', background: done ? '#555' : '#c9940a',
              color: '#fff', border: 'none', borderRadius: '4px',
              fontFamily: '"Cormorant Garamond", serif', fontWeight: 600,
              fontSize: '16px', padding: '13px', cursor: done ? 'default' : 'pointer',
              marginTop: 'auto', transition: 'background 0.3s',
            }}
          >
            {done ? '✓ Action Noted' : 'Mark Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}
