import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, getWalditoriumSessions, getHarvestTrees } from '../api';
import { useCanopyStore } from '../store';

type ImportMode = 'walditorium' | 'harvest' | null;

interface AuditStub { id: string; input_type: string; created_at: string; bolts?: unknown[]; bricks?: unknown[]; }
interface TreeStub { id: string; title: string; domain: string; roots?: string[]; trunk?: string[]; }

export function SessionFramingPage() {
  const navigate = useNavigate();
  const setSession = useCanopyStore((s) => s.setSession);

  const [question, setQuestion] = useState('');
  const [title, setTitle] = useState('');
  const [years, setYears] = useState(10);
  const [unit, setUnit] = useState<'years' | 'decades'>('years');
  const [centre, setCentre] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>(null);
  const [importedAudit, setImportedAudit] = useState<AuditStub | null>(null);
  const [importedTree, setImportedTree] = useState<TreeStub | null>(null);
  const [auditList, setAuditList] = useState<AuditStub[]>([]);
  const [treeList, setTreeList] = useState<TreeStub[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userId = localStorage.getItem('wald_user_id') ?? '';
  const effectiveYears = unit === 'decades' ? years * 10 : years;

  const openImport = async (mode: ImportMode) => {
    setImportMode(mode);
    setImportLoading(true);
    try {
      if (mode === 'walditorium') {
        const sessions = await getWalditoriumSessions(userId);
        setAuditList(sessions as unknown as AuditStub[]);
      } else if (mode === 'harvest') {
        const trees = await getHarvestTrees(userId);
        setTreeList(trees as unknown as TreeStub[]);
      }
    } catch {
      // non-fatal — user can still proceed without import
    } finally {
      setImportLoading(false);
    }
  };

  const selectAudit = (audit: AuditStub) => {
    setImportedAudit(audit);
    setImportMode(null);
  };

  const selectTree = (tree: TreeStub) => {
    setImportedTree(tree);
    setImportMode(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError('');
    try {
      const session = await createSession({
        title: title || undefined,
        foresight_question: question,
        centre_description: centre || undefined,
        time_horizon_years: effectiveYears,
        audit_result_seed: importedAudit ?? undefined,
        brick_seed: importedTree ?? undefined,
      } as any);
      setSession(session);
      navigate(`/canopy/session/${session.id}/signals`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'rgba(245,240,232,0.06)',
    border: '1px solid rgba(245,240,232,0.15)',
    color: 'var(--parchment-text)',
    outline: 'none',
  } as const;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div
        className="w-full max-w-xl rounded-2xl px-10 py-12"
        style={{ background: 'rgba(245,240,232,0.05)', border: '1px solid rgba(245,240,232,0.1)' }}
      >
        <h1 className="font-cormorant font-light text-4xl mb-3" style={{ color: 'var(--parchment-text)' }}>
          What futures are you trying to see?
        </h1>
        <p className="font-spectral text-sm mb-10" style={{ color: 'rgba(245,240,232,0.4)' }}>
          Canopy begins with a question. Name it as specifically as you can.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Foresight question */}
          <div>
            <label className="block font-mono-dm mb-2" style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Foresight question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What futures are available to me given…"
              rows={4}
              required
              className="w-full rounded-lg px-4 py-3 font-spectral text-base resize-none"
              style={inputStyle}
            />
          </div>

          {/* Session title */}
          <div>
            <label className="block font-mono-dm mb-2" style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Session title (optional)
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name this session"
              className="w-full rounded-lg px-4 py-3 font-spectral text-base"
              style={inputStyle}
            />
          </div>

          {/* Time horizon */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block font-mono-dm mb-2" style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Time horizon
              </label>
              <input
                type="number" value={years} min={1} max={100}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full rounded-lg px-4 py-3 font-mono-dm text-base"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block font-mono-dm mb-2" style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'years' | 'decades')}
                className="rounded-lg px-3 py-3 font-mono-dm"
                style={{ ...inputStyle, background: 'rgba(245,240,232,0.08)' }}
              >
                <option value="years">years</option>
                <option value="decades">decades</option>
              </select>
            </div>
          </div>

          {/* Centre */}
          <div>
            <label className="block font-mono-dm mb-2" style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Your centre (optional)
            </label>
            <input
              value={centre}
              onChange={(e) => setCentre(e.target.value)}
              placeholder="Describe your position, context, or perspective"
              className="w-full rounded-lg px-4 py-3 font-spectral text-base"
              style={inputStyle}
            />
            <p className="mt-1 font-spectral text-xs" style={{ color: 'rgba(245,240,232,0.28)', fontStyle: 'italic' }}>
              Where you stand shapes what you can see.
            </p>
          </div>

          {/* Cross-app imports */}
          {userId && (
            <div>
              <label className="block font-mono-dm mb-3" style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Import from Wald™ ecosystem (optional)
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => openImport('walditorium')}
                  className="flex-1 py-2.5 rounded-lg font-spectral text-sm transition-slow"
                  style={{
                    background: importedAudit ? 'rgba(45,96,72,0.2)' : 'rgba(245,240,232,0.04)',
                    border: `1px solid ${importedAudit ? 'rgba(45,96,72,0.5)' : 'rgba(245,240,232,0.12)'}`,
                    color: importedAudit ? 'var(--positive)' : 'rgba(245,240,232,0.45)',
                  }}
                >
                  {importedAudit ? `✓ Walditorium™ imported` : 'Import from Walditorium™'}
                </button>
                <button
                  type="button"
                  onClick={() => openImport('harvest')}
                  className="flex-1 py-2.5 rounded-lg font-spectral text-sm transition-slow"
                  style={{
                    background: importedTree ? 'rgba(45,96,72,0.2)' : 'rgba(245,240,232,0.04)',
                    border: `1px solid ${importedTree ? 'rgba(45,96,72,0.5)' : 'rgba(245,240,232,0.12)'}`,
                    color: importedTree ? 'var(--positive)' : 'rgba(245,240,232,0.45)',
                  }}
                >
                  {importedTree ? `✓ ${importedTree.title} imported` : 'Import from Harvest Trees™'}
                </button>
              </div>
              {(importedAudit || importedTree) && (
                <div
                  className="mt-3 rounded-lg px-4 py-3"
                  style={{ background: 'rgba(45,96,72,0.08)', border: '1px solid rgba(45,96,72,0.2)' }}
                >
                  {importedAudit && (
                    <p className="font-mono-dm" style={{ fontSize: 10, color: 'var(--positive)' }}>
                      Walditorium session {importedAudit.id.slice(0, 8)}… · BOLTs and BRICKs will seed the Signal Observatory
                    </p>
                  )}
                  {importedTree && (
                    <p className="font-mono-dm mt-1" style={{ fontSize: 10, color: 'var(--positive)' }}>
                      Harvest Tree “{importedTree.title}” · Roots will appear as Weight signals in the Futures Triangle
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="font-mono-dm text-sm" style={{ color: '#D4A843' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="w-full py-4 rounded-lg font-cormorant text-xl font-light transition-slow"
            style={{
              background: loading || !question.trim() ? 'rgba(45,96,72,0.1)' : 'rgba(45,96,72,0.3)',
              border: '1px solid rgba(45,96,72,0.5)',
              color: loading || !question.trim() ? 'rgba(245,240,232,0.3)' : 'var(--parchment-text)',
              cursor: loading || !question.trim() ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Opening…' : 'Open this session'}
          </button>
        </form>
      </div>

      {/* Import modal */}
      {importMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(10,26,14,0.88)' }}
          onClick={() => setImportMode(null)}
        >
          <div
            className="w-full max-w-md rounded-xl px-8 py-8"
            style={{ background: 'var(--bg-panel)', color: 'var(--ink)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-cormorant font-semibold text-2xl mb-1">
              {importMode === 'walditorium' ? 'Walditorium™ sessions' : 'Harvest Trees™'}
            </h2>
            <p className="font-spectral text-sm mb-6" style={{ color: 'rgba(28,28,28,0.5)', fontStyle: 'italic' }}>
              {importMode === 'walditorium'
                ? 'Select an audit session to seed Canopy with its BOLTs and BRICKs.'
                : 'Select a Harvest Tree to import its Roots as Weight signals.'}
            </p>

            {importLoading && (
              <p className="font-mono-dm text-sm" style={{ color: 'rgba(28,28,28,0.4)' }}>Loading…</p>
            )}

            {!importLoading && importMode === 'walditorium' && (
              auditList.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {auditList.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => selectAudit(a)}
                      className="w-full text-left px-4 py-3 rounded-lg transition-slow"
                      style={{ background: 'rgba(28,28,28,0.06)', border: '1px solid rgba(28,28,28,0.1)' }}
                    >
                      <p className="font-spectral text-sm font-semibold">
                        {a.input_type} audit
                      </p>
                      <p className="font-mono-dm" style={{ fontSize: 10, color: 'rgba(28,28,28,0.4)' }}>
                        {new Date(a.created_at).toLocaleDateString('en-GB')} · {(a.bolts as unknown[])?.length ?? 0} BOLTs · {(a.bricks as unknown[])?.length ?? 0} BRICKs
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="font-spectral text-sm" style={{ color: 'rgba(28,28,28,0.4)' }}>
                  No Walditorium sessions found.
                </p>
              )
            )}

            {!importLoading && importMode === 'harvest' && (
              treeList.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {treeList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => selectTree(t)}
                      className="w-full text-left px-4 py-3 rounded-lg transition-slow"
                      style={{ background: 'rgba(28,28,28,0.06)', border: '1px solid rgba(28,28,28,0.1)' }}
                    >
                      <p className="font-spectral text-sm font-semibold">{t.title}</p>
                      <p className="font-mono-dm" style={{ fontSize: 10, color: 'rgba(28,28,28,0.4)' }}>
                        {t.domain} · {(t.roots as unknown[])?.length ?? 0} roots
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="font-spectral text-sm" style={{ color: 'rgba(28,28,28,0.4)' }}>
                  No Harvest Trees found.
                </p>
              )
            )}

            <button
              onClick={() => setImportMode(null)}
              className="mt-6 w-full py-2 rounded font-cormorant font-light text-base"
              style={{ background: 'rgba(28,28,28,0.08)', color: 'rgba(28,28,28,0.5)' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
