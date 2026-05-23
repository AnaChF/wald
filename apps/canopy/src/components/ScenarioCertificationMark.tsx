interface Props {
  consistency: boolean;
  iiaPass: boolean;
  arrowFlag: boolean;
  claLevel: 'incremental' | 'transformative' | null;
  centreAttribution: string;
  size?: number;
}

export function ScenarioCertificationMark({
  consistency,
  iiaPass,
  arrowFlag,
  claLevel,
  centreAttribution,
  size = 120,
}: Props) {
  const certified = consistency && iiaPass;
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r; // half circumference for crescent arc
  const dashOffset = certified ? 0 : circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(45,96,72,0.15)" strokeWidth={3} />
        {/* Crescent arc — open toward horizon (bottom half) */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#2D6048"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1.4s ease-out' }}
        />
        {/* Arrow failure indicator */}
        {arrowFlag && (
          <circle cx={cx + r * 0.7} cy={cy - r * 0.7} r={5} fill="#D4A843" />
        )}
        {/* Inner text */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fill={certified ? '#2D6048' : 'rgba(245,240,232,0.3)'}
          fontSize={size * 0.1}
          fontFamily="DM Mono, monospace"
        >
          {certified ? 'CERT' : '○'}
        </text>
        <text
          x={cx}
          y={cy + size * 0.1 + 2}
          textAnchor="middle"
          fill="rgba(245,240,232,0.45)"
          fontSize={size * 0.07}
          fontFamily="DM Mono, monospace"
        >
          {claLevel ?? '—'}
        </text>
      </svg>

      <div
        className="rounded px-3 py-2 text-center"
        style={{ background: 'rgba(45,96,72,0.1)', maxWidth: size * 1.5 }}
      >
        {[
          { label: 'Consistency', pass: consistency },
          { label: 'IIA', pass: iiaPass },
        ].map(({ label, pass }) => (
          <div key={label} className="flex items-center gap-2 justify-between">
            <span className="font-mono-dm" style={{ fontSize: 11, color: 'rgba(245,240,232,0.5)' }}>
              {label}
            </span>
            <span
              className="font-mono-dm"
              style={{ fontSize: 11, color: pass ? 'var(--positive)' : 'rgba(245,240,232,0.25)' }}
            >
              {pass ? '✓' : '○'}
            </span>
          </div>
        ))}
        {arrowFlag && (
          <p className="font-mono-dm mt-1" style={{ fontSize: 10, color: '#D4A843' }}>
            arrow: flagged
          </p>
        )}
        {centreAttribution && (
          <p className="font-spectral mt-1" style={{ fontSize: 11, color: 'rgba(245,240,232,0.4)', fontStyle: 'italic' }}>
            {centreAttribution}
          </p>
        )}
      </div>
    </div>
  );
}
