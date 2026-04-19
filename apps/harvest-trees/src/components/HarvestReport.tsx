import type { HarvestTree } from '../types';
import { DOMAIN_INFO } from '../mockData';

interface HarvestReportProps {
  tree: HarvestTree;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function HarvestReport({ tree }: HarvestReportProps) {
  const domainInfo = DOMAIN_INFO.find((d) => d.id === tree.domain);
  const negotiableRoots = tree.roots.filter((r) => r.is_negotiable);

  const layers = [
    { name: 'Roots',    count: tree.roots.length },
    { name: 'Trunk',    count: tree.trunk.length },
    { name: 'Branches', count: tree.branches.length },
    { name: 'Leaves',   count: tree.leaves.length },
    { name: 'Fruits',   count: tree.fruits.length },
  ];

  const ethicsFields: { key: keyof typeof tree.ethical_constraints; label: string }[] = [
    { key: 'freedom',              label: 'Freedom' },
    { key: 'responsibility',       label: 'Responsibility' },
    { key: 'authenticity',         label: 'Authenticity' },
    { key: 'solidarity',           label: 'Solidarity' },
    { key: 'refusal_of_abandonment', label: 'Refusal of Abandonment' },
  ];

  return (
    <div className="bg-white max-w-3xl mx-auto p-10 font-spectral text-ht-brown print:p-8 print:max-w-none">
      {/* Print styles injected via style tag */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      {/* Header */}
      <div className="border-b-2 border-ht-ochre pb-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs tracking-widest text-ht-ochre font-semibold uppercase mb-2">
              Harvest Trees™ Report
            </p>
            <h1 className="font-cormorant italic text-4xl font-semibold text-ht-brown leading-tight">
              {tree.title}
            </h1>
            {domainInfo && (
              <p className="mt-2 text-sm text-ht-brown/60">
                {domainInfo.icon} {domainInfo.name} — {domainInfo.tagline}
              </p>
            )}
          </div>
          <div className="text-right text-xs text-ht-brown/50 space-y-1">
            <p>Created: {formatDate(tree.created_at)}</p>
            <p>Updated: {formatDate(tree.updated_at)}</p>
            {tree.last_audited_at && <p>Audited: {formatDate(tree.last_audited_at)}</p>}
          </div>
        </div>
      </div>

      {/* Layer counts */}
      <section className="mb-8">
        <h2 className="font-cormorant italic text-2xl text-ht-brown mb-4">Structure Summary</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-ht-ochre/20">
              <th className="text-left py-2 pr-4 font-semibold text-ht-brown/70">Layer</th>
              <th className="text-right py-2 font-semibold text-ht-brown/70">Nodes</th>
            </tr>
          </thead>
          <tbody>
            {layers.map((l) => (
              <tr key={l.name} className="border-b border-ht-ochre/10 hover:bg-ht-cream/50">
                <td className="py-2 pr-4">{l.name}</td>
                <td className="py-2 text-right font-semibold">{l.count}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-ht-ochre/30">
              <td className="py-2 pr-4 font-semibold">Total</td>
              <td className="py-2 text-right font-semibold">
                {layers.reduce((sum, l) => sum + l.count, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Negotiable roots warning */}
      {negotiableRoots.length > 0 && (
        <section className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-5">
          <h3 className="font-semibold text-amber-800 mb-2">
            ⚠ Negotiable Roots Detected
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            The following roots are marked as negotiable. Consider whether these truly represent core values or contextual commitments.
          </p>
          <ul className="space-y-1">
            {negotiableRoots.map((r) => (
              <li key={r.id} className="text-sm text-amber-900">
                • {r.text} <span className="text-amber-500">({r.type} · {r.waldconsistency_level})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Roots */}
      {tree.roots.length > 0 && (
        <section className="mb-8">
          <h2 className="font-cormorant italic text-2xl text-ht-brown mb-4">Roots</h2>
          <div className="space-y-3">
            {tree.roots.map((root) => (
              <div key={root.id} className="border-l-4 border-ht-root pl-4 py-1">
                <p className="text-sm font-semibold">{root.text}</p>
                <p className="text-xs text-ht-brown/50 mt-0.5">
                  {root.type} · {root.waldconsistency_level}
                  {root.is_negotiable ? ' · negotiable' : ' · non-negotiable'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trunk */}
      {tree.trunk.length > 0 && (
        <section className="mb-8">
          <h2 className="font-cormorant italic text-2xl text-ht-brown mb-4">Trunk</h2>
          <div className="space-y-3">
            {tree.trunk.map((node) => (
              <div key={node.id} className="border-l-4 border-ht-trunk pl-4 py-1">
                <p className="text-sm font-semibold">{node.text}</p>
                <p className="text-xs text-ht-brown/50 mt-0.5">{node.waldconsistency_level}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Branches */}
      {tree.branches.length > 0 && (
        <section className="mb-8">
          <h2 className="font-cormorant italic text-2xl text-ht-brown mb-4">Branches</h2>
          <div className="space-y-3">
            {tree.branches.map((branch) => (
              <div key={branch.id} className="border-l-4 border-ht-branch pl-4 py-1">
                <p className="text-xs text-ht-brown/50 font-semibold uppercase tracking-wide mb-0.5">{branch.territory}</p>
                <p className="text-sm">{branch.text}</p>
                <p className="text-xs text-ht-brown/40 mt-0.5">{branch.waldconsistency_level}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Leaves */}
      {tree.leaves.length > 0 && (
        <section className="mb-8">
          <h2 className="font-cormorant italic text-2xl text-ht-brown mb-4">Leaves — Practices</h2>
          <div className="space-y-2">
            {tree.leaves.map((leaf) => (
              <div key={leaf.id} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex-shrink-0 w-16 text-xs text-ht-branch font-semibold uppercase">{leaf.frequency}</span>
                <span>{leaf.practice}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fruits */}
      {tree.fruits.length > 0 && (
        <section className="mb-8">
          <h2 className="font-cormorant italic text-2xl text-ht-brown mb-4">Fruits — Outcomes</h2>
          <div className="space-y-4">
            {tree.fruits.map((fruit) => (
              <div key={fruit.id} className="border border-ht-ochre/30 rounded-lg p-4">
                <p className="font-semibold text-sm mb-1">{fruit.outcome}</p>
                <p className="text-xs text-ht-brown/60">Measured by: {fruit.measured_by}</p>
                <p className="text-xs text-ht-brown/40 mt-0.5">Visibility: {fruit.visibility} · {fruit.waldconsistency_level}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ethical constraints */}
      <section className="mb-8">
        <h2 className="font-cormorant italic text-2xl text-ht-brown mb-4">Ethical Constraints</h2>
        <div className="space-y-5">
          {ethicsFields.map(({ key, label }) => (
            <div key={key} className="border-b border-ht-ochre/15 pb-4 last:border-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-ht-ochre mb-2">{label}</p>
              <p className="text-sm leading-relaxed">
                {tree.ethical_constraints[key] || <span className="italic text-ht-brown/30">Not defined</span>}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Audit info */}
      {tree.audit_stamp_id && (
        <section className="mb-8 bg-ht-cream rounded-lg p-4">
          <p className="text-xs text-ht-brown/60">
            Walditorium Audit Stamp: <code className="font-mono text-ht-ochre">{tree.audit_stamp_id}</code>
          </p>
        </section>
      )}

      {/* Footer */}
      <div className="border-t border-ht-ochre/20 pt-6 flex items-center justify-between">
        <p className="text-xs text-ht-brown/40 italic">
          Generated by Harvest Trees™ — part of the Wald™ ecosystem
        </p>
        <button
          onClick={() => window.print()}
          className="no-print font-spectral text-sm border border-ht-ochre text-ht-ochre px-5 py-2 rounded hover:bg-ht-ochre hover:text-white transition-all duration-300"
        >
          Print / Export PDF
        </button>
      </div>
    </div>
  );
}
