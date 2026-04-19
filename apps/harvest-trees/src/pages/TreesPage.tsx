import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHarvestStore } from '../store';
import { DOMAIN_INFO, MOCK_TREE } from '../mockData';

function formatRelativeDate(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`;
  } catch {
    return '';
  }
}

export default function TreesPage() {
  const navigate = useNavigate();
  const { userTrees, loading, loadUserTrees } = useHarvestStore();

  useEffect(() => {
    loadUserTrees('mock-user-001');
  }, [loadUserTrees]);

  const displayTrees = userTrees.length > 0 ? userTrees : [MOCK_TREE];

  return (
    <div className="min-h-screen bg-ht-cream px-6 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="font-cormorant italic text-5xl text-ht-brown leading-none">
              My Trees
            </h1>
            <p className="font-spectral text-sm text-ht-brown/50 mt-2">
              {displayTrees.length} tree{displayTrees.length !== 1 ? 's' : ''} planted
            </p>
          </div>
          <Link
            to="/"
            className="font-spectral text-sm border border-ht-ochre text-ht-ochre px-5 py-2.5 rounded hover:bg-ht-ochre hover:text-white transition-all duration-300"
          >
            + New Tree
          </Link>
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="font-cormorant italic text-2xl text-ht-ochre animate-pulse">Loading your trees…</p>
          </div>
        )}

        {/* Tree grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayTrees.map((tree) => {
            const info = DOMAIN_INFO.find((d) => d.id === tree.domain);
            const totalNodes =
              tree.roots.length + tree.trunk.length + tree.branches.length +
              tree.leaves.length + tree.fruits.length;

            return (
              <button
                key={tree.id}
                onClick={() => navigate(`/tree/${tree.id}`)}
                className="text-left bg-white/70 border border-ht-ochre/20 rounded-2xl p-6 hover:border-ht-ochre hover:shadow-lg hover:shadow-ht-ochre/10 hover:-translate-y-1 transition-all duration-400 group"
              >
                {/* Domain badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{info?.icon ?? '🌳'}</span>
                  <span
                    className="text-xs font-spectral px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: `${info?.color ?? '#c9940a'}18`,
                      color: info?.color ?? '#c9940a',
                    }}
                  >
                    {info?.name ?? tree.domain}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-cormorant italic text-xl text-ht-brown group-hover:text-ht-ochre transition-colors duration-300 leading-tight mb-1">
                  {tree.title}
                </h3>

                {/* Layer counts */}
                <div className="mt-4 grid grid-cols-5 gap-1 text-center">
                  {[
                    { label: 'R', count: tree.roots.length,    title: 'Roots' },
                    { label: 'T', count: tree.trunk.length,    title: 'Trunk' },
                    { label: 'B', count: tree.branches.length, title: 'Branches' },
                    { label: 'L', count: tree.leaves.length,   title: 'Leaves' },
                    { label: 'F', count: tree.fruits.length,   title: 'Fruits' },
                  ].map(({ label, count, title }) => (
                    <div key={label} className="flex flex-col items-center" title={title}>
                      <span className="text-sm font-semibold text-ht-brown">{count}</span>
                      <span className="text-xs text-ht-brown/30 font-spectral">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-ht-ochre/10 flex items-center justify-between text-xs font-spectral text-ht-brown/40">
                  <span>{totalNodes} nodes</span>
                  <span>{formatRelativeDate(tree.updated_at)}</span>
                </div>
              </button>
            );
          })}

          {/* New tree card */}
          <button
            onClick={() => navigate('/')}
            className="border-2 border-dashed border-ht-ochre/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-ht-ochre hover:bg-ht-ochre/5 transition-all duration-400 group min-h-[200px]"
          >
            <span className="text-3xl opacity-40 group-hover:opacity-70 transition-opacity">🌱</span>
            <p className="font-cormorant italic text-lg text-ht-brown/40 group-hover:text-ht-ochre transition-colors duration-300">
              Plant a new tree
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
