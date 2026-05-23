import type { Signal, ConeLayer } from '../types';

const LAYERS: { key: ConeLayer; label: string; opacity: number }[] = [
  { key: 'preferable', label: 'Preferable', opacity: 1.0 },
  { key: 'projected', label: 'Projected', opacity: 0.85 },
  { key: 'probable', label: 'Probable', opacity: 0.7 },
  { key: 'plausible', label: 'Plausible', opacity: 0.55 },
  { key: 'possible', label: 'Possible', opacity: 0.4 },
];

interface Props {
  signals: Signal[];
  onDropSignal: (signalId: string, layer: ConeLayer) => void;
}

export function FuturesCone({ signals, onDropSignal }: Props) {
  const grouped = LAYERS.reduce(
    (acc, l) => {
      acc[l.key] = signals.filter((s) => s.futures_cone_layer === l.key);
      return acc;
    },
    {} as Record<ConeLayer, Signal[]>,
  );

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, layer: ConeLayer) => {
    const id = e.dataTransfer.getData('signal_id');
    if (id) onDropSignal(id, layer);
  };

  return (
    <div className="flex flex-col gap-1 py-2">
      {LAYERS.map(({ key, label, opacity }) => (
        <div
          key={key}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, key)}
          className="rounded px-3 py-2 transition-slow"
          style={{
            background: `rgba(107,159,196,${opacity * 0.2})`,
            border: `1px solid rgba(107,159,196,${opacity * 0.4})`,
            minHeight: 44,
          }}
        >
          <p
            className="font-mono-dm mb-1"
            style={{ fontSize: 10, color: `rgba(107,159,196,${opacity})`, textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            {label}
          </p>
          <div className="flex flex-wrap gap-1">
            {grouped[key].map((sig) => (
              <span
                key={sig.id}
                className="inline-block px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(107,159,196,0.15)',
                  color: 'rgba(245,240,232,0.7)',
                  fontSize: 11,
                  fontFamily: 'Spectral, serif',
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={sig.text}
              >
                {sig.text.length > 18 ? sig.text.slice(0, 18) + '…' : sig.text}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
