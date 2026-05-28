import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../store';
import { MOCK_RESOURCES } from '../mockData';

const TYPE_ICON: Record<string, string> = {
  pdf: '📄', audio: '🎧', video: '🎬', ebook: '📚', article: '📰',
};

type FilterType = 'all' | 'pdf' | 'audio' | 'video' | 'ebook' | 'article';

export function TrainStationPage() {
  const { territory_id } = useParams<{ territory_id: string }>();
  const { resources, loadResources, territories, initStore } = useStore();
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');

  const territory = territories.find(t => t.id === territory_id);

  useEffect(() => {
    if (territories.length === 0) initStore();
    if (territory_id) loadResources(territory_id);
  }, [territory_id]);

  const displayed = resources.length > 0 ? resources : MOCK_RESOURCES.filter(r => r.territory_id === territory_id);
  const filtered = typeFilter === 'all' ? displayed : displayed.filter(r => r.type === typeFilter);
  const recommended = filtered.filter(r => !r.is_locked).slice(0, 2);

  const pillStyle = (active: boolean) => ({
    background: active ? '#c9940a' : 'rgba(201,148,10,0.15)',
    color: active ? '#1a1a1a' : '#c9940a',
    border: '1px solid rgba(201,148,10,0.4)',
    borderRadius: '99px', fontFamily: '"DM Mono", monospace',
    fontSize: '11px', padding: '4px 14px', cursor: 'pointer',
    transition: 'all 0.3s',
  });

  return (
    <div style={{ background: '#1a1209', minHeight: '100vh', color: '#f5e6c8', padding: '40px' }}>
      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '13px', letterSpacing: '0.12em', color: '#c9940a', marginBottom: '4px' }}>
        TRAIN STATION
      </div>
      <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '36px', margin: '0 0 4px', fontWeight: 600 }}>
        {territory?.name || territory_id}
      </h1>
      <p style={{ fontFamily: 'Spectral, serif', fontStyle: 'italic', color: 'rgba(245,230,200,0.55)', marginBottom: '28px' }}>
        Resources for your enquiry
      </p>

      {/* Type filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {(['all', 'pdf', 'audio', 'video', 'ebook', 'article'] as FilterType[]).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={pillStyle(typeFilter === t)}>
            {t === 'all' ? 'All' : `${TYPE_ICON[t]} ${t.toUpperCase()}`}
          </button>
        ))}
      </div>

      {/* Recommended */}
      {recommended.length > 0 && (
        <>
          <h3 style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '0.1em', color: '#c9940a', marginBottom: '16px' }}>
            RECOMMENDED
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {recommended.map(r => (
              <ResourceCard key={r.id} resource={r} highlighted />
            ))}
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(201,148,10,0.2)', marginBottom: '24px' }} />
        </>
      )}

      {/* All resources */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filtered.map(r => <ResourceCard key={r.id} resource={r} />)}
        {filtered.length === 0 && (
          <p style={{ fontFamily: 'Spectral, serif', fontStyle: 'italic', opacity: 0.5 }}>
            No resources found for this filter.
          </p>
        )}
      </div>
    </div>
  );
}

function ResourceCard({ resource, highlighted }: { resource: { id: string; title: string; type: string; url: string; waldconsistency_level: string; description: string; is_locked: boolean }; highlighted?: boolean }) {
  return (
    <div style={{
      background: highlighted ? 'rgba(201,148,10,0.08)' : 'rgba(245,230,200,0.05)',
      border: `1px solid ${highlighted ? 'rgba(201,148,10,0.4)' : 'rgba(245,230,200,0.1)'}`,
      borderRadius: '6px', padding: '16px',
      opacity: resource.is_locked ? 0.4 : 1,
      position: 'relative',
    }}>
      {resource.is_locked && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '16px' }}>🔒</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>{TYPE_ICON[resource.type] || '📄'}</span>
        <span style={{
          fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '0.1em',
          background: 'rgba(201,148,10,0.2)', color: '#c9940a',
          padding: '2px 8px', borderRadius: '99px',
        }}>
          {resource.waldconsistency_level}
        </span>
      </div>
      <h4 style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, fontSize: '16px', margin: '0 0 6px', color: '#f5e6c8' }}>
        {resource.title}
      </h4>
      <p style={{ fontFamily: 'Spectral, serif', fontSize: '12px', color: 'rgba(245,230,200,0.6)', margin: '0 0 12px', lineHeight: 1.4 }}>
        {resource.description}
      </p>
      {!resource.is_locked && (
        <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{
          fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#c9940a',
          textDecoration: 'none', letterSpacing: '0.05em',
        }}>
          Open resource →
        </a>
      )}
    </div>
  );
}
