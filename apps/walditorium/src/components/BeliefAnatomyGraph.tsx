import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import type { BOLT, NUT, BRICK } from '../types';

interface BeliefAnatomyGraphProps {
  bolts: BOLT[];
  nuts: NUT[];
  bricks: BRICK[];
  onBoltClick?: (bolt: BOLT) => void;
  width?: number;
  height?: number;
}

interface NodeDatum {
  id: string;
  kind: 'bolt' | 'nut' | 'brick';
  label: string;
  bolt?: BOLT;
  nut?: NUT;
  brick?: BRICK;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface LinkDatum {
  source: string | NodeDatum;
  target: string | NodeDatum;
}

interface TooltipState {
  x: number;
  y: number;
  bolt: BOLT;
}

export function BeliefAnatomyGraph({
  bolts,
  nuts,
  bricks,
  onBoltClick,
  width = 500,
  height = 480,
}: BeliefAnatomyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Build node and link data
    const nodes: NodeDatum[] = [];
    const links: LinkDatum[] = [];

    bolts.forEach((bolt) => {
      nodes.push({ id: bolt.id, kind: 'bolt', label: bolt.id.replace('bolt-', 'B'), bolt });
    });

    nuts.forEach((nut) => {
      nodes.push({ id: nut.id, kind: 'nut', label: nut.id.replace('nut-', 'N'), nut });
      links.push({ source: nut.bolt_id, target: nut.id });
    });

    bricks.forEach((brick) => {
      nodes.push({ id: brick.id, kind: 'brick', label: brick.id.replace('brick-', 'Br'), brick });
      links.push({ source: brick.bolt_id, target: brick.id });
    });

    // D3 force simulation
    const simulation = d3
      .forceSimulation<NodeDatum>(nodes)
      .force('charge', d3.forceManyBody<NodeDatum>().strength(-220))
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(links).id((d) => d.id).distance(90))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<NodeDatum>(30));

    // Zoom container
    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]).on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
    svg.call(zoom);

    // Links
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', 'rgba(245,240,232,0.18)')
      .attr('stroke-width', 1);

    // Nodes group
    const node = g
      .append('g')
      .selectAll<SVGGElement, NodeDatum>('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', (d) => (d.kind === 'bolt' ? 'pointer' : 'default'))
      .call(
        d3
          .drag<SVGGElement, NodeDatum>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // BRICK extra ring
    node
      .filter((d) => d.kind === 'brick')
      .append('circle')
      .attr('r', 24)
      .attr('fill', 'none')
      .attr('stroke', '#c9940a')
      .attr('stroke-width', 2)
      .attr('opacity', 0.7);

    // Node shapes
    node.each(function (d) {
      const el = d3.select(this);
      if (d.kind === 'nut') {
        el.append('rect')
          .attr('x', -7)
          .attr('y', -7)
          .attr('width', 14)
          .attr('height', 14)
          .attr('fill', '#f5f0e8')
          .attr('opacity', 0.85)
          .attr('rx', 2);
      } else {
        const fill =
          d.kind === 'bolt'
            ? '#2d5c1f'
            : d.brick?.severity === 'high'
            ? '#8b0000'
            : d.brick?.severity === 'medium'
            ? '#a67c00'
            : '#2d5c1f';
        el.append('circle')
          .attr('r', 20)
          .attr('fill', fill)
          .attr('stroke', d.kind === 'brick' ? '#c9940a' : '#4a8a38')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.9);
      }
    });

    // Node labels
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', (d) => (d.kind === 'nut' ? '#0e1f0e' : '#f5f0e8'))
      .attr('font-family', '"DM Mono", monospace')
      .attr('font-size', '9px')
      .attr('font-weight', '500')
      .attr('pointer-events', 'none')
      .text((d) => d.label);

    // Bolt click + hover
    node
      .filter((d) => d.kind === 'bolt')
      .on('click', (_event, d) => {
        if (d.bolt && onBoltClick) onBoltClick(d.bolt);
      })
      .on('mouseenter', (event, d) => {
        if (!d.bolt) return;
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        setTooltip({
          x: event.clientX - rect.left + 12,
          y: event.clientY - rect.top - 8,
          bolt: d.bolt,
        });
      })
      .on('mouseleave', () => setTooltip(null));

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as NodeDatum).x ?? 0)
        .attr('y1', (d) => (d.source as NodeDatum).y ?? 0)
        .attr('x2', (d) => (d.target as NodeDatum).x ?? 0)
        .attr('y2', (d) => (d.target as NodeDatum).y ?? 0);

      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [bolts, nuts, bricks, width, height, onBoltClick]);

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{
          backgroundColor: 'rgba(10,26,10,0.7)',
          borderRadius: '8px',
          border: '1px solid rgba(201,148,10,0.15)',
        }}
      />
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            top: tooltip.y,
            left: tooltip.x,
            backgroundColor: '#0a1a0a',
            border: '1px solid rgba(201,148,10,0.4)',
            borderRadius: '6px',
            padding: '10px 14px',
            maxWidth: '280px',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '9px',
              color: 'var(--wald-ochre)',
              letterSpacing: '0.1em',
              marginBottom: '4px',
            }}
          >
            {tooltip.bolt.id.toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '11px',
              color: 'rgba(245,240,232,0.7)',
              marginBottom: '6px',
              fontStyle: 'italic',
            }}
          >
            C: {tooltip.bolt.c_intension.slice(0, 100)}
            {tooltip.bolt.c_intension.length > 100 ? '…' : ''}
          </div>
          <div
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '11px',
              color: 'rgba(245,240,232,0.6)',
            }}
          >
            W: {tooltip.bolt.w_intension.slice(0, 100)}
            {tooltip.bolt.w_intension.length > 100 ? '…' : ''}
          </div>
        </div>
      )}
      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {[
          { color: '#2d5c1f', label: 'BOLT', shape: 'circle' },
          { color: '#f5f0e8', label: 'NUT', shape: 'rect' },
          { color: '#8b3030', label: 'BRICK', shape: 'circle', ring: true },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: item.shape === 'circle' ? '50%' : '2px',
                backgroundColor: item.color,
                border: item.ring ? '2px solid #c9940a' : '1px solid rgba(255,255,255,0.2)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: '8px',
                color: 'rgba(245,240,232,0.5)',
                letterSpacing: '0.08em',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
