import React from 'react';

interface TotemicCharacterSVGProps {
  attributes: { curiosity: number; solidarity: number; rootedness: number; reach: number };
  primaryColour: string;
  emblem: string;
  size?: number;
}

export function TotemicCharacterSVG({ attributes, primaryColour, emblem, size = 200 }: TotemicCharacterSVGProps) {
  const { curiosity, solidarity, rootedness, reach } = attributes;

  const bodyW = 40 + rootedness * 0.3;
  const bodyH = 28 + rootedness * 0.2;
  const headR = 18 + curiosity * 0.06;
  const headY = 88 - curiosity * 0.08;
  const armLen = 20 + reach * 0.4;
  const armDropY = 8 + reach * 0.1;
  const solidityR = 4 + solidarity * 0.04;

  const leftArmEndX = 100 - bodyW / 2 - armLen;
  const leftArmEndY = 108 + armDropY;
  const rightArmEndX = 100 + bodyW / 2 + armLen;
  const rightArmEndY = 108 + armDropY;

  const hasAntenna = curiosity > 60;
  const hasSolidityNodes = solidarity > 50;
  const antennaEndX = 100 + curiosity * 0.3;
  const antennaEndY = headY - headR - 20;

  const scale = size / 200;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      style={{ overflow: 'visible' }}
    >
      <g transform={`scale(${scale}) translate(${(200 - 200 * scale) / 2 / scale}, ${(200 - 200 * scale) / 2 / scale})`}>
        {/* Body */}
        <ellipse cx={100} cy={112} rx={bodyW / 2} ry={bodyH / 2} fill={primaryColour} />

        {/* Head */}
        <circle cx={100} cy={headY} r={headR} fill={primaryColour} filter="url(#brighten)" />

        {/* Arms */}
        <line x1={100 - bodyW / 2} y1={108} x2={leftArmEndX} y2={leftArmEndY}
          stroke={primaryColour} strokeWidth={3} strokeLinecap="round" />
        <line x1={100 + bodyW / 2} y1={108} x2={rightArmEndX} y2={rightArmEndY}
          stroke={primaryColour} strokeWidth={3} strokeLinecap="round" />

        {/* Solidarity nodes */}
        {hasSolidityNodes && (
          <>
            <circle cx={leftArmEndX} cy={leftArmEndY} r={solidityR} fill={primaryColour} opacity={0.7} />
            <circle cx={rightArmEndX} cy={rightArmEndY} r={solidityR} fill={primaryColour} opacity={0.7} />
          </>
        )}

        {/* Eyes */}
        <circle cx={92} cy={headY - 3} r={3} fill="white" />
        <circle cx={108} cy={headY - 3} r={3} fill="white" />
        <circle cx={93} cy={headY - 3} r={1.5} fill="#333" />
        <circle cx={109} cy={headY - 3} r={1.5} fill="#333" />

        {/* Antenna */}
        {hasAntenna && (
          <>
            <path
              d={`M 100 ${headY - headR} Q ${100 + curiosity * 0.25} ${headY - headR - 15} ${antennaEndX} ${antennaEndY}`}
              stroke={primaryColour} strokeWidth={2} fill="none"
            />
            <circle cx={antennaEndX} cy={antennaEndY} r={2.5} fill={primaryColour} />
          </>
        )}

        {/* Emblem */}
        <text x={100} y={116} textAnchor="middle" fontSize={14} style={{ userSelect: 'none' }}>
          {emblem}
        </text>

        {/* Filter */}
        <defs>
          <filter id="brighten">
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.2" />
              <feFuncG type="linear" slope="1.2" />
              <feFuncB type="linear" slope="1.2" />
            </feComponentTransfer>
          </filter>
        </defs>
      </g>
    </svg>
  );
}
