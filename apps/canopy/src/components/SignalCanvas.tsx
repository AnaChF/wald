import { useRef, useState, useCallback } from 'react';
import type { Signal } from '../types';

interface Props {
  signals: Signal[];
  cwOverlay: boolean;
  onSignalMove: (id: string, x: number, y: number) => void;
  onSignalClick: (signal: Signal) => void;
}

const NODE_COLOURS: Record<string, string> = {
  deductive: '#2D6048',
  inductive: '#3D6B3A',
  abductive: '#C17E3A',
  wildcard: '#D4A843',
  default: '#4A6B5A',
};

export function SignalCanvas({ signals, cwOverlay, onSignalMove, onSignalClick }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, signal: Signal) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragging({ id: signal.id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - canvasRect.left - dragging.offsetX + 20;
      const y = e.clientY - canvasRect.top - dragging.offsetY + 12;
      onSignalMove(dragging.id, Math.max(0, x), Math.max(0, y));
    },
    [dragging, onSignalMove],
  );

  const handleMouseUp = useCallback(() => setDragging(null), []);

  return (
    <div
      ref={canvasRef}
      className="relative w-full"
      style={{ minHeight: 480, background: 'rgba(10,26,14,0.6)', borderRadius: 8, overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {signals.length === 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ color: 'rgba(245,240,232,0.18)' }}
        >
          <p className="font-spectral text-base">Signals you notice will appear here.</p>
        </div>
      )}

      {signals.map((sig) => {
        const colour = NODE_COLOURS[sig.logic_type ?? 'default'] ?? NODE_COLOURS.default;
        const isMixed = sig.cw_class === 'mixed';
        const isHovered = hoveredId === sig.id;

        return (
          <div
            key={sig.id}
            className="absolute signal-enter group"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('signal_id', sig.id)}
            style={{
              left: sig.canvas_x,
              top: sig.canvas_y,
              cursor: dragging?.id === sig.id ? 'grabbing' : 'grab',
              zIndex: dragging?.id === sig.id ? 20 : 1,
            }}
            onMouseDown={(e) => handleMouseDown(e, sig)}
            onMouseEnter={() => setHoveredId(sig.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSignalClick(sig)}
          >
            {cwOverlay ? (
              <div className="relative w-10 h-10">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: '#2D6048', clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
                />
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: '#C17E3A', clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}
                />
                {isMixed && (
                  <div
                    className="absolute -inset-1 rounded-full border-2"
                    style={{ borderColor: '#D4A843' }}
                  />
                )}
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: colour,
                  boxShadow: isHovered ? '0 0 0 3px rgba(245,240,232,0.25)' : undefined,
                  transition: 'box-shadow 0.3s ease',
                }}
              >
                {sig.strength === 'wildcard' && (
                  <span style={{ color: '#0A1A0E', fontSize: 14, fontWeight: 600 }}>*</span>
                )}
              </div>
            )}

            {isHovered && (
              <div
                className="absolute left-12 top-0 z-30 rounded px-3 py-2 shadow-xl"
                style={{
                  background: 'var(--bg-panel)',
                  color: 'var(--ink)',
                  maxWidth: 260,
                  minWidth: 160,
                  fontSize: 13,
                  fontFamily: 'Spectral, serif',
                  pointerEvents: 'none',
                }}
              >
                <p className="font-semibold mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {sig.text.length > 60 ? sig.text.slice(0, 60) + '…' : sig.text}
                </p>
                {sig.logic_type && (
                  <p className="font-mono-dm" style={{ fontSize: 11, color: 'rgba(28,28,28,0.6)' }}>
                    {sig.logic_type} · {sig.strength} · {sig.cw_class ?? '?'}
                  </p>
                )}
                {sig.classifier_rationale && (
                  <p style={{ fontSize: 11, marginTop: 4, color: 'rgba(28,28,28,0.7)', fontStyle: 'italic' }}>
                    {sig.classifier_rationale}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
