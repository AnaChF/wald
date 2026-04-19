import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

// Icons as inline SVGs to avoid external icon lib dependency
function IconPencil() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconSeal() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

function IconLeaf() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Submit', icon: <IconPencil /> },
  { to: '/stamps', label: 'My Stamps', icon: <IconSeal /> },
  { to: '/about', label: 'About', icon: <IconLeaf /> },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--wald-forest)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 z-20"
        style={{
          width: '64px',
          minHeight: '100vh',
          backgroundColor: '#0a1a0a',
          borderRight: '1px solid rgba(201,148,10,0.15)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-center"
          style={{ height: '64px', borderBottom: '1px solid rgba(201,148,10,0.15)' }}
        >
          <span
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontWeight: 600,
              fontSize: '1.75rem',
              color: 'var(--wald-ochre)',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            W
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col items-center gap-1 mt-4 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  color: isActive ? 'var(--wald-ochre)' : 'rgba(245,240,232,0.45)',
                  backgroundColor: isActive ? 'rgba(201,148,10,0.12)' : 'transparent',
                  transition: 'color 0.2s, background-color 0.2s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.8)';
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.45)';
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }
                }}
              >
                {item.icon}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom label */}
        <div
          className="flex items-center justify-center pb-4"
          style={{ opacity: 0.2 }}
        >
          <span
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '0.5rem',
              color: 'var(--wald-parchment)',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              letterSpacing: '0.1em',
            }}
          >
            WALDITORIUM
          </span>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto" style={{ backgroundColor: 'var(--wald-forest)' }}>
        {children}
      </main>
    </div>
  );
}
