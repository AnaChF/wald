import { useState } from 'react';
import type {
  LayerName,
  Root,
  TrunkNode,
  Branch,
  Leaf,
  Fruit,
  HarvestTree,
} from '../types';

interface LayerEditorProps {
  layer: LayerName;
  nodes: unknown[];
  onUpdate: (nodes: unknown[]) => void;
  tree?: HarvestTree;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Root Editor ────────────────────────────────────────────────────────────

function RootEditor({
  nodes,
  onUpdate,
}: {
  nodes: Root[];
  onUpdate: (n: Root[]) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  function updateNode(id: string, patch: Partial<Root>) {
    onUpdate(nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  function deleteNode(id: string) {
    onUpdate(nodes.filter((n) => n.id !== id));
  }

  function addNode() {
    const newNode: Root = {
      id: generateId('root'),
      type: 'value',
      text: '',
      waldconsistency_level: 'CE',
      is_negotiable: false,
    };
    onUpdate([...nodes, newNode]);
    setEditing(newNode.id);
  }

  return (
    <div className="space-y-3">
      {nodes.map((node) => (
        <div
          key={node.id}
          className="bg-white/70 border border-ht-ochre/20 rounded-lg p-3 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            {editing === node.id ? (
              <textarea
                className="flex-1 text-sm font-spectral bg-ht-cream border border-ht-ochre/40 rounded p-2 resize-none focus:outline-none focus:border-ht-ochre"
                rows={2}
                value={node.text}
                onChange={(e) => updateNode(node.id, { text: e.target.value })}
                onBlur={() => setEditing(null)}
                autoFocus
                placeholder="Describe this root value or commitment…"
              />
            ) : (
              <p
                className="flex-1 text-sm font-spectral text-ht-brown cursor-text hover:bg-ht-cream/50 rounded p-1 min-h-[2rem]"
                onClick={() => setEditing(node.id)}
                title="Click to edit"
              >
                {node.text || <span className="italic text-ht-brown/40">Click to add text…</span>}
              </p>
            )}
            <button
              onClick={() => deleteNode(node.id)}
              className="text-ht-brown/30 hover:text-red-500 transition-colors text-base leading-none mt-1 flex-shrink-0"
              title="Delete"
            >
              ×
            </button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="text-xs font-spectral bg-ht-cream border border-ht-ochre/30 rounded px-2 py-1 text-ht-brown focus:outline-none focus:border-ht-ochre"
              value={node.type}
              onChange={(e) =>
                updateNode(node.id, { type: e.target.value as Root['type'] })
              }
            >
              <option value="value">Value</option>
              <option value="commitment">Commitment</option>
              <option value="brick">Brick</option>
            </select>

            <select
              className="text-xs font-spectral bg-ht-cream border border-ht-ochre/30 rounded px-2 py-1 text-ht-brown focus:outline-none focus:border-ht-ochre"
              value={node.waldconsistency_level}
              onChange={(e) =>
                updateNode(node.id, {
                  waldconsistency_level: e.target.value as Root['waldconsistency_level'],
                })
              }
            >
              <option value="CE">CE — Core Ethic</option>
              <option value="CY">CY — Contextual</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs font-spectral text-ht-brown cursor-pointer select-none">
              <div
                onClick={() => updateNode(node.id, { is_negotiable: !node.is_negotiable })}
                className={`w-8 h-4 rounded-full transition-colors duration-300 flex items-center px-0.5 cursor-pointer ${
                  node.is_negotiable ? 'bg-ht-ochre' : 'bg-ht-brown/20'
                }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full shadow transition-transform duration-300 ${
                    node.is_negotiable ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
              Negotiable
            </label>
          </div>
        </div>
      ))}

      <button
        onClick={addNode}
        className="w-full text-sm font-spectral text-ht-ochre border border-dashed border-ht-ochre/40 rounded-lg py-2.5 hover:bg-ht-ochre/5 transition-colors duration-300"
      >
        + Add Root
      </button>
    </div>
  );
}

// ─── Trunk Editor ───────────────────────────────────────────────────────────

function TrunkEditor({
  nodes,
  onUpdate,
  rootNodes,
}: {
  nodes: TrunkNode[];
  onUpdate: (n: TrunkNode[]) => void;
  rootNodes: Root[];
}) {
  const [editing, setEditing] = useState<string | null>(null);

  function updateNode(id: string, patch: Partial<TrunkNode>) {
    onUpdate(nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  function deleteNode(id: string) {
    onUpdate(nodes.filter((n) => n.id !== id));
  }

  function addNode() {
    const newNode: TrunkNode = {
      id: generateId('trunk'),
      text: '',
      waldconsistency_level: 'CS',
      supports_roots: [],
    };
    onUpdate([...nodes, newNode]);
    setEditing(newNode.id);
  }

  function toggleRoot(trunkId: string, rootId: string) {
    const trunk = nodes.find((n) => n.id === trunkId);
    if (!trunk) return;
    const alreadyLinked = trunk.supports_roots.includes(rootId);
    updateNode(trunkId, {
      supports_roots: alreadyLinked
        ? trunk.supports_roots.filter((r) => r !== rootId)
        : [...trunk.supports_roots, rootId],
    });
  }

  return (
    <div className="space-y-3">
      {nodes.map((node) => (
        <div
          key={node.id}
          className="bg-white/70 border border-ht-ochre/20 rounded-lg p-3 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            {editing === node.id ? (
              <textarea
                className="flex-1 text-sm font-spectral bg-ht-cream border border-ht-ochre/40 rounded p-2 resize-none focus:outline-none focus:border-ht-ochre"
                rows={2}
                value={node.text}
                onChange={(e) => updateNode(node.id, { text: e.target.value })}
                onBlur={() => setEditing(null)}
                autoFocus
                placeholder="Describe this trunk principle…"
              />
            ) : (
              <p
                className="flex-1 text-sm font-spectral text-ht-brown cursor-text hover:bg-ht-cream/50 rounded p-1 min-h-[2rem]"
                onClick={() => setEditing(node.id)}
              >
                {node.text || <span className="italic text-ht-brown/40">Click to add text…</span>}
              </p>
            )}
            <button
              onClick={() => deleteNode(node.id)}
              className="text-ht-brown/30 hover:text-red-500 transition-colors text-base leading-none mt-1 flex-shrink-0"
            >
              ×
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              className="text-xs font-spectral bg-ht-cream border border-ht-ochre/30 rounded px-2 py-1 text-ht-brown focus:outline-none focus:border-ht-ochre"
              value={node.waldconsistency_level}
              onChange={(e) =>
                updateNode(node.id, {
                  waldconsistency_level: e.target.value as TrunkNode['waldconsistency_level'],
                })
              }
            >
              <option value="CS">CS — Core Statement</option>
              <option value="L">L — Lived</option>
            </select>
          </div>

          {rootNodes.length > 0 && (
            <div>
              <p className="text-xs font-spectral text-ht-brown/50 mb-1.5">Supports roots:</p>
              <div className="flex flex-wrap gap-1.5">
                {rootNodes.map((root) => (
                  <button
                    key={root.id}
                    onClick={() => toggleRoot(node.id, root.id)}
                    className={`text-xs font-spectral px-2 py-0.5 rounded-full border transition-all duration-200 ${
                      node.supports_roots.includes(root.id)
                        ? 'bg-ht-root text-white border-ht-root'
                        : 'bg-transparent text-ht-brown border-ht-brown/30 hover:border-ht-root'
                    }`}
                  >
                    {root.text.length > 22 ? root.text.slice(0, 22) + '…' : root.text || 'Unnamed root'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addNode}
        className="w-full text-sm font-spectral text-ht-ochre border border-dashed border-ht-ochre/40 rounded-lg py-2.5 hover:bg-ht-ochre/5 transition-colors duration-300"
      >
        + Add Trunk Node
      </button>
    </div>
  );
}

// ─── Branch Editor ──────────────────────────────────────────────────────────

function BranchEditor({
  nodes,
  onUpdate,
  trunkNodes,
}: {
  nodes: Branch[];
  onUpdate: (n: Branch[]) => void;
  trunkNodes: TrunkNode[];
}) {
  const [editing, setEditing] = useState<string | null>(null);

  function updateNode(id: string, patch: Partial<Branch>) {
    onUpdate(nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  function deleteNode(id: string) {
    onUpdate(nodes.filter((n) => n.id !== id));
  }

  function addNode() {
    const newNode: Branch = {
      id: generateId('branch'),
      territory: '',
      text: '',
      waldconsistency_level: 'S',
      linked_trunk: [],
    };
    onUpdate([...nodes, newNode]);
    setEditing(newNode.id);
  }

  function toggleTrunk(branchId: string, trunkId: string) {
    const branch = nodes.find((n) => n.id === branchId);
    if (!branch) return;
    const linked = branch.linked_trunk.includes(trunkId);
    updateNode(branchId, {
      linked_trunk: linked
        ? branch.linked_trunk.filter((t) => t !== trunkId)
        : [...branch.linked_trunk, trunkId],
    });
  }

  return (
    <div className="space-y-3">
      {nodes.map((node) => (
        <div
          key={node.id}
          className="bg-white/70 border border-ht-ochre/20 rounded-lg p-3 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-1.5">
              <input
                className="w-full text-xs font-spectral bg-ht-cream border border-ht-ochre/30 rounded px-2 py-1 text-ht-brown/70 focus:outline-none focus:border-ht-ochre"
                placeholder="Territory (e.g. Busyness Park)"
                value={node.territory}
                onChange={(e) => updateNode(node.id, { territory: e.target.value })}
              />
              {editing === node.id ? (
                <textarea
                  className="w-full text-sm font-spectral bg-ht-cream border border-ht-ochre/40 rounded p-2 resize-none focus:outline-none focus:border-ht-ochre"
                  rows={2}
                  value={node.text}
                  onChange={(e) => updateNode(node.id, { text: e.target.value })}
                  onBlur={() => setEditing(null)}
                  autoFocus
                  placeholder="Describe this strategic branch…"
                />
              ) : (
                <p
                  className="text-sm font-spectral text-ht-brown cursor-text hover:bg-ht-cream/50 rounded p-1 min-h-[2rem]"
                  onClick={() => setEditing(node.id)}
                >
                  {node.text || <span className="italic text-ht-brown/40">Click to add text…</span>}
                </p>
              )}
            </div>
            <button
              onClick={() => deleteNode(node.id)}
              className="text-ht-brown/30 hover:text-red-500 transition-colors text-base leading-none mt-1 flex-shrink-0"
            >
              ×
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              className="text-xs font-spectral bg-ht-cream border border-ht-ochre/30 rounded px-2 py-1 text-ht-brown focus:outline-none focus:border-ht-ochre"
              value={node.waldconsistency_level}
              onChange={(e) =>
                updateNode(node.id, {
                  waldconsistency_level: e.target.value as Branch['waldconsistency_level'],
                })
              }
            >
              <option value="S">S — Strategic</option>
              <option value="CN">CN — Conditional</option>
            </select>
          </div>

          {trunkNodes.length > 0 && (
            <div>
              <p className="text-xs font-spectral text-ht-brown/50 mb-1.5">Linked trunk:</p>
              <div className="flex flex-wrap gap-1.5">
                {trunkNodes.map((trunk) => (
                  <button
                    key={trunk.id}
                    onClick={() => toggleTrunk(node.id, trunk.id)}
                    className={`text-xs font-spectral px-2 py-0.5 rounded-full border transition-all duration-200 ${
                      node.linked_trunk.includes(trunk.id)
                        ? 'bg-ht-trunk text-white border-ht-trunk'
                        : 'bg-transparent text-ht-brown border-ht-brown/30 hover:border-ht-trunk'
                    }`}
                  >
                    {trunk.text.length > 22 ? trunk.text.slice(0, 22) + '…' : trunk.text || 'Unnamed trunk'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addNode}
        className="w-full text-sm font-spectral text-ht-ochre border border-dashed border-ht-ochre/40 rounded-lg py-2.5 hover:bg-ht-ochre/5 transition-colors duration-300"
      >
        + Add Branch
      </button>
    </div>
  );
}

// ─── Leaf Editor ─────────────────────────────────────────────────────────────

function LeafEditor({
  nodes,
  onUpdate,
  branchNodes,
}: {
  nodes: Leaf[];
  onUpdate: (n: Leaf[]) => void;
  branchNodes: Branch[];
}) {
  const [editing, setEditing] = useState<string | null>(null);

  function updateNode(id: string, patch: Partial<Leaf>) {
    onUpdate(nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  function deleteNode(id: string) {
    onUpdate(nodes.filter((n) => n.id !== id));
  }

  function addNode() {
    const newNode: Leaf = {
      id: generateId('leaf'),
      practice: '',
      frequency: 'weekly',
      waldconsistency_level: 'K',
      branch_id: branchNodes[0]?.id ?? '',
    };
    onUpdate([...nodes, newNode]);
    setEditing(newNode.id);
  }

  return (
    <div className="space-y-3">
      {nodes.map((node) => (
        <div
          key={node.id}
          className="bg-white/70 border border-ht-ochre/20 rounded-lg p-3 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            {editing === node.id ? (
              <textarea
                className="flex-1 text-sm font-spectral bg-ht-cream border border-ht-ochre/40 rounded p-2 resize-none focus:outline-none focus:border-ht-ochre"
                rows={2}
                value={node.practice}
                onChange={(e) => updateNode(node.id, { practice: e.target.value })}
                onBlur={() => setEditing(null)}
                autoFocus
                placeholder="Describe this practice…"
              />
            ) : (
              <p
                className="flex-1 text-sm font-spectral text-ht-brown cursor-text hover:bg-ht-cream/50 rounded p-1 min-h-[2rem]"
                onClick={() => setEditing(node.id)}
              >
                {node.practice || <span className="italic text-ht-brown/40">Click to add practice…</span>}
              </p>
            )}
            <button
              onClick={() => deleteNode(node.id)}
              className="text-ht-brown/30 hover:text-red-500 transition-colors text-base leading-none mt-1 flex-shrink-0"
            >
              ×
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              className="text-xs font-spectral bg-ht-cream border border-ht-ochre/30 rounded px-2 py-1 text-ht-brown focus:outline-none focus:border-ht-ochre"
              value={node.frequency}
              onChange={(e) =>
                updateNode(node.id, { frequency: e.target.value as Leaf['frequency'] })
              }
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="as_needed">As needed</option>
            </select>

            {branchNodes.length > 0 && (
              <select
                className="text-xs font-spectral bg-ht-cream border border-ht-ochre/30 rounded px-2 py-1 text-ht-brown focus:outline-none focus:border-ht-ochre"
                value={node.branch_id}
                onChange={(e) => updateNode(node.id, { branch_id: e.target.value })}
              >
                <option value="">— select branch —</option>
                {branchNodes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.territory || b.text.slice(0, 28) || 'Unnamed branch'}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={addNode}
        className="w-full text-sm font-spectral text-ht-ochre border border-dashed border-ht-ochre/40 rounded-lg py-2.5 hover:bg-ht-ochre/5 transition-colors duration-300"
      >
        + Add Leaf Practice
      </button>
    </div>
  );
}

// ─── Fruit Editor ────────────────────────────────────────────────────────────

function FruitEditor({
  nodes,
  onUpdate,
  leafNodes,
}: {
  nodes: Fruit[];
  onUpdate: (n: Fruit[]) => void;
  leafNodes: Leaf[];
}) {
  const [editing, setEditing] = useState<string | null>(null);

  function updateNode(id: string, patch: Partial<Fruit>) {
    onUpdate(nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  function deleteNode(id: string) {
    onUpdate(nodes.filter((n) => n.id !== id));
  }

  function addNode() {
    const newNode: Fruit = {
      id: generateId('fruit'),
      outcome: '',
      visibility: 'private',
      waldconsistency_level: 'CR',
      measured_by: '',
      leaf_ids: [],
    };
    onUpdate([...nodes, newNode]);
    setEditing(newNode.id);
  }

  function toggleLeaf(fruitId: string, leafId: string) {
    const fruit = nodes.find((n) => n.id === fruitId);
    if (!fruit) return;
    const linked = fruit.leaf_ids.includes(leafId);
    updateNode(fruitId, {
      leaf_ids: linked
        ? fruit.leaf_ids.filter((l) => l !== leafId)
        : [...fruit.leaf_ids, leafId],
    });
  }

  return (
    <div className="space-y-3">
      {nodes.map((node) => (
        <div
          key={node.id}
          className="bg-white/70 border border-ht-ochre/20 rounded-lg p-3 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            {editing === node.id ? (
              <textarea
                className="flex-1 text-sm font-spectral bg-ht-cream border border-ht-ochre/40 rounded p-2 resize-none focus:outline-none focus:border-ht-ochre"
                rows={2}
                value={node.outcome}
                onChange={(e) => updateNode(node.id, { outcome: e.target.value })}
                onBlur={() => setEditing(null)}
                autoFocus
                placeholder="Describe this outcome fruit…"
              />
            ) : (
              <p
                className="flex-1 text-sm font-spectral text-ht-brown cursor-text hover:bg-ht-cream/50 rounded p-1 min-h-[2rem]"
                onClick={() => setEditing(node.id)}
              >
                {node.outcome || <span className="italic text-ht-brown/40">Click to add outcome…</span>}
              </p>
            )}
            <button
              onClick={() => deleteNode(node.id)}
              className="text-ht-brown/30 hover:text-red-500 transition-colors text-base leading-none mt-1 flex-shrink-0"
            >
              ×
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              className="text-xs font-spectral bg-ht-cream border border-ht-ochre/30 rounded px-2 py-1 text-ht-brown focus:outline-none focus:border-ht-ochre"
              value={node.visibility}
              onChange={(e) =>
                updateNode(node.id, { visibility: e.target.value as Fruit['visibility'] })
              }
            >
              <option value="private">Private</option>
              <option value="shared">Shared</option>
              <option value="public">Public</option>
            </select>
          </div>

          <input
            className="w-full text-xs font-spectral bg-ht-cream border border-ht-ochre/30 rounded px-2 py-1 text-ht-brown focus:outline-none focus:border-ht-ochre"
            placeholder="Measured by…"
            value={node.measured_by}
            onChange={(e) => updateNode(node.id, { measured_by: e.target.value })}
          />

          {leafNodes.length > 0 && (
            <div>
              <p className="text-xs font-spectral text-ht-brown/50 mb-1.5">Linked leaves:</p>
              <div className="flex flex-wrap gap-1.5">
                {leafNodes.map((leaf) => (
                  <button
                    key={leaf.id}
                    onClick={() => toggleLeaf(node.id, leaf.id)}
                    className={`text-xs font-spectral px-2 py-0.5 rounded-full border transition-all duration-200 ${
                      node.leaf_ids.includes(leaf.id)
                        ? 'bg-ht-branch text-white border-ht-branch'
                        : 'bg-transparent text-ht-brown border-ht-brown/30 hover:border-ht-branch'
                    }`}
                  >
                    {leaf.practice.length > 22 ? leaf.practice.slice(0, 22) + '…' : leaf.practice || 'Unnamed leaf'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addNode}
        className="w-full text-sm font-spectral text-ht-ochre border border-dashed border-ht-ochre/40 rounded-lg py-2.5 hover:bg-ht-ochre/5 transition-colors duration-300"
      >
        + Add Fruit Outcome
      </button>
    </div>
  );
}

// ─── Main LayerEditor ────────────────────────────────────────────────────────

export default function LayerEditor({ layer, nodes, onUpdate, tree }: LayerEditorProps) {
  const roots = (tree?.roots ?? []) as Root[];
  const trunkNodes = (tree?.trunk ?? []) as TrunkNode[];
  const branches = (tree?.branches ?? []) as Branch[];
  const leaves = (tree?.leaves ?? []) as Leaf[];

  switch (layer) {
    case 'roots':
      return (
        <RootEditor nodes={nodes as Root[]} onUpdate={onUpdate as (n: Root[]) => void} />
      );
    case 'trunk':
      return (
        <TrunkEditor
          nodes={nodes as TrunkNode[]}
          onUpdate={onUpdate as (n: TrunkNode[]) => void}
          rootNodes={roots}
        />
      );
    case 'branches':
      return (
        <BranchEditor
          nodes={nodes as Branch[]}
          onUpdate={onUpdate as (n: Branch[]) => void}
          trunkNodes={trunkNodes}
        />
      );
    case 'leaves':
      return (
        <LeafEditor
          nodes={nodes as Leaf[]}
          onUpdate={onUpdate as (n: Leaf[]) => void}
          branchNodes={branches}
        />
      );
    case 'fruits':
      return (
        <FruitEditor
          nodes={nodes as Fruit[]}
          onUpdate={onUpdate as (n: Fruit[]) => void}
          leafNodes={leaves}
        />
      );
  }
}
