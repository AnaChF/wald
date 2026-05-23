import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCanopyStore } from '../store';
import { saveTriangle } from '../api';
import type { Signal, Tension } from '../types';

type Panel = 'push' | 'weight' | 'pull';

function classifyPanel(signal: Signal): Panel | null {
  if (!signal.logic_type) return null;
  if (signal.logic_type === 'deductive' && signal.strength === 'strong') return 'push';
  if (signal.cw_class === 'mixed') return 'weight';
  if (signal.logic_type === 'abductive' || signal.strength === 'wildcard') return 'pull';
  return null;
}

function detectTensions(
  push: Signal[], weight: Signal[], pull: Signal[]
): Tension[] {
  const tensions: Tension[] = [];
  if (pull.length > 0 && weight.length > 0) {
    tensions.push({
      type: 'pull-weight',
      description: 'Transformation is possible but the weight of structural inertia is significant.',
      magnitude: weight.length > pull.length ? 'high' : 'medium',
      signal_ids: [...pull.map((s) => s.id), ...weight.map((s) => s.id)],
    });
  }
  if (push.length > 0 && pull.length > 0) {
    tensions.push({
      type: 'push-pull',
      description: 'Current momentum and emerging pull are aligned. Rapid change is a plausible trajectory.',
      magnitude: 'medium',
      signal_ids: [...push.map((s) => s.id), ...pull.map((s) => s.id)],
    });
  }
  if (push.length > 0 && weight.length > 0) {
    tensions.push({
      type: 'push-weight',
      description: 'The current trajectory is running against structural constraints. This may be unsustainable.',
      magnitude: push.length > weight.length ? 'high' : 'medium',
      signal_ids: [...push.map((s) => s.id), ...weight.map((s) => s.id)],
    });
  }
  return tensions;
}

const TENSION_COLOURS: Record<string, string> = {
  'pull-weight': '#8B6B9E',
  'push-pull': '#6B9FC4',
  'push-weight': '#D4A843',
};

export function FuturesTrianglePage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { signals, session, setTriangle, setStep } = useCanopyStore();

  const [panels, setPanels] = useState<Record<Panel, Signal[]>>({ push: [], weight: [], pull: [] });
  const [bricks] = useState<{ id: string; description: string }[]>(
    session?.brick_seed
      ? []
      : []
  );
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStep(3);
    // Auto-suggest placements
    const suggested: Record<Panel, Signal[]> = { push: [], weight: [], pull: [] };
    for (const s of signals) {
      const panel = classifyPanel(s);
      if (panel) suggested[panel].push(s);
    }
    setPanels(suggested);
  }, [signals]);

  const tensions = detectTensions(panels.push, panels.weight, panels.pull);

  const unplaced = signals.filter(
    (s) => !panels.push.find((p) => p.id === s.id) &&
           !panels.weight.find((p) => p.id === s.id) &&
           !panels.pull.find((p) => p.id === s.id),
  );

  const addToPanel = (signal: Signal, panel: Panel) => {
    setPanels((prev) => {
      const filtered = { ...prev };
      for (const k of ['push', 'weight', 'pull'] as Panel[]) {
        filtered[k] = filtered[k].filter((s) => s.id !== signal.id);
      }
      return { ...filtered, [panel]: [...filtered[panel], signal] };
    });
  };

  const handleSave = async () => {
    if (!sessionId) return;
    setSaving(true);
    try {
      const triangle = {
        push: panels.push.map((s) => s.text),
        weight: panels.weight.map((s) => s.text),
        pull: panels.pull.map((s) => s.text),
        tensions,
      };
      await saveTriangle(sessionId, triangle);
      setTriangle(triangle);
      setSaved(true);
      setTimeout(() => navigate(`/canopy/session/${sessionId}/cla`), 800);
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div className="px-8 py-8" style={{ color: 'var(--parchment-text)' }}>
      <h2 className="font-cormorant font-light text-3xl mb-2">Futures Triangle Engine</h2>
      <p className="font-spectral text-sm mb-8" style={{ color: 'rgba(245,240,232,0.45)' }}>
        Arrange signals across the three forces shaping the future.
      </p>

      {unplaced.length > 0 && (
        <div
          className="mb-6 px-4 py-3 rounded-lg"
          style={{ background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)' }}
        >
          <p className="font-mono-dm mb-2" style={{ fontSize: 11, color: 'rgba(245,240,232,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Unplaced signals
          </p>
          <div className="flex flex-wrap gap-2">
            {unplaced.map((s) => (
              <div key={s.id} className="flex items-center gap-1">
                <span
                  className="font-spectral text-sm px-2 py-1 rounded"
                  style={{ background: 'rgba(245,240,232,0.06)', color: 'rgba(245,240,232,0.65)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={s.text}
                >
                  {s.text.length > 30 ? s.text.slice(0, 30) + '…' : s.text}
                </span>
                <div className="flex gap-1">
                  {(['push', 'weight', 'pull'] as Panel[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => addToPanel(s, p)}
                      className="font-mono-dm px-1.5 py-0.5 rounded"
                      style={{ fontSize: 10, background: 'rgba(45,96,72,0.2)', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(45,96,72,0.3)' }}
                    >
                      {p[0].toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        {([
          { key: 'push' as Panel, label: 'Push', question: 'What is already in motion?', desc: 'Deductive, strong-signal forces driving current direction.' },
          { key: 'weight' as Panel, label: 'Weight', question: 'What refuses to change?', desc: 'Structural forces, constraints, and stabilising inertia.' },
          { key: 'pull' as Panel, label: 'Pull', question: 'What is being pulled toward?', desc: 'Emerging attractors, wildcards, and abductive possibilities.' },
        ]).map(({ key, label, question, desc }) => (
          <div
            key={key}
            className="rounded-xl px-5 py-5"
            style={{ background: 'var(--bg-panel)', color: 'var(--ink)', minHeight: 240 }}
          >
            <h3 className="font-cormorant font-semibold text-xl mb-1">{label}</h3>
            <p className="font-spectral text-sm mb-1" style={{ fontStyle: 'italic', color: 'rgba(28,28,28,0.6)' }}>{question}</p>
            <p className="font-spectral text-xs mb-4" style={{ color: 'rgba(28,28,28,0.45)' }}>{desc}</p>
            <div className="flex flex-col gap-2">
              {panels[key].map((s) => (
                <div
                  key={s.id}
                  className="px-3 py-2 rounded text-sm font-spectral flex items-start gap-2"
                  style={{
                    background: highlighted.includes(s.id) ? 'rgba(45,96,72,0.15)' : 'rgba(28,28,28,0.06)',
                    border: highlighted.includes(s.id) ? '1px solid rgba(45,96,72,0.4)' : '1px solid rgba(28,28,28,0.1)',
                    transition: 'background 0.4s ease',
                  }}
                >
                  <span className="flex-1">{s.text}</span>
                  <button
                    onClick={() => setPanels((prev) => ({ ...prev, [key]: prev[key].filter((x) => x.id !== s.id) }))}
                    style={{ fontSize: 12, color: 'rgba(28,28,28,0.3)', lineHeight: 1, flexShrink: 0 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {tensions.length > 0 && (
        <div className="mb-8">
          <h3 className="font-cormorant font-light text-2xl mb-4">Tension Mapper</h3>
          <div className="flex flex-col gap-3">
            {tensions.map((t) => (
              <div
                key={t.type}
                className="rounded-lg px-5 py-4 cursor-pointer transition-slow"
                style={{
                  background: `${TENSION_COLOURS[t.type]}15`,
                  border: `1px solid ${TENSION_COLOURS[t.type]}40`,
                }}
                onMouseEnter={() => setHighlighted(t.signal_ids)}
                onMouseLeave={() => setHighlighted([])}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className="font-mono-dm px-2 py-0.5 rounded"
                    style={{ fontSize: 10, background: `${TENSION_COLOURS[t.type]}25`, color: TENSION_COLOURS[t.type] }}
                  >
                    {t.type}
                  </span>
                  <span className="font-mono-dm" style={{ fontSize: 10, color: 'rgba(245,240,232,0.35)' }}>
                    magnitude: {t.magnitude}
                  </span>
                </div>
                <p className="font-spectral text-sm" style={{ color: 'rgba(245,240,232,0.7)' }}>{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || saved}
        className="px-8 py-3 rounded-lg font-cormorant text-lg font-light transition-slow"
        style={{
          background: saved ? 'rgba(45,96,72,0.4)' : 'rgba(45,96,72,0.25)',
          border: '1px solid rgba(45,96,72,0.5)',
          color: 'var(--parchment-text)',
        }}
      >
        {saved ? 'Saved — continuing…' : saving ? 'Saving…' : 'Generate Futures Triangle report'}
      </button>
    </div>
  );
}
