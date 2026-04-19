import { useState } from 'react';
import type { RegenerativePlan } from '../types';

interface RegenerativePlanTreeProps {
  plan: RegenerativePlan;
}

type LayerKey = 'fruits' | 'leaves' | 'branches' | 'trunk' | 'roots';

interface LayerConfig {
  key: LayerKey;
  label: string;
  color: string;
  bgColor: string;
  y: number; // band center y
}

const LAYER_CONFIGS: LayerConfig[] = [
  { key: 'fruits', label: 'FRUITS', color: '#c9940a', bgColor: 'rgba(201,148,10,0.08)', y: 60 },
  { key: 'leaves', label: 'LEAVES', color: '#2d7a2d', bgColor: 'rgba(45,122,45,0.08)', y: 155 },
  { key: 'branches', label: 'BRANCHES', color: '#5a8c3e', bgColor: 'rgba(90,140,62,0.06)', y: 250 },
  { key: 'trunk', label: 'TRUNK', color: '#8b6914', bgColor: 'rgba(139,105,20,0.08)', y: 345 },
  { key: 'roots', label: 'ROOTS', color: '#4a2c0a', bgColor: 'rgba(74,44,10,0.12)', y: 450 },
];

const BAND_HEIGHT = 100;
const SVG_WIDTH = 520;
const SVG_HEIGHT = 510;
const CX = 260;

function getSeverityColor(failureLevel: string): string {
  // Map failure levels to rough severity colours
  if (['CE', 'K'].includes(failureLevel)) return '#8b0000';
  if (['CY', 'CN'].includes(failureLevel)) return '#d4820a';
  return '#2d7a2d';
}

function NodeCircle({
  x,
  y,
  failureLevel,
  text,
  action,
}: {
  x: number;
  y: number;
  failureLevel: string;
  text: string;
  action: string;
}) {
  const [hovered, setHovered] = useState(false);
  const color = getSeverityColor(failureLevel);

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'default' }}
    >
      {/* Branch line to trunk */}
      <line
        x1={CX}
        y1={y}
        x2={x}
        y2={y}
        stroke="#8b6914"
        strokeWidth={1.5}
        strokeDasharray="4,3"
        opacity={0.4}
      />
      {/* Circle */}
      <circle cx={x} cy={y} r={20} fill={color} opacity={0.85} />
      <circle cx={x} cy={y} r={20} fill="none" stroke={color} strokeWidth={1.5} opacity={0.6} />
      {/* Level label */}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '9px',
          fontWeight: 500,
          fill: '#ffffff',
          pointerEvents: 'none',
        }}
      >
        {failureLevel}
      </text>
      {/* Action text below */}
      <foreignObject x={x - 55} y={y + 24} width={110} height={40}>
        <div
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '8px',
            color: 'rgba(245,240,232,0.5)',
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          {action.slice(0, 40)}
          {action.length > 40 ? '…' : ''}
        </div>
      </foreignObject>
      {/* Hover tooltip */}
      {hovered && (
        <foreignObject x={x - 130} y={y - 90} width={260} height={80}>
          <div
            style={{
              backgroundColor: '#0a1a0a',
              border: '1px solid rgba(201,148,10,0.4)',
              borderRadius: '6px',
              padding: '8px 10px',
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '11px',
              color: 'rgba(245,240,232,0.85)',
              lineHeight: 1.4,
            }}
          >
            {text}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export function RegenerativePlanTree({ plan }: RegenerativePlanTreeProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        style={{ display: 'block' }}
      >
        {/* Layer background bands */}
        {LAYER_CONFIGS.map((layer) => (
          <rect
            key={layer.key}
            x={0}
            y={layer.y - BAND_HEIGHT / 2}
            width={SVG_WIDTH}
            height={BAND_HEIGHT}
            fill={layer.bgColor}
            rx={0}
          />
        ))}

        {/* Band separators */}
        {LAYER_CONFIGS.map((layer, i) => {
          if (i === 0) return null;
          return (
            <line
              key={`sep-${layer.key}`}
              x1={0}
              y1={layer.y - BAND_HEIGHT / 2}
              x2={SVG_WIDTH}
              y2={layer.y - BAND_HEIGHT / 2}
              stroke="rgba(245,240,232,0.06)"
              strokeWidth={1}
            />
          );
        })}

        {/* Central trunk line */}
        <line
          x1={CX}
          y1={10}
          x2={CX}
          y2={SVG_HEIGHT - 10}
          stroke="#8b6914"
          strokeWidth={3}
          opacity={0.5}
        />

        {/* Layer labels */}
        {LAYER_CONFIGS.map((layer) => (
          <text
            key={`label-${layer.key}`}
            x={SVG_WIDTH - 10}
            y={layer.y}
            textAnchor="end"
            dominantBaseline="middle"
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '9px',
              fill: layer.color,
              opacity: 0.7,
              letterSpacing: '0.12em',
            }}
          >
            {layer.label}
          </text>
        ))}

        {/* Nodes for each layer */}
        {LAYER_CONFIGS.map((layer) => {
          const items = plan.layers[layer.key];
          const count = items.length;
          return items.map((item, i) => {
            // Spread nodes horizontally around the center
            const spread = Math.min(count * 70, 300);
            const startX = CX - spread / 2 + (count === 1 ? spread / 2 : (i / (count - 1)) * spread);
            const nodeX = count === 1 ? CX - 80 : startX;
            return (
              <NodeCircle
                key={item.id}
                x={nodeX}
                y={layer.y}
                failureLevel={item.failure_level}
                text={item.text}
                action={item.action}
              />
            );
          });
        })}
      </svg>
    </div>
  );
}
