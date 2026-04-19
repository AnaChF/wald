import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { TerritoryCard } from '../components/TerritoryCard';
import type { Zone } from '../types';

const ZONE_LABELS: Record<string | 'all', string> = {
  all: 'All',
  arrivals_departures: 'Arrivals',
  civic_centre: 'Civic Centre',
  commonwealth: 'Commonwealth',
  science_fair: 'Science Fair',
};

export function TerritoriesPage() {
  const navigate = useNavigate();
  const { territories, initStore, setCurrentTerritory } = useStore();
  const [filter, setFilter] = useState<'all' | Zone>('all');

  useEffect(() => { initStore(); }, []);

  const filtered = filter === 'all' ? territories : territories.filter(t => t.zone === filter);

  const filterStyle = (active: boolean) => ({
    background: active ? '#c9940a' : 'rgba(245,230,200,0.1)',
    color: active ? '#1a1209' : '#f5e6c8',
    border: '1px solid rgba(201,148,10,0.4)',
    borderRadius: '99px',
    fontFamily: '"DM Mono", monospace',
    fontSize: '11px', letterSpacing: '0.08em',
    padding: '5px 14px', cursor: 'pointer',
    transition: 'all 0.3s',
  });

  return (
    <div style={{ background: '#1a1209', minHeight: '100vh', color: '#f5e6c8' }}>
      {/* Header */}
      <div style={{ padding: '48px 40px 32px', borderBottom: '1px solid rgba(201,148,10,0.2)' }}>
        <h1 style={{
          fontFamily: '"Cormorant Garamond", serif', fontWeight: 600,
          fontSize: '42px', margin: '0 0 8px', letterSpacing: '0.05em',
        }}>
          TERRITORIES
        </h1>
        <p style={{ fontFamily: 'Spectral, serif', fontStyle: 'italic', color: 'rgba(245,230,200,0.6)', margin: 0 }}>
          Choose your starting ground.
        </p>
      </div>

      {/* Filters */}
      <div style={{ padding: '20px 40px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {(['all', 'arrivals_departures', 'civic_centre', 'commonwealth', 'science_fair'] as const).map(z => (
          <button key={z} onClick={() => setFilter(z)} style={filterStyle(filter === z)}>
            {ZONE_LABELS[z]}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px', padding: '8px 40px 48px',
      }}>
        {filtered.map(territory => (
          <TerritoryCard
            key={territory.id}
            territory={territory}
            onClick={() => {
              setCurrentTerritory(territory);
              navigate(`/territory/${territory.id}/cards`);
            }}
          />
        ))}
      </div>
    </div>
  );
}
