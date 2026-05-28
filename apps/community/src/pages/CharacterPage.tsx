import React, { useState, useRef, useEffect } from 'react';
import { TotemicCharacterSVG } from '../components/TotemicCharacterSVG';
import { MOCK_CHARACTER } from '../mockData';
import { useStore } from '../store';

export function CharacterPage() {
  const { totemicCharacter, initStore } = useStore();
  useEffect(() => {
    if (!totemicCharacter) initStore();
  }, []);
  const character = totemicCharacter ?? MOCK_CHARACTER;
  const [name, setName] = useState(character.name);
  const [editing, setEditing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const waldAvg = character.shaped_by.waldconsistency_avg;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (waldAvg / 100) * circ;

  const attrColors: Record<string, string> = {
    curiosity: '#c9940a',
    solidarity: '#2d5016',
    rootedness: '#5c3d00',
    reach: '#4a9eff',
  };

  const downloadSVG = () => {
    const svgEl = document.querySelector('#character-svg-wrapper svg');
    if (!svgEl) return;
    const blob = new Blob([svgEl.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name.replace(/\s+/g, '-').toLowerCase()}.svg`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      background: '#0a1509', minHeight: '100vh', color: '#f5e6c8',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '60px 24px',
    }}>
      {/* Character SVG */}
      <div id="character-svg-wrapper">
        <TotemicCharacterSVG
          attributes={character.attributes}
          primaryColour={character.visual.primary_colour}
          emblem={character.visual.emblem}
          size={280}
        />
      </div>

      {/* Name */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => setEditing(false)}
            style={{
              background: 'transparent', border: 'none',
              borderBottom: '1px solid #c9940a', outline: 'none',
              color: '#f5e6c8', fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic', fontSize: '28px', textAlign: 'center',
              width: '280px',
            }}
          />
        ) : (
          <h2
            onClick={() => setEditing(true)}
            style={{
              fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
              fontWeight: 400, fontSize: '28px', cursor: 'pointer', margin: 0,
            }}
          >
            {name}
          </h2>
        )}
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(245,230,200,0.4)', marginTop: '4px' }}>
          click name to edit
        </p>
      </div>

      {/* Citizen type */}
      <div style={{
        background: '#c9940a', color: '#1a1209',
        fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '0.1em',
        padding: '4px 14px', borderRadius: '99px', marginTop: '8px', marginBottom: '32px',
        textTransform: 'uppercase',
      }}>
        {character.shaped_by.citizen_type}
      </div>

      {/* Attribute bars */}
      <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
        {Object.entries(character.attributes).map(([key, val]) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>
                {key}
              </span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', opacity: 0.6 }}>{val}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px' }}>
              <div style={{
                width: `${val}%`, height: '100%',
                background: attrColors[key] || '#c9940a',
                borderRadius: '3px', transition: 'width 1s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Waldconsistency gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
          <circle cx="45" cy="45" r={r} fill="none" stroke="#c9940a" strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 45 45)"
            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
          />
          <text x="45" y="50" textAnchor="middle" fill="#f5e6c8"
            fontFamily='"DM Mono", monospace' fontSize="14" fontWeight="500">
            {waldAvg}
          </text>
        </svg>
        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', opacity: 0.5, letterSpacing: '0.08em' }}>
          WALDCONSISTENCY AVG
        </span>
      </div>

      {/* Download */}
      <button
        onClick={downloadSVG}
        style={{
          background: 'transparent', border: '1px solid rgba(201,148,10,0.5)',
          color: '#c9940a', fontFamily: '"Cormorant Garamond", serif',
          fontSize: '16px', padding: '10px 28px', cursor: 'pointer',
          letterSpacing: '0.05em', transition: 'all 0.3s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,148,10,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        Download Character
      </button>
    </div>
  );
}
