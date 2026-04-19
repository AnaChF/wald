import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useHarvestStore } from '../store';
import LayerEditor from '../components/LayerEditor';
import TreeCanvas from '../components/TreeCanvas';
import type { LayerName, EthicalConstraints } from '../types';

const TABS: { id: LayerName | 'ethics'; label: string }[] = [
  { id: 'roots',    label: 'Roots' },
  { id: 'trunk',    label: 'Trunk' },
  { id: 'branches', label: 'Branches' },
  { id: 'leaves',   label: 'Leaves' },
  { id: 'fruits',   label: 'Fruits' },
  { id: 'ethics',   label: 'Ethics' },
];

const ETHICS_FIELDS: { key: keyof EthicalConstraints; label: string; placeholder: string }[] = [
  {
    key: 'freedom',
    label: 'Freedom',
    placeholder: 'How does this tree protect your autonomy and freedom of choice?',
  },
  {
    key: 'responsibility',
    label: 'Responsibility',
    placeholder: 'What responsibilities do you accept toward others in this domain?',
  },
  {
    key: 'authenticity',
    label: 'Authenticity',
    placeholder: 'How does this tree require you to remain authentic to your values?',
  },
  {
    key: 'solidarity',
    label: 'Solidarity',
    placeholder: 'How does your commitment in this domain extend to others around you?',
  },
  {
    key: 'refusal_of_abandonment',
    label: 'Refusal of Abandonment',
    placeholder: 'What commitments will you not abandon even under pressure?',
  },
];

export default function TreeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { currentTree, loading, createTree, loadTree, updateLayer, setActiveLayer, activeLayer } = useHarvestStore();

  const [activeTab, setActiveTab] = useState<LayerName | 'ethics'>('roots');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [highlightLayer, setHighlightLayer] = useState<LayerName | undefined>(undefined);

  // Handle /tree/new?domain=
  useEffect(() => {
    if (!id) return;

    if (id === 'new') {
      const domain = searchParams.get('domain') ?? 'busyness_park';
      const domainName = domain.replace(/_/g, ' ');
      const title = `My ${domainName.replace(/\b\w/g, (c) => c.toUpperCase())} Tree`;
      createTree(domain, title).then((tree) => {
        navigate(`/tree/${tree.id}`, { replace: true });
      });
    } else {
      loadTree(id);
    }
  }, [id, searchParams, createTree, loadTree, navigate]);

  useEffect(() => {
    if (currentTree) {
      setTitleValue(currentTree.title);
    }
  }, [currentTree]);

  const handleTabChange = (tab: LayerName | 'ethics') => {
    setActiveTab(tab);
    if (tab !== 'ethics') {
      setActiveLayer(tab);
      setHighlightLayer(tab);
    } else {
      setHighlightLayer(undefined);
    }
  };

  const handleNodeClick = useCallback((nodeId: string, layer: LayerName) => {
    setActiveTab(layer);
    setActiveLayer(layer);
    setHighlightLayer(layer);
    // Scroll editor panel to top
    document.getElementById('editor-panel')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActiveLayer]);

  const handleLayerUpdate = useCallback((nodes: unknown[]) => {
    if (!currentTree || activeTab === 'ethics') return;
    updateLayer(currentTree.id, activeTab as LayerName, nodes);
  }, [currentTree, activeTab, updateLayer]);

  const handleEthicsUpdate = useCallback((key: keyof EthicalConstraints, value: string) => {
    if (!currentTree) return;
    const updated = {
      ...currentTree,
      ethical_constraints: {
        ...currentTree.ethical_constraints,
        [key]: value,
      },
      updated_at: new Date().toISOString(),
    };
    useHarvestStore.getState().setCurrentTree(updated);
  }, [currentTree]);

  const handleTitleSave = () => {
    if (!currentTree || !titleValue.trim()) return;
    const updated = { ...currentTree, title: titleValue.trim() };
    useHarvestStore.getState().setCurrentTree(updated);
    setEditingTitle(false);
  };

  if (loading && !currentTree) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-cormorant italic text-3xl text-ht-ochre animate-pulse">Growing…</p>
      </div>
    );
  }

  if (!currentTree) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="font-spectral text-ht-brown">Tree not found.</p>
        <Link to="/" className="text-sm font-spectral text-ht-ochre underline">Go home</Link>
      </div>
    );
  }

  const layerNodes: Record<LayerName, unknown[]> = {
    roots: currentTree.roots,
    trunk: currentTree.trunk,
    branches: currentTree.branches,
    leaves: currentTree.leaves,
    fruits: currentTree.fruits,
  };

  return (
    <div className="flex flex-col min-h-screen bg-ht-cream">
      {/* Title bar */}
      <div className="bg-ht-cream border-b border-ht-ochre/15 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {editingTitle ? (
            <input
              className="font-cormorant italic text-2xl text-ht-brown bg-ht-cream border-b border-ht-ochre focus:outline-none w-80"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              autoFocus
            />
          ) : (
            <h2
              className="font-cormorant italic text-2xl text-ht-brown cursor-pointer hover:text-ht-ochre transition-colors duration-300 truncate"
              onClick={() => setEditingTitle(true)}
              title="Click to rename"
            >
              {currentTree.title}
            </h2>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            className="font-spectral text-xs border border-ht-brown/30 text-ht-brown/70 px-3 py-1.5 rounded hover:border-ht-ochre hover:text-ht-ochre transition-all duration-300"
            onClick={() => {/* Walditorium audit stub */}}
          >
            Audit with Walditorium
          </button>
          <Link
            to={`/tree/${currentTree.id}/report`}
            className="font-spectral text-xs border border-ht-ochre text-ht-ochre px-3 py-1.5 rounded hover:bg-ht-ochre hover:text-white transition-all duration-300"
          >
            Export Report
          </Link>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 112px)' }}>
        {/* Left: Editor panel */}
        <div
          id="editor-panel"
          className="w-[38%] border-r border-ht-ochre/15 flex flex-col overflow-hidden"
        >
          {/* Tab bar */}
          <div className="flex border-b border-ht-ochre/15 bg-white/40 overflow-x-auto flex-shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-3 font-spectral text-xs whitespace-nowrap transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? 'border-ht-ochre text-ht-ochre bg-ht-cream'
                    : 'border-transparent text-ht-brown/60 hover:text-ht-brown hover:bg-white/30'
                }`}
              >
                {tab.label}
                {tab.id !== 'ethics' && (
                  <span className="ml-1.5 text-ht-brown/30 font-light">
                    ({(layerNodes[tab.id as LayerName] as unknown[]).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Editor content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'ethics' ? (
              <div className="space-y-4">
                <p className="font-spectral text-xs text-ht-brown/50 italic pb-2">
                  These five constraints define the ethical boundaries within which your tree operates.
                </p>
                {ETHICS_FIELDS.map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-spectral font-semibold uppercase tracking-wider text-ht-ochre mb-1.5">
                      {label}
                    </label>
                    <textarea
                      className="w-full font-spectral text-sm bg-ht-cream border border-ht-ochre/25 rounded-lg p-3 text-ht-brown resize-none focus:outline-none focus:border-ht-ochre transition-colors duration-300"
                      rows={4}
                      value={currentTree.ethical_constraints[key]}
                      onChange={(e) => handleEthicsUpdate(key, e.target.value)}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <LayerEditor
                layer={activeTab as LayerName}
                nodes={layerNodes[activeTab as LayerName]}
                onUpdate={handleLayerUpdate}
                tree={currentTree}
              />
            )}
          </div>
        </div>

        {/* Right: Canvas */}
        <div className="flex-1 overflow-y-auto bg-ht-cream/50 flex flex-col">
          <div className="flex-1 p-4 flex items-start justify-center">
            <div className="w-full max-w-4xl">
              <TreeCanvas
                tree={currentTree}
                highlightLayer={highlightLayer}
                onNodeClick={handleNodeClick}
              />
            </div>
          </div>

          {/* Lens toggles */}
          <div className="border-t border-ht-ochre/10 px-6 py-3 flex items-center gap-3 flex-shrink-0">
            <span className="font-spectral text-xs text-ht-brown/40 mr-1">Ethical lenses:</span>
            {[
              { id: 'freedom',      label: 'Freedom',      color: '#4466ff' },
              { id: 'solidarity',   label: 'Solidarity',   color: '#ff8822' },
              { id: 'authenticity', label: 'Authenticity', color: '#9944ff' },
            ].map((lens) => {
              const { activeLenses, toggleLens } = useHarvestStore.getState();
              const active = activeLenses.includes(lens.id);
              return (
                <button
                  key={lens.id}
                  onClick={() => toggleLens(lens.id)}
                  className={`font-spectral text-xs px-3 py-1 rounded-full border transition-all duration-300 ${
                    active ? 'text-white' : 'text-ht-brown/60 border-ht-brown/20 hover:border-ht-brown/40'
                  }`}
                  style={active ? { background: lens.color, borderColor: lens.color } : {}}
                >
                  {lens.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
