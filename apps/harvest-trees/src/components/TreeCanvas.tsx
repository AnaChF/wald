import { useState } from 'react';
import type { HarvestTree, LayerName, Root, TrunkNode, Branch, Leaf, Fruit } from '../types';

interface TreeCanvasProps {
  tree: HarvestTree;
  highlightLayer?: LayerName;
  activeLenses?: string[];
  onNodeClick?: (nodeId: string, layer: LayerName) => void;
}

const W = 800;
const H = 700;

// Zone y ranges (center y)
const ZONES = {
  fruits:   { yMin: 20,  yMax: 160, center: 90 },
  leaves:   { yMin: 170, yMax: 290, center: 230 },
  branches: { yMin: 300, yMax: 430, center: 365 },
  trunk:    { yMin: 440, yMax: 550, center: 490 },
  roots:    { yMin: 555, yMax: 695, center: 625 },
};

// Distribute nodes evenly along x axis between xMin–xMax
function xPositions(count: number, xMin = 80, xMax = 720): number[] {
  if (count === 0) return [];
  if (count === 1) return [(xMin + xMax) / 2];
  return Array.from({ length: count }, (_, i) => xMin + ((xMax - xMin) / (count - 1)) * i);
}

// Truncate text
function trunc(s: string, max = 18): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

// Cubic bezier path
function cubicPath(x1: number, y1: number, x2: number, y2: number, cx1?: number, cy1?: number, cx2?: number, cy2?: number): string {
  const c1x = cx1 ?? x1;
  const c1y = cy1 ?? (y1 + y2) / 2;
  const c2x = cx2 ?? x2;
  const c2y = cy2 ?? (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
}

type NodeRect = {
  id: string;
  x: number;
  y: number;
};

export default function TreeCanvas({ tree, highlightLayer, activeLenses = [], onNodeClick }: TreeCanvasProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const roots = tree.roots as Root[];
  const trunk = tree.trunk as TrunkNode[];
  const branches = tree.branches as Branch[];
  const leaves = tree.leaves as Leaf[];
  const fruits = tree.fruits as Fruit[];

  // Node positions
  const rootXs = xPositions(roots.length, 100, 700);
  const trunkXs = xPositions(trunk.length, 280, 520);
  const branchXs = xPositions(branches.length, 100, 700);
  const leafXs = xPositions(leaves.length, 80, 720);
  const fruitXs = xPositions(fruits.length, 180, 620);

  function getOpacity(layer: LayerName): number {
    if (!highlightLayer) return 1;
    return highlightLayer === layer ? 1 : 0.3;
  }

  // Trunk center for connections
  const trunkCenterX = 400;
  const trunkTopY = ZONES.trunk.center - 25;
  const trunkBottomY = ZONES.trunk.center + 25;

  // Lenses
  const freedomLens = activeLenses.includes('freedom');
  const solidarityLens = activeLenses.includes('solidarity');
  const authenticityLens = activeLenses.includes('authenticity');

  // Node registry for click hit-testing
  const nodePositions: Map<string, NodeRect & { layer: LayerName }> = new Map();
  roots.forEach((r, i) => nodePositions.set(r.id, { id: r.id, x: rootXs[i], y: ZONES.roots.center, layer: 'roots' }));
  trunk.forEach((t, i) => nodePositions.set(t.id, { id: t.id, x: trunkXs[i], y: ZONES.trunk.center, layer: 'trunk' }));
  branches.forEach((b, i) => nodePositions.set(b.id, { id: b.id, x: branchXs[i], y: ZONES.branches.center, layer: 'branches' }));
  leaves.forEach((l, i) => nodePositions.set(l.id, { id: l.id, x: leafXs[i], y: ZONES.leaves.center, layer: 'leaves' }));
  fruits.forEach((f, i) => nodePositions.set(f.id, { id: f.id, x: fruitXs[i], y: ZONES.fruits.center, layer: 'fruits' }));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ height: 'auto', display: 'block', cursor: 'default' }}
      aria-label="Harvest Tree visualization"
    >
      {/* ── Zone backgrounds ─────────────────────────────────── */}
      <rect x={0} y={20}  width={W} height={140} fill="#fffbe8" />
      <rect x={0} y={170} width={W} height={120} fill="#f0f8ec" />
      <rect x={0} y={300} width={W} height={130} fill="#e8f0e4" />
      <rect x={0} y={440} width={W} height={110} fill="#f5ede0" />
      <rect x={0} y={555} width={W} height={145} fill="#ede0cc" />

      {/* ── Zone labels ──────────────────────────────────────── */}
      {([
        ['FRUITS',   90],
        ['LEAVES',  230],
        ['BRANCHES',365],
        ['TRUNK',   490],
        ['ROOTS',   625],
      ] as [string, number][]).map(([label, cy]) => (
        <text
          key={label}
          x={776}
          y={cy + 4}
          textAnchor="end"
          fontSize={9}
          fontFamily="'DM Mono', 'Courier New', monospace"
          letterSpacing="1.5"
          fill="#2c1a0044"
        >
          {label}
        </text>
      ))}

      {/* ── Central trunk line ───────────────────────────────── */}
      <line
        x1={400} y1={555}
        x2={400} y2={700}
        stroke="#5c3d00"
        strokeWidth={8}
        strokeLinecap="round"
      />
      <line
        x1={400} y1={440}
        x2={400} y2={555}
        stroke="#5c3d00"
        strokeWidth={6}
        strokeLinecap="round"
      />

      {/* ── Root-to-trunk connections ─────────────────────────── */}
      <g opacity={getOpacity('roots')}>
        {roots.map((root, i) => {
          const rx = rootXs[i];
          const ry = ZONES.roots.center;
          return (
            <path
              key={`conn-root-${root.id}`}
              d={cubicPath(trunkCenterX, trunkBottomY + 30, rx, ry - 22, trunkCenterX, trunkBottomY + 60, rx, ry - 50)}
              fill="none"
              stroke="#c9940a44"
              strokeWidth={1.5}
            />
          );
        })}
      </g>

      {/* ── Branch-to-trunk connections ───────────────────────── */}
      <g opacity={getOpacity('branches')}>
        {branches.map((branch, i) => {
          const bx = branchXs[i];
          const by = ZONES.branches.center;
          return (
            <path
              key={`conn-branch-${branch.id}`}
              d={cubicPath(trunkCenterX, trunkTopY - 10, bx, by + 22, trunkCenterX, trunkTopY - 40, bx, by + 50)}
              fill="none"
              stroke="#c9940a44"
              strokeWidth={1.5}
            />
          );
        })}
      </g>

      {/* ── Leaf-to-branch connections ────────────────────────── */}
      <g opacity={Math.min(getOpacity('leaves'), getOpacity('branches'))}>
        {leaves.map((leaf, li) => {
          const lx = leafXs[li];
          const ly = ZONES.leaves.center;
          const branchIdx = branches.findIndex((b) => b.id === leaf.branch_id);
          const bx = branchIdx >= 0 ? branchXs[branchIdx] : trunkCenterX;
          const by = ZONES.branches.center;
          return (
            <path
              key={`conn-leaf-${leaf.id}`}
              d={cubicPath(bx, by - 22, lx, ly + 18, bx, by - 45, lx, ly + 35)}
              fill="none"
              stroke="#c9940a33"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          );
        })}
      </g>

      {/* ── Fruit-to-leaf connections ─────────────────────────── */}
      <g opacity={Math.min(getOpacity('fruits'), getOpacity('leaves'))}>
        {fruits.map((fruit, fi) => {
          const fx = fruitXs[fi];
          const fy = ZONES.fruits.center;
          return fruit.leaf_ids.map((leafId) => {
            const li = leaves.findIndex((l) => l.id === leafId);
            if (li < 0) return null;
            const lx = leafXs[li];
            const ly = ZONES.leaves.center;
            return (
              <path
                key={`conn-fruit-${fruit.id}-leaf-${leafId}`}
                d={cubicPath(lx, ly - 18, fx, fy + 28, lx, ly - 40, fx, fy + 50)}
                fill="none"
                stroke="#c9940a22"
                strokeWidth={1}
                strokeDasharray="2 4"
              />
            );
          });
        })}
      </g>

      {/* ══════════════════════════════════════════════════════════
          NODES
          ══════════════════════════════════════════════════════════ */}

      {/* ── ROOTS ─────────────────────────────────────────────── */}
      <g opacity={getOpacity('roots')}>
        {roots.length === 0 ? (
          <text x={400} y={ZONES.roots.center + 5} textAnchor="middle" fontSize={12} fontFamily="Spectral, serif" fontStyle="italic" fill="#3d2b0055">
            Add your first root…
          </text>
        ) : (
          roots.map((root, i) => {
            const cx = rootXs[i];
            const cy = ZONES.roots.center;
            const isHovered = hoveredId === root.id;
            const authRing = authenticityLens && root.is_negotiable;
            return (
              <g
                key={root.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onNodeClick?.(root.id, 'roots')}
                onMouseEnter={() => setHoveredId(root.id)}
                onMouseLeave={() => setHoveredId(null)}
                transform={isHovered ? `translate(0,-2)` : undefined}
              >
                {authRing && (
                  <ellipse cx={cx} cy={cy} rx={62} ry={29} fill="none" stroke="#9944ff" strokeWidth={2.5} opacity={0.7} />
                )}
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={55}
                  ry={22}
                  fill="#3d2b00"
                  style={{ filter: isHovered ? 'drop-shadow(0 3px 8px #3d2b0066)' : undefined, transition: 'filter 0.3s' }}
                />
                <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontFamily="Spectral, serif" fill="white">
                  {trunc(root.text || 'Root', 16)}
                </text>
                <text x={cx} y={cy + 11} textAnchor="middle" dominantBaseline="middle" fontSize={8} fontFamily="Spectral, serif" fill="rgba(255,255,255,0.6)">
                  {root.type} · {root.waldconsistency_level}
                </text>
              </g>
            );
          })
        )}
      </g>

      {/* ── TRUNK ─────────────────────────────────────────────── */}
      <g opacity={getOpacity('trunk')}>
        {trunk.length === 0 ? (
          <text x={400} y={ZONES.trunk.center + 5} textAnchor="middle" fontSize={12} fontFamily="Spectral, serif" fontStyle="italic" fill="#5c3d0055">
            Add your first trunk node…
          </text>
        ) : (
          trunk.map((node, i) => {
            const cx = trunkXs[i];
            const cy = ZONES.trunk.center + (i % 2 === 1 ? 18 : -18);
            const isHovered = hoveredId === node.id;
            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onNodeClick?.(node.id, 'trunk')}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <rect
                  x={cx - 80}
                  y={cy - 20}
                  width={160}
                  height={40}
                  rx={5}
                  fill="#5c3d00"
                  style={{ filter: isHovered ? 'drop-shadow(0 3px 8px #5c3d0066)' : undefined, transition: 'filter 0.3s' }}
                />
                <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontFamily="Spectral, serif" fill="white">
                  {trunc(node.text || 'Trunk', 18)}
                </text>
                <text x={cx} y={cy + 13} textAnchor="middle" dominantBaseline="middle" fontSize={8} fontFamily="Spectral, serif" fill="rgba(255,255,255,0.6)">
                  {node.waldconsistency_level}
                </text>
              </g>
            );
          })
        )}
      </g>

      {/* ── BRANCHES ──────────────────────────────────────────── */}
      <g opacity={getOpacity('branches')}>
        {branches.length === 0 ? (
          <text x={400} y={ZONES.branches.center + 5} textAnchor="middle" fontSize={12} fontFamily="Spectral, serif" fontStyle="italic" fill="#4a674155">
            Add your first branch…
          </text>
        ) : (
          branches.map((branch, i) => {
            const cx = branchXs[i];
            const cy = ZONES.branches.center;
            const isHovered = hoveredId === branch.id;
            // Organic shape using rounded rect path approximation
            const w = 110;
            const h = 36;
            const r = 10;
            const x = cx - w / 2;
            const y = cy - h / 2;
            const solidRing = solidarityLens && !fruits.some((f) => f.leaf_ids.some((lid) => leaves.find((l) => l.id === lid && l.branch_id === branch.id)));
            return (
              <g
                key={branch.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onNodeClick?.(branch.id, 'branches')}
                onMouseEnter={() => setHoveredId(branch.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {solidRing && (
                  <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={r + 3} fill="none" stroke="#ff8822" strokeWidth={2.5} opacity={0.7} />
                )}
                <path
                  d={`M ${x + r} ${y} Q ${x} ${y} ${x} ${y + r} L ${x} ${y + h - r} Q ${x} ${y + h} ${x + r} ${y + h} L ${x + w - r} ${y + h} Q ${x + w} ${y + h} ${x + w} ${y + h - r} L ${x + w} ${y + r} Q ${x + w} ${y} ${x + w - r} ${y} Z`}
                  fill="#4a6741"
                  style={{ filter: isHovered ? 'drop-shadow(0 3px 8px #4a674166)' : undefined, transition: 'filter 0.3s' }}
                />
                <text x={cx} y={cy - 3} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontFamily="Spectral, serif" fill="white">
                  {trunc(branch.territory || branch.text || 'Branch', 14)}
                </text>
                <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="middle" fontSize={8} fontFamily="Spectral, serif" fill="rgba(255,255,255,0.65)">
                  {trunc(branch.text || '', 16)}
                </text>
              </g>
            );
          })
        )}
      </g>

      {/* ── LEAVES ────────────────────────────────────────────── */}
      <g opacity={getOpacity('leaves')}>
        {leaves.length === 0 ? (
          <text x={400} y={ZONES.leaves.center + 5} textAnchor="middle" fontSize={12} fontFamily="Spectral, serif" fontStyle="italic" fill="#4a674155">
            Add your first leaf practice…
          </text>
        ) : (
          leaves.map((leaf, i) => {
            const cx = leafXs[i];
            const cy = ZONES.leaves.center;
            const isHovered = hoveredId === leaf.id;
            return (
              <g
                key={leaf.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onNodeClick?.(leaf.id, 'leaves')}
                onMouseEnter={() => setHoveredId(leaf.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={50}
                  ry={18}
                  fill="rgba(210,230,200,0.85)"
                  stroke="#4a6741"
                  strokeWidth={1}
                  style={{
                    transformOrigin: `${cx}px ${cy}px`,
                    animation: isHovered ? 'leaf-sway 4s ease-in-out infinite' : undefined,
                    filter: isHovered ? 'drop-shadow(0 2px 6px #4a674133)' : undefined,
                    transition: 'filter 0.3s',
                  }}
                />
                <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontFamily="Spectral, serif" fill="#2c1a00cc">
                  {trunc(leaf.practice || 'Leaf', 16)}
                </text>
                <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="middle" fontSize={7} fontFamily="Spectral, serif" fill="#2c1a0066">
                  {leaf.frequency}
                </text>
              </g>
            );
          })
        )}
      </g>

      {/* ── FRUITS ────────────────────────────────────────────── */}
      <g opacity={getOpacity('fruits')}>
        {fruits.length === 0 ? (
          <text x={400} y={ZONES.fruits.center + 5} textAnchor="middle" fontSize={12} fontFamily="Spectral, serif" fontStyle="italic" fill="#c9940a55">
            Add your first fruit outcome…
          </text>
        ) : (
          fruits.map((fruit, i) => {
            const cx = fruitXs[i];
            const cy = ZONES.fruits.center;
            const isHoveredFruit = hoveredId === fruit.id;
            const freeRing = freedomLens;
            return (
              <g
                key={fruit.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onNodeClick?.(fruit.id, 'fruits')}
                onMouseEnter={() => setHoveredId(fruit.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Glow circle behind fruit */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={32}
                  fill="#c9940a"
                  opacity={0.18}
                  style={{ animation: 'fruit-glow 3s ease-in-out infinite' }}
                />
                {freeRing && (
                  <circle cx={cx} cy={cy} r={34} fill="none" stroke="#4466ff" strokeWidth={2.5} opacity={0.75} />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={28}
                  fill="#c9940a"
                  style={{
                    filter: 'drop-shadow(0 0 6px #c9940a88)',
                    animation: 'fruit-glow 3s ease-in-out infinite',
                    transition: 'r 0.3s',
                  }}
                />
                <text x={cx} y={cy - 3} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontFamily="Spectral, serif" fill="white" fontWeight="600">
                  {trunc(fruit.outcome || 'Fruit', 14)}
                </text>
                <text x={cx} y={cy + 9} textAnchor="middle" dominantBaseline="middle" fontSize={7} fontFamily="Spectral, serif" fill="rgba(255,255,255,0.75)">
                  {fruit.visibility}
                </text>
              </g>
            );
          })
        )}
      </g>

      {/* ── Hovered tooltip ───────────────────────────────────── */}
      {hoveredId && (() => {
        const pos = nodePositions.get(hoveredId);
        if (!pos) return null;
        let tooltipText = '';
        if (pos.layer === 'roots') {
          const r = roots.find((x) => x.id === hoveredId);
          tooltipText = r ? (r.text || '') : '';
        } else if (pos.layer === 'trunk') {
          const t = trunk.find((x) => x.id === hoveredId);
          tooltipText = t ? (t.text || '') : '';
        } else if (pos.layer === 'branches') {
          const b = branches.find((x) => x.id === hoveredId);
          tooltipText = b ? (b.text || '') : '';
        } else if (pos.layer === 'leaves') {
          const l = leaves.find((x) => x.id === hoveredId);
          tooltipText = l ? (l.practice || '') : '';
        } else if (pos.layer === 'fruits') {
          const f = fruits.find((x) => x.id === hoveredId);
          tooltipText = f ? (f.outcome || '') : '';
        }
        if (!tooltipText || tooltipText.length <= 18) return null;
        const tx = Math.min(Math.max(pos.x, 80), W - 80);
        const ty = pos.y < 350 ? pos.y + 45 : pos.y - 45;
        const tw = Math.min(tooltipText.length * 6.5 + 16, 220);
        return (
          <g>
            <rect x={tx - tw / 2} y={ty - 14} width={tw} height={22} rx={4} fill="#2c1a00cc" />
            <text x={tx} y={ty + 1} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontFamily="Spectral, serif" fill="white">
              {tooltipText.length > 30 ? tooltipText.slice(0, 30) + '…' : tooltipText}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
