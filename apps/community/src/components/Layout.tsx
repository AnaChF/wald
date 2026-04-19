import React from 'react';
import { NavLink } from 'react-router-dom';
import type { Zone } from '../types';

const ZONE_STYLES: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  arrivals_departures: { bg: '#1a1209', text: '#f5e6c8', border: '#c9940a33', accent: '#c9940a' },
  civic_centre:        { bg: '#e8e0d0', text: '#2d5016',  border: '#2d501633', accent: '#2d5016' },
  commonwealth:        { bg: '#1a0a2e', text: '#e8d8f8',  border: '#6b3fa033', accent: '#9b59f0' },
  science_fair:        { bg: '#0f1824', text: '#e8f0f8',  border: '#4a9eff33', accent: '#4a9eff' },
  walden:              { bg: '#0a1509', text: '#f5e6c8',  border: '#c9940a33', accent: '#c9940a' },
};

interface LayoutProps {
  children: React.ReactNode;
  zone?: Zone | 'walden';
}

export function Layout({ children, zone = 'walden' }: LayoutProps) {
  const s = ZONE_STYLES[zone] || ZONE_STYLES.walden;

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? s.accent : s.text,
    textDecoration: isActive ? 'underline' : 'none',
    fontFamily: '"DM Mono", monospace',
    fontSize: '12px',
    letterSpacing: '0.08em',
    padding: '4px 0',
    opacity: isActive ? 1 : 0.7,
    transition: 'opacity 0.2s',
  });

  return (
    <div style={{ background: s.bg, minHeight: '100vh', color: s.text }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: '60px',
        borderBottom: `1px solid ${s.border}`,
        position: 'sticky', top: 0, zIndex: 100,
        background: s.bg,
      }}>
        <NavLink to="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, fontSize: '20px',
            color: s.accent, letterSpacing: '0.15em',
          }}>
            WALD™
          </span>
        </NavLink>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <NavLink to="/territories" style={navLinkStyle}>TERRITORIES</NavLink>
          <NavLink to="/character" style={navLinkStyle}>CHARACTER</NavLink>
          <NavLink to="/pwtc" style={navLinkStyle}>PWTC</NavLink>
          <NavLink to="/journey" style={navLinkStyle}>JOURNEY</NavLink>
        </div>
      </nav>
      <main style={{ minHeight: 'calc(100vh - 60px)' }}>
        {children}
      </main>
    </div>
  );
}
