import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { MOCK_FUTURES, MOCK_TERRITORIES } from '../mockData';
import type { PossibleWorldsFuture } from '../types';

export function PWTCPage() {
  const { futures, loadFutures, submitFuture, territories, initStore } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', territory_id: '', what_i_risk: '' });

  useEffect(() => {
    loadFutures();
    if (territories.length === 0) initStore();
  }, []);

  const displayed = futures.length > 0 ? futures : MOCK_FUTURES;
  const openCount = displayed.filter(f => f.status === 'open').length;
  const totalStakes = displayed.reduce((a, f) => a + f.stakes.length, 0);
  const totalValue = displayed.reduce((a, f) => a + f.currency_value, 0);

  const handleSubmit = async () => {
    if (!form.title) return;
    await submitFuture({
      title: form.title, description: form.description,
      territory_id: form.territory_id,
      stakes: form.what_i_risk ? [{ user_id: 'user-local', what_they_risk: form.what_i_risk, magnitude: 50 }] : [],
    });
    setForm({ title: '', description: '', territory_id: '', what_i_risk: '' });
    setShowModal(false);
  };

  return (
    <div style={{ background: '#0f1824', minHeight: '100vh', color: '#e8f0f8', padding: '48px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '18px', letterSpacing: '0.12em', color: '#e8f0f8', marginBottom: '8px' }}>
          POSSIBLE WORLDS TRADING CENTRE
        </div>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '22px', color: 'rgba(232,240,248,0.7)', margin: '0 0 24px' }}>
          Name a future. Stake what you risk.
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {[
            { label: 'FUTURES OPEN', value: openCount },
            { label: 'TOTAL STAKED', value: totalStakes },
            { label: '₩ IN CIRCULATION', value: totalValue.toFixed(1) },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: '#4a9eff', letterSpacing: '0.1em', marginBottom: '2px' }}>{label}</div>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '28px', color: '#e8f0f8' }}>{value}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            background: '#c9940a', color: '#fff', border: 'none',
            fontFamily: '"Cormorant Garamond", serif', fontSize: '16px', fontWeight: 600,
            padding: '10px 28px', cursor: 'pointer', borderRadius: '4px',
            transition: 'background 0.3s',
          }}
        >
          Submit a Future
        </button>
      </div>

      {/* Futures grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {displayed.map(future => <FutureCard key={future.id} future={future} />)}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
        }}>
          <div style={{
            background: '#f5f0e8', color: '#1a1a1a', borderRadius: '8px',
            padding: '36px', width: '100%', maxWidth: '500px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '24px', margin: 0 }}>Submit a Future</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                placeholder="Future title"
                value={form.title}
                onChange={e => setForm(s => ({ ...s, title: e.target.value }))}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: '"Cormorant Garamond", serif', fontSize: '16px' }}
              />
              <textarea
                placeholder="Describe this future..."
                value={form.description}
                onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
                rows={3}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'Spectral, serif', fontSize: '14px', resize: 'vertical' }}
              />
              <select
                value={form.territory_id}
                onChange={e => setForm(s => ({ ...s, territory_id: e.target.value }))}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: '"DM Mono", monospace', fontSize: '13px' }}
              >
                <option value="">Select territory...</option>
                {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <textarea
                placeholder="What do you risk by naming this future?"
                value={form.what_i_risk}
                onChange={e => setForm(s => ({ ...s, what_i_risk: e.target.value }))}
                rows={2}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'Spectral, serif', fontSize: '14px', resize: 'vertical' }}
              />
              <button
                onClick={handleSubmit}
                style={{
                  background: '#c9940a', color: '#fff', border: 'none', borderRadius: '4px',
                  fontFamily: '"Cormorant Garamond", serif', fontSize: '16px', fontWeight: 600,
                  padding: '12px', cursor: 'pointer',
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FutureCard({ future }: { future: PossibleWorldsFuture }) {
  const territory = MOCK_TERRITORIES.find(t => t.id === future.territory_id);
  return (
    <div style={{
      background: 'rgba(232,240,248,0.06)', border: '1px solid rgba(232,240,248,0.1)',
      borderRadius: '6px', padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h4 style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, fontSize: '18px', margin: 0, color: '#e8f0f8', flex: 1 }}>
          {future.title}
        </h4>
        {future.arrow_failure_flag && (
          <span title="Arrow aggregation failure detected" style={{ color: '#ff4444', fontSize: '18px', marginLeft: '8px' }}>⚠</span>
        )}
      </div>
      <p style={{ fontFamily: 'Spectral, serif', fontSize: '13px', color: 'rgba(232,240,248,0.6)', margin: '0 0 16px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {future.description}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '28px', color: '#4a9eff' }}>
          ₩ {future.currency_value.toFixed(1)}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {territory && (
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', background: 'rgba(74,158,255,0.2)', color: '#4a9eff', padding: '3px 10px', borderRadius: '99px' }}>
              {territory.name}
            </span>
          )}
          <span style={{
            fontFamily: '"DM Mono", monospace', fontSize: '10px', padding: '3px 10px', borderRadius: '99px',
            background: future.status === 'open' ? 'rgba(45,80,22,0.4)' : 'rgba(100,100,100,0.3)',
            color: future.status === 'open' ? '#7dca5a' : '#aaa',
          }}>
            {future.status}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button style={{
          flex: 1, background: 'transparent', border: '1px solid rgba(74,158,255,0.4)',
          color: '#4a9eff', borderRadius: '4px', fontFamily: '"DM Mono", monospace',
          fontSize: '11px', padding: '8px', cursor: 'pointer',
        }}>
          View Details
        </button>
        <button style={{
          flex: 1, background: 'rgba(201,148,10,0.15)', border: '1px solid rgba(201,148,10,0.4)',
          color: '#c9940a', borderRadius: '4px', fontFamily: '"DM Mono", monospace',
          fontSize: '11px', padding: '8px', cursor: 'pointer',
        }}>
          Add Stake
        </button>
      </div>
    </div>
  );
}
