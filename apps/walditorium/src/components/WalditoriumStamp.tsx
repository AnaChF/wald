import { useRef } from 'react';
import type { AuditResult, WaldconsistencyLevel } from '../types';

interface WalditoriumStampProps {
  auditResult: AuditResult;
  size?: number;
  animated?: boolean;
  className?: string;
}

const LEVELS: WaldconsistencyLevel[] = ['CE', 'CY', 'CS', 'L', 'S', 'CN', 'K', 'CR'];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function describeRingArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const s1 = polarToCartesian(cx, cy, r, startAngle);
  const e1 = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${s1.x} ${s1.y} A ${r} ${r} 0 ${largeArc} 1 ${e1.x} ${e1.y}`;
}

function getVerdictColor(verdict: AuditResult['verdict']) {
  switch (verdict) {
    case 'GROUNDED': return '#1a5c1a';
    case 'CONDITIONAL': return '#d4820a';
    case 'CONTESTED': return '#a67c00';
    case 'UNGROUNDED': return '#8b0000';
  }
}

function getSegmentBaseColor(verdict: AuditResult['verdict'], index: number) {
  switch (verdict) {
    case 'GROUNDED': {
      const greens = ['#1a5c1a', '#236b23', '#2d7a2d', '#1e6e1e', '#157015', '#0f5a0f', '#1a6a1a', '#27722'];
      return greens[index % greens.length];
    }
    case 'CONDITIONAL': {
      const ambers = ['#d4820a', '#c9940a', '#bf8800', '#d47c0a', '#c47000', '#da8a10', '#c88000', '#d07800'];
      return ambers[index % ambers.length];
    }
    case 'CONTESTED': {
      const ochres = ['#a67c00', '#b08800', '#9a7200', '#aa8000', '#946c00', '#b08400', '#a07800', '#986e00'];
      return ochres[index % ochres.length];
    }
    case 'UNGROUNDED': {
      const reds = ['#8b0000', '#961010', '#7a0000', '#900808', '#850000', '#9a1515', '#800000', '#8e0a0a'];
      return reds[index % reds.length];
    }
  }
}

export function WalditoriumStamp({ auditResult, size = 400, animated = true, className = '' }: WalditoriumStampProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const cx = 200;
  const cy = 200;
  const verdictColor = getVerdictColor(auditResult.verdict);

  // Score ring arcs
  const clProportion = auditResult.cl_score / 100;
  const sciProportion = auditResult.sci_score / 100;

  const clEndAngle = -90 + clProportion * 360;
  const sciEndAngle = -90 + sciProportion * 360;

  function downloadAsPNG() {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = `walditorium-stamp-${Date.now()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  }

  const innerMin = 65;
  const innerMax = 150;

  return (
    <div className={className} style={{ display: 'inline-block' }}>
      <svg
        ref={svgRef}
        viewBox="0 0 400 400"
        width={size}
        height={size}
        style={animated ? { animation: 'stamp-reveal 1.5s ease-out forwards' } : undefined}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Circular text path for outer ring */}
          <path
            id="outerTextPath"
            d={`M ${cx} ${cy - 175} A 175 175 0 0 1 ${cx} ${cy + 175} A 175 175 0 0 1 ${cx} ${cy - 175}`}
          />
          {/* Circular text path for inner verdict ring */}
          <path
            id="innerTextPath"
            d={`M ${cx} ${cy - 170} A 170 170 0 0 1 ${cx} ${cy + 170} A 170 170 0 0 1 ${cx} ${cy - 170}`}
          />
        </defs>

        {/* Background circle */}
        <circle cx={cx} cy={cy} r={195} fill="#0a1a0a" />

        {/* Outer decorative ring */}
        <circle cx={cx} cy={cy} r={190} fill="none" stroke={verdictColor} strokeWidth={2} opacity={0.8} />
        <circle cx={cx} cy={cy} r={185} fill="none" stroke={verdictColor} strokeWidth={0.5} opacity={0.4} />

        {/* Verdict text around outer ring */}
        <text
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '10px',
            fill: verdictColor,
            letterSpacing: '0.25em',
          }}
        >
          <textPath href="#outerTextPath" startOffset="0%">
            {`WALDITORIUM™ EPISTEMIC AUDIT • ${auditResult.verdict} • ${new Date(auditResult.timestamp).getFullYear()} •`.repeat(2)}
          </textPath>
        </text>

        {/* 8 Pie Segments */}
        {LEVELS.map((level, i) => {
          const score = auditResult.waldconsistency[level] ?? 0;
          const startAngle = i * 45 - 90;
          const endAngle = (i + 1) * 45 - 90;
          const outerR = innerMin + (score / 100) * (innerMax - innerMin);
          const baseColor = getSegmentBaseColor(auditResult.verdict, i);
          const opacity = 0.4 + (score / 100) * 0.5;

          return (
            <g key={level}>
              {/* Full segment outline (subtle) */}
              <path
                d={describeArc(cx, cy, innerMax + 10, startAngle, endAngle)}
                fill="none"
                stroke={verdictColor}
                strokeWidth={0.5}
                opacity={0.15}
              />
              {/* Filled segment by score */}
              <path
                d={describeArc(cx, cy, outerR, startAngle, endAngle)}
                fill={baseColor}
                opacity={opacity}
              />
              {/* Segment border line */}
              <line
                x1={cx}
                y1={cy}
                x2={polarToCartesian(cx, cy, innerMax + 12, startAngle).x}
                y2={polarToCartesian(cx, cy, innerMax + 12, startAngle).y}
                stroke={verdictColor}
                strokeWidth={0.8}
                opacity={0.3}
              />
              {/* Level label */}
              {(() => {
                const midAngle = startAngle + 22.5;
                const labelPos = polarToCartesian(cx, cy, 165, midAngle);
                return (
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '9px',
                      fontWeight: 500,
                      fill: 'var(--wald-parchment)',
                      opacity: 0.85,
                    }}
                  >
                    {level}
                  </text>
                );
              })()}
              {/* Score label */}
              {(() => {
                const midAngle = startAngle + 22.5;
                const scorePos = polarToCartesian(cx, cy, 148, midAngle);
                return (
                  <text
                    x={scorePos.x}
                    y={scorePos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: '7px',
                      fill: verdictColor,
                      opacity: 0.9,
                    }}
                  >
                    {score}
                  </text>
                );
              })()}
            </g>
          );
        })}

        {/* CL Score ring (r=108) */}
        <circle cx={cx} cy={cy} r={108} fill="none" stroke={verdictColor} strokeWidth={0.5} opacity={0.2} />
        {clProportion > 0 && (
          <path
            d={describeRingArc(cx, cy, 108, -90, clEndAngle)}
            fill="none"
            stroke={verdictColor}
            strokeWidth={6}
            strokeLinecap="round"
            opacity={0.7}
          />
        )}

        {/* SCI Score ring (r=94) */}
        <circle cx={cx} cy={cy} r={94} fill="none" stroke="#f5f0e8" strokeWidth={0.5} opacity={0.15} />
        {sciProportion > 0 && (
          <path
            d={describeRingArc(cx, cy, 94, -90, sciEndAngle)}
            fill="none"
            stroke="#f5f0e8"
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.45}
          />
        )}

        {/* Ring labels */}
        <text
          x={cx + 112}
          y={cy - 4}
          textAnchor="start"
          style={{ fontFamily: '"DM Mono", monospace', fontSize: '7px', fill: verdictColor, opacity: 0.7 }}
        >
          CL {auditResult.cl_score}
        </text>
        <text
          x={cx + 97}
          y={cy + 8}
          textAnchor="start"
          style={{ fontFamily: '"DM Mono", monospace', fontSize: '7px', fill: '#f5f0e8', opacity: 0.5 }}
        >
          SCI {auditResult.sci_score}
        </text>

        {/* Center circle */}
        <circle cx={cx} cy={cy} r={62} fill={verdictColor} opacity={0.85} />
        <circle cx={cx} cy={cy} r={62} fill="none" stroke={verdictColor} strokeWidth={1.5} opacity={0.6} />

        {/* Center verdict text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 600,
            fontSize: '15px',
            fill: '#ffffff',
            letterSpacing: '0.08em',
          }}
        >
          {auditResult.verdict}
        </text>

        {/* Center subtitle */}
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '7px',
            fill: 'rgba(255,255,255,0.65)',
            letterSpacing: '0.1em',
          }}
        >
          WALDITORIUM™
        </text>

        {/* Tick marks on outer ring */}
        {Array.from({ length: 72 }).map((_, i) => {
          const angle = i * 5 - 90;
          const isMain = i % 9 === 0;
          const innerR = isMain ? 182 : 186;
          const p1 = polarToCartesian(cx, cy, innerR, angle);
          const p2 = polarToCartesian(cx, cy, 190, angle);
          return (
            <line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={verdictColor}
              strokeWidth={isMain ? 1 : 0.5}
              opacity={isMain ? 0.6 : 0.25}
            />
          );
        })}
      </svg>

      {/* Download button */}
      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <button
          onClick={downloadAsPNG}
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '10px',
            color: 'var(--wald-ochre)',
            background: 'transparent',
            border: '1px solid rgba(201,148,10,0.3)',
            borderRadius: '4px',
            padding: '4px 12px',
            cursor: 'pointer',
            letterSpacing: '0.08em',
          }}
        >
          DOWNLOAD PNG
        </button>
      </div>
    </div>
  );
}
