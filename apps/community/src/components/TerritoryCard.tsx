import React, { useState } from 'react';
import type { Territory, Zone } from '../types';

const ZONE_BORDER: Record<Zone, string> = {
  arrivals_departures: '#c9940a',
  civic_centre:        '#2d5016',
  commonwealth:        '#6b3fa0',
  science_fair:        '#4a9eff',
};

const ZONE_LABEL: Record<Zone, string> = {
  arrivals_departures: 'Arrivals',
  civic_centre:        'Civic Centre',
  commonwealth:        'Commonwealth',
  science_fair:        'Science Fair',
};

interface TerritoryCardProps {
  territory: Territory;
  progress?: number;
  onClick: () => void;
}

export function TerritoryCard({ territory, progress, onClick }: TerritoryCardProps) {
  const [hovered, setHovered] = useState(false);
  const borderColor = ZONE_BORDER[territory.zone];
  const zoneLabel = ZONE_LABEL[territory.zone];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: '4px',
        padding: '20px 20px 20px 16px',
        cursor: 'pointer',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.5s ease',
        minWidth: '240px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h3 style={{
          fontFamily: '"Cormorant Garamond", serif', fontWeight: 600,
          fontSize: '20px', margin: 0, color: '#1a1a1a',
        }}>
          {territory.name}
        </h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{
            background: borderColor, color: '#fff',
            fontFamily: '"DM Mono", monospace', fontSize: '10px',
            padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap',
          }}>
            {zoneLabel}
          </span>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: territory.real_estate_status === 'active' ? '#2d5016' : '#999',
            display: 'inline-block',
          }} />
        </div>
      </div>
      <p style={{
        fontFamily: 'Spectral, serif', fontSize: '13px',
        color: '#666', margin: '0 0 12px', lineHeight: 1.5,
      }}>
        {territory.tagline}
      </p>
      {progress !== undefined && progress > 0 && (
        <div style={{ background: '#eee', height: '4px', borderRadius: '2px' }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: '#c9940a', borderRadius: '2px',
            transition: 'width 0.8s ease',
          }} />
        </div>
      )}
    </div>
  );
}
