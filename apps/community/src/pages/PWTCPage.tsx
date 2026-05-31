import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { MOCK_FUTURES, MOCK_TERRITORIES } from '../mockData';
import type { PossibleWorldsFuture } from '../types';

export function PWTCPage() {
  const { futures, loadFutures, submitFuture, addStake, territories, initStore } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', territory_id: '', what_i_risk: '' });
  const [detailFuture, setDetailFuture] = useState<PossibleWorldsFuture | null>(null);
  const [stakeTarget, setStakeTarget] = useState<PossibleWorldsFuture | null>(null);
  const [stakeText, setStakeText] = useState('');
  const [staking, setStaking] = useState(false);

  useEffect(() => {
    loadFutures();
    if (territories.length === 0) initStore();
  }, []);

  const allTerritories = territories.length > 0 ? territories : MOCK_TERRITORIES;
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

  const handleAddStake = async () => {
    if (!stakeTarget || !stakeText.trim()) return;
    setStaking(true);
    await addStake(stakeTarget.id, stakeText.trim());
    setStaking(false);
    setStakeText('');
    setStakeTarget(null);
  };

  const modalBg: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
  };
  const modalBox: React.CSSProperties = {
    background: '#f5f0e8', color: '#1a1a1a', borderRadius: '8px',
    padding: '36px', width: '100%', maxWidth: '500px',
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
          }}
        >
          Submit a Future
        </button>
      </div>

      {/* Futures grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {displayed.map(future => (
          <FutureCard
            key={future.id}
            future={future}
            territories={allTerritories}
            onViewDetails={setDetailFuture}
            onAddStake={(f) => { setStakeTarget(f); setStakeText(''); }}
          />
        ))}
      </div>

      {/* Submit Future Modal */}
      {showModal && (
        <div style={modalBg}>
          <div style={modalBox}>
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
                {allTerritories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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

      {/* Add Stake Modal */}
      {stakeTarget && (
        <div style={modalBg} onClick={() => setStakeTarget(null)}>
          <div style={{ ...modalBox, maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '22px', margin: 0 }}>Add Stake</h3>
              <button onClick={() => setStakeTarget(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '16px', color: '#4a4a4a', marginBottom: '20px' }}>
              {stakeTarget.title}
            </p>
            <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '0.1em', color: '#666', display: 'block', marginBottom: '6px' }}>
              WHAT DO YOU RISK BY HOLDING THIS FUTURE?
            </label>
            <textarea
              autoFocus
              value={stakeText}
              onChange={e => setStakeText(e.target.value)}
              placeholder="Describe your stake..."
              rows={3}
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'Spectral, serif', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleAddStake}
                disabled={staking || !stakeText.trim()}
                style={{
                  flex: 1, background: stakeText.trim() ? '#c9940a' : '#e0cda0', color: '#fff', border: 'none', borderRadius: '4px',
                  fontFamily: '"Cormorant Garamond", serif', fontSize: '16px', fontWeight: 600,
                  padding: '10px', cursor: stakeText.trim() ? 'pointer' : 'default',
                }}
              >
                {staking ? 'Staking…' : 'Stake +₩50'}
              </button>
              <button
                onClick={() => setStakeTarget(null)}
                style={{
                  padding: '10px 20px', background: 'transparent', border: '1px solid #ccc',
                  borderRadius: '4px', fontFamily: '"DM Mono", monospace', fontSize: '12px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Drawer */}
      {detailFuture && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} onClick={() => setDetailFuture(null)}>
          <div
            style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '480px',
              background: '#0d1c2b', borderLeft: '1px solid rgba(74,158,255,0.25)',
              overflowY: 'auto', padding: '36px 28px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setDetailFuture(null)}
              style={{ background: 'none', border: 'none', color: 'rgba(232,240,248,0.5)', fontSize: '20px', cursor: 'pointer', marginBottom: '24px', display: 'block' }}
            >
              ← Close
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, fontSize: '22px', color: '#e8f0f8', margin: 0, flex: 1 }}>
                {detailFuture.title}
              </h2>
              {detailFuture.arrow_failure_flag && (
                <span title="Arrow aggregation failure" style={{ color: '#ff4444', fontSize: '18px', marginLeft: '12px' }}>⚠</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {(() => {
                const t = allTerritories.find(t => t.id === detailFuture.territory_id);
                return t ? (
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', background: 'rgba(74,158,255,0.2)', color: '#4a9eff', padding: '3px 10px', borderRadius: '99px' }}>
                    {t.name}
                  </span>
                ) : null;
              })()}
              <span style={{
                fontFamily: '"DM Mono", monospace', fontSize: '10px', padding: '3px 10px', borderRadius: '99px',
                background: detailFuture.status === 'open' ? 'rgba(45,80,22,0.4)' : 'rgba(100,100,100,0.3)',
                color: detailFuture.status === 'open' ? '#7dca5a' : '#aaa',
              }}>
                {detailFuture.status}
              </span>
            </div>

            <p style={{ fontFamily: 'Spectral, serif', fontSize: '14px', color: 'rgba(232,240,248,0.7)', lineHeight: 1.6, marginBottom: '24px' }}>
              {detailFuture.description || 'No description provided.'}
            </p>

            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '28px', color: '#4a9eff', marginBottom: '24px' }}>
              ₩ {detailFuture.currency_value.toFixed(1)}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: '#4a9eff', letterSpacing: '0.1em', marginBottom: '12px' }}>
                STAKES ({detailFuture.stakes.length})
              </div>
              {detailFuture.stakes.length === 0 ? (
                <p style={{ fontFamily: 'Spectral, serif', fontStyle: 'italic', fontSize: '13px', color: 'rgba(232,240,248,0.35)' }}>
                  No stakes yet. Be the first to stake.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {detailFuture.stakes.map((stake, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: 'rgba(74,158,255,0.06)', border: '1px solid rgba(74,158,255,0.15)', borderRadius: '4px' }}>
                      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', color: 'rgba(232,240,248,0.35)', marginBottom: '4px', letterSpacing: '0.08em' }}>
                        STAKE · ₩{stake.magnitude}
                      </div>
                      <p style={{ fontFamily: 'Spectral, serif', fontSize: '13px', color: 'rgba(232,240,248,0.75)', margin: 0 }}>
                        {stake.what_they_risk}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => { setStakeTarget(detailFuture); setStakeText(''); setDetailFuture(null); }}
              style={{
                width: '100%', background: 'rgba(201,148,10,0.15)', border: '1px solid rgba(201,148,10,0.4)',
                color: '#c9940a', borderRadius: '4px', fontFamily: '"DM Mono", monospace',
                fontSize: '12px', padding: '12px', cursor: 'pointer',
              }}
            >
              + Add Stake
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type Territory = { id: string; name: string };

function FutureCard({
  future, territories, onViewDetails, onAddStake,
}: {
  future: PossibleWorldsFuture;
  territories: Territory[];
  onViewDetails: (f: PossibleWorldsFuture) => void;
  onAddStake: (f: PossibleWorldsFuture) => void;
}) {
  const territory = territories.find(t => t.id === future.territory_id);
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
        <button
          onClick={() => onViewDetails(future)}
          style={{
            flex: 1, background: 'transparent', border: '1px solid rgba(74,158,255,0.4)',
            color: '#4a9eff', borderRadius: '4px', fontFamily: '"DM Mono", monospace',
            fontSize: '11px', padding: '8px', cursor: 'pointer',
          }}
        >
          View Details ({future.stakes.length})
        </button>
        <button
          onClick={() => onAddStake(future)}
          style={{
            flex: 1, background: 'rgba(201,148,10,0.15)', border: '1px solid rgba(201,148,10,0.4)',
            color: '#c9940a', borderRadius: '4px', fontFamily: '"DM Mono", monospace',
            fontSize: '11px', padding: '8px', cursor: 'pointer',
          }}
        >
          Add Stake
        </button>
      </div>
    </div>
  );
}
