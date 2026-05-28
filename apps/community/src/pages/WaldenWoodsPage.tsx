import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

const TREES = [
  [0, 180, 80, 40, 160, 180],
  [100, 180, 175, 20, 250, 180],
  [210, 180, 295, 8, 380, 180],
  [360, 180, 445, 52, 530, 180],
  [510, 180, 592, 12, 674, 180],
  [650, 180, 728, 38, 806, 180],
  [790, 180, 878, 4, 966, 180],
  [960, 180, 1048, 28, 1136, 180],
];

export function WaldenWoodsPage() {
  const navigate = useNavigate();
  const { setEntryText } = useStore();
  const [text, setText] = useState('');
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1800);
    const t3 = setTimeout(() => setPhase(3), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 80%, #1a2e18 0%, #0a1509 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: '40px 20px',
    }}>
      {/* Forest silhouette */}
      <svg
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '180px' }}
        viewBox="0 0 1200 180"
        preserveAspectRatio="none"
      >
        {TREES.map(([x1, y1, x2, y2, x3, y3], i) => (
          <polygon
            key={i}
            points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
            fill="#0d1f0c"
            opacity={0.7 + (i % 3) * 0.08}
          />
        ))}
        <rect x="0" y="160" width="1200" height="20" fill="#0d1f0c" />
      </svg>

      {/* Question */}
      <h1 style={{
        fontFamily: '"Cormorant Garamond", serif', fontWeight: 300,
        fontSize: 'clamp(32px, 6vw, 72px)',
        color: '#f5e6c8', letterSpacing: '0.08em', textAlign: 'center',
        margin: '0 0 48px', textShadow: '0 2px 20px rgba(0,0,0,0.5)',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 1.2s ease-in',
      }}>
        Why are you here?
      </h1>

      {/* Input */}
      <div style={{
        width: '100%', maxWidth: '520px',
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 0.8s ease-in',
      }}>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Begin writing..."
          autoFocus={phase >= 2}
          style={{
            width: '100%', background: 'transparent', border: 'none',
            borderBottom: '1px solid rgba(245,230,200,0.5)', outline: 'none',
            color: '#f5e6c8', fontSize: '18px',
            fontFamily: '"Cormorant Garamond", serif', fontWeight: 300,
            padding: '8px 0', textAlign: 'center', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Button */}
      <div style={{
        marginTop: '32px',
        opacity: phase >= 3 && text.length >= 10 ? 1 : 0,
        transition: 'opacity 0.6s ease-in',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        pointerEvents: phase >= 3 && text.length >= 10 ? 'auto' : 'none',
      }}>
        <button
          onClick={() => { setEntryText(text); navigate('/territories'); }}
          style={{
            background: 'transparent', border: '1px solid rgba(245,230,200,0.6)',
            color: '#f5e6c8', fontFamily: '"Cormorant Garamond", serif',
            fontSize: '18px', fontWeight: 600, padding: '12px 40px',
            cursor: 'pointer', letterSpacing: '0.1em', transition: 'all 0.3s',
          }}
          onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(245,230,200,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; }}
        >
          Enter the Wald
        </button>
        <span style={{ color: 'rgba(245,230,200,0.4)', fontSize: '12px', fontFamily: '"DM Mono", monospace' }}>
          No account required to explore
        </span>
      </div>
    </div>
  );
}
