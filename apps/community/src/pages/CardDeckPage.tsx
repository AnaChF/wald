import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { EpistemicCard } from '../components/EpistemicCard';
import { MOCK_TERRITORIES } from '../mockData';

export function CardDeckPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cards, currentCardIndex, loadCards, advanceCard, prevCard, completeAction, territories } = useStore();
  const [showToast, setShowToast] = useState(false);

  const territory = [...territories, ...MOCK_TERRITORIES].find(t => t.id === id);

  useEffect(() => {
    if (id) loadCards(id);
  }, [id]);

  const handleComplete = async (actionId: string) => {
    await completeAction(actionId);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const currentCard = cards[currentCardIndex];

  const ZONE_BG: Record<string, string> = {
    arrivals_departures: '#1a1209',
    civic_centre: '#2d3d1a',
    science_fair: '#0f1824',
    commonwealth: '#1a0a2e',
  };
  const bg = territory ? (ZONE_BG[territory.zone] || '#1a1209') : '#1a1209';

  return (
    <div style={{ background: bg, minHeight: '100vh', color: '#f5e6c8', padding: '0 0 60px' }}>
      {/* Back link */}
      <div style={{ padding: '20px 32px' }}>
        <Link to="/territories" style={{
          fontFamily: '"DM Mono", monospace', fontSize: '11px',
          color: 'rgba(245,230,200,0.6)', textDecoration: 'none',
          letterSpacing: '0.08em',
        }}>
          ← TERRITORIES
        </Link>
      </div>

      {/* Territory name */}
      {territory && (
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <h2 style={{
            fontFamily: '"Cormorant Garamond", serif', fontWeight: 600,
            fontSize: '28px', margin: 0,
          }}>
            {territory.name}
          </h2>
        </div>
      )}

      {/* Progress bar */}
      {cards.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.1)', height: '3px', margin: '0 32px 32px' }}>
          <div style={{
            width: `${((currentCardIndex + 1) / cards.length) * 100}%`,
            height: '100%', background: '#c9940a',
            transition: 'width 0.5s ease',
          }} />
        </div>
      )}

      {/* Card */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        {currentCard ? (
          <EpistemicCard
            card={currentCard}
            cardNumber={currentCardIndex + 1}
            totalCards={cards.length}
            onComplete={handleComplete}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'Spectral, serif', opacity: 0.6 }}>
            No cards available for this territory.
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button
            onClick={prevCard}
            disabled={currentCardIndex === 0}
            style={{
              background: 'transparent', border: '1px solid rgba(245,230,200,0.4)',
              color: '#f5e6c8', borderRadius: '99px',
              fontFamily: '"DM Mono", monospace', fontSize: '12px',
              padding: '8px 20px', cursor: currentCardIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentCardIndex === 0 ? 0.3 : 1,
              transition: 'opacity 0.3s',
            }}
          >
            ← Previous
          </button>
          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', opacity: 0.5 }}>
            {currentCardIndex + 1} / {cards.length}
          </span>
          <button
            onClick={advanceCard}
            disabled={currentCardIndex >= cards.length - 1}
            style={{
              background: currentCardIndex < cards.length - 1 ? '#c9940a' : 'transparent',
              border: '1px solid rgba(201,148,10,0.6)',
              color: '#fff', borderRadius: '99px',
              fontFamily: '"DM Mono", monospace', fontSize: '12px',
              padding: '8px 20px',
              cursor: currentCardIndex >= cards.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentCardIndex >= cards.length - 1 ? 0.3 : 1,
              transition: 'all 0.3s',
            }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          background: '#2d5016', color: '#fff', borderRadius: '4px',
          fontFamily: '"DM Mono", monospace', fontSize: '13px',
          padding: '12px 24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          animation: 'forest-fade 0.3s ease-in',
        }}>
          ✓ Action noted — +10 citizenship points
        </div>
      )}
    </div>
  );
}
