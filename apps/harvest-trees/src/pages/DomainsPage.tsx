import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DomainCard from '../components/DomainCard';
import { DOMAIN_INFO, MOCK_TREE } from '../mockData';
import { useHarvestStore } from '../store';
import type { Domain } from '../types';

export default function DomainsPage() {
  const navigate = useNavigate();
  const { userTrees, loadUserTrees, createTree } = useHarvestStore();
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [stampId, setStampId] = useState('');
  const [importing, setImporting] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUserTrees('mock-user-001');
  }, [loadUserTrees]);

  async function handleDomainClick(domainId: Domain) {
    setSelectedDomain(domainId);

    // Check if a tree already exists for this domain
    const existing = userTrees.find((t) => t.domain === domainId);
    if (existing) {
      navigate(`/tree/${existing.id}`);
      return;
    }

    // Navigate to demo tree for busyness_park
    if (domainId === MOCK_TREE.domain) {
      navigate(`/tree/${MOCK_TREE.id}`);
      return;
    }

    // Create new tree
    setCreating(true);
    try {
      const domainInfo = DOMAIN_INFO.find((d) => d.id === domainId);
      const title = `My ${domainInfo?.name ?? domainId} Tree`;
      const tree = await createTree(domainId, title);
      navigate(`/tree/${tree.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleImport() {
    if (!stampId.trim()) return;
    setImporting(true);
    try {
      // Fall back to demo tree when no backend
      navigate(`/tree/${stampId.trim()}`);
    } finally {
      setImporting(false);
      setStampId('');
    }
  }

  const displayTrees = userTrees.length > 0 ? userTrees : [MOCK_TREE];

  return (
    <div className="min-h-screen bg-ht-cream px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="font-cormorant italic text-7xl font-light text-ht-brown leading-none tracking-tight mb-4">
          HARVEST TREES™
        </h1>
        <p className="font-spectral text-xl text-ht-brown/60 italic">
          Plant what you value. Grow what you live.
        </p>
        <div className="mt-6 w-24 h-px bg-ht-ochre/40 mx-auto" />
      </div>

      {/* Choose domain */}
      <div className="max-w-5xl mx-auto mb-16">
        <h2 className="font-cormorant italic text-3xl text-ht-brown mb-2 text-center">
          Choose your life territory
        </h2>
        <p className="text-center font-spectral text-sm text-ht-brown/50 mb-10">
          Each domain hosts a separate Harvest Tree rooted in its own values.
        </p>

        {(creating) && (
          <div className="text-center py-4 mb-6">
            <p className="font-spectral text-sm text-ht-ochre italic">Creating your tree…</p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-5">
          {DOMAIN_INFO.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              onClick={() => handleDomainClick(domain.id)}
              selected={selectedDomain === domain.id}
            />
          ))}
        </div>
      </div>

      {/* Import section */}
      <div className="max-w-lg mx-auto mb-16">
        <div className="border border-ht-ochre/20 rounded-xl p-6 bg-white/40 backdrop-blur-sm">
          <h3 className="font-cormorant italic text-xl text-ht-brown mb-1">
            Import from Walditorium
          </h3>
          <p className="font-spectral text-xs text-ht-brown/50 mb-4">
            Enter your Audit Stamp ID to import a verified tree structure.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 font-spectral text-sm bg-ht-cream border border-ht-ochre/30 rounded px-3 py-2 text-ht-brown placeholder:text-ht-brown/30 focus:outline-none focus:border-ht-ochre"
              placeholder="Stamp ID (e.g. WLDT-2026-XXXXX)"
              value={stampId}
              onChange={(e) => setStampId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleImport()}
            />
            <button
              onClick={handleImport}
              disabled={importing || !stampId.trim()}
              className="font-spectral text-sm border border-ht-ochre text-ht-ochre px-5 py-2 rounded hover:bg-ht-ochre hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {importing ? 'Importing…' : 'Import'}
            </button>
          </div>
        </div>
      </div>

      {/* Existing trees */}
      <div className="max-w-5xl mx-auto">
        <h3 className="font-cormorant italic text-2xl text-ht-brown mb-6 text-center">
          Your Trees
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTrees.map((tree) => {
            const info = DOMAIN_INFO.find((d) => d.id === tree.domain);
            return (
              <button
                key={tree.id}
                onClick={() => navigate(`/tree/${tree.id}`)}
                className="text-left bg-white/60 border border-ht-ochre/20 rounded-xl p-5 hover:border-ht-ochre hover:shadow-md hover:shadow-ht-ochre/10 transition-all duration-400 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{info?.icon ?? '🌳'}</span>
                  <div>
                    <p className="font-cormorant italic text-lg text-ht-brown group-hover:text-ht-ochre transition-colors duration-300">
                      {tree.title}
                    </p>
                    <p className="text-xs font-spectral text-ht-brown/50">{info?.name}</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs font-spectral text-ht-brown/50">
                  <span>{tree.roots.length} roots</span>
                  <span>{tree.branches.length} branches</span>
                  <span>{tree.fruits.length} fruits</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
