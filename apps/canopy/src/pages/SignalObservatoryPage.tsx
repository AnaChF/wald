import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useCanopyStore } from '../store';
import { addSignal, classifySignal, updateSignalClassification, getSignals } from '../api';
import { SignalCanvas } from '../components/SignalCanvas';
import { FuturesCone } from '../components/FuturesCone';
import type { Signal, ConeLayer } from '../types';

const LOGIC_COLOURS: Record<string, string> = {
  deductive: '#2D6048',
  inductive: '#3D6B3A',
  abductive: '#C17E3A',
  wildcard: '#D4A843',
};

const CW_COLOURS: Record<string, string> = { W: '#2D6048', C: '#C17E3A', mixed: '#8B6B9E' };

export function SignalObservatoryPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const { signals, session, addSignal: storeAddSignal, updateSignal, setSignals, setStep } = useCanopyStore();

  const [input, setInput] = useState('');
  const [cwOverlay, setCwOverlay] = useState(false);
  const [coneOpen, setConeOpen] = useState(true);
  const [classifying, setClassifying] = useState(false);
  const [lastResult, setLastResult] = useState<Signal | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStep(2);
    if (sessionId) {
      getSignals(sessionId).then(setSignals).catch(() => {});
    }
  }, [sessionId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || !sessionId) return;
      const text = input.trim();
      setInput('');
      setClassifying(true);

      try {
        const signal = await addSignal(sessionId, {
          text,
          canvas_x: 60 + Math.random() * 600,
          canvas_y: 40 + Math.random() * 380,
        });
        storeAddSignal(signal);

        const classification = await classifySignal({
          signal_text: text,
          agent_context: session?.centre_description ?? '',
          session_id: sessionId,
        });

        const updated = await updateSignalClassification(signal.id, {
          logic_type: classification.logic_type,
          strength: classification.strength,
          domain: classification.domain,
          cw_class: classification.cw_classification,
          classifier_rationale: classification.rationale.logic_type,
          linked_bolts: classification.linked_bolt_ids,
        });
        updateSignal(signal.id, updated);
        setLastResult(updated);
      } catch (err) {
        console.error(err);
      } finally {
        setClassifying(false);
      }
    },
    [input, sessionId, session, storeAddSignal, updateSignal],
  );

  const handleSignalMove = useCallback(
    (id: string, x: number, y: number) => {
      updateSignal(id, { canvas_x: x, canvas_y: y });
      updateSignalClassification(id, { canvas_x: x, canvas_y: y }).catch(() => {});
    },
    [updateSignal],
  );

  const handleDropSignal = useCallback(
    (signalId: string, layer: ConeLayer) => {
      updateSignal(signalId, { futures_cone_layer: layer });
      updateSignalClassification(signalId, { futures_cone_layer: layer }).catch(() => {});
    },
    [updateSignal],
  );

  const perspectiveSensitive = signals.filter((s) => s.cw_class === 'mixed');

  return (
    <div className="flex flex-col h-full px-8 py-8" style={{ color: 'var(--parchment-text)' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-cormorant font-light text-3xl">Signal Observatory</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCwOverlay((v) => !v)}
            className="px-3 py-1.5 rounded font-mono-dm transition-slow"
            style={{
              fontSize: 11,
              background: cwOverlay ? 'rgba(193,126,58,0.2)' : 'rgba(245,240,232,0.06)',
              border: `1px solid ${cwOverlay ? '#C17E3A' : 'rgba(245,240,232,0.15)'}`,
              color: cwOverlay ? '#C17E3A' : 'rgba(245,240,232,0.5)',
            }}
          >
            C/W overlay {cwOverlay ? 'on' : 'off'}
          </button>
          <button
            onClick={() => setConeOpen((v) => !v)}
            className="px-3 py-1.5 rounded font-mono-dm transition-slow"
            style={{
              fontSize: 11,
              background: 'rgba(245,240,232,0.06)',
              border: '1px solid rgba(245,240,232,0.15)',
              color: 'rgba(245,240,232,0.5)',
            }}
          >
            Cone {coneOpen ? '▲' : '▼'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 flex gap-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What are you noticing?"
          className="flex-1 px-5 py-3 rounded-lg font-spectral text-base"
          style={{
            background: 'rgba(245,240,232,0.06)',
            border: '1px solid rgba(245,240,232,0.15)',
            color: 'var(--parchment-text)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={classifying || !input.trim()}
          className="px-6 py-3 rounded-lg font-cormorant text-lg font-light transition-slow"
          style={{
            background: 'rgba(45,96,72,0.3)',
            border: '1px solid rgba(45,96,72,0.5)',
            color: classifying ? 'rgba(245,240,232,0.4)' : 'var(--parchment-text)',
            cursor: classifying ? 'default' : 'pointer',
          }}
        >
          {classifying ? 'Reading…' : 'Add signal'}
        </button>
      </form>

      {lastResult && lastResult.logic_type && (
        <div
          className="mb-4 px-4 py-3 rounded-lg flex items-center gap-3 flex-wrap"
          style={{ background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)' }}
        >
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full font-mono-dm"
            style={{
              fontSize: 11,
              background: `${LOGIC_COLOURS[lastResult.logic_type] ?? '#4A6B5A'}33`,
              color: LOGIC_COLOURS[lastResult.logic_type] ?? '#4A6B5A',
              border: `1px solid ${LOGIC_COLOURS[lastResult.logic_type] ?? '#4A6B5A'}`,
            }}
            title={lastResult.classifier_rationale ?? ''}
          >
            {lastResult.logic_type}
          </span>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full font-mono-dm"
            style={{
              fontSize: 11,
              background: 'rgba(245,240,232,0.06)',
              color: 'rgba(245,240,232,0.6)',
              border: '1px solid rgba(245,240,232,0.15)',
            }}
          >
            {lastResult.strength}
          </span>
          {lastResult.cw_class && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full font-mono-dm"
              style={{
                fontSize: 11,
                background: `${CW_COLOURS[lastResult.cw_class] ?? '#4A6B5A'}22`,
                color: CW_COLOURS[lastResult.cw_class] ?? '#4A6B5A',
                border: `1px solid ${CW_COLOURS[lastResult.cw_class] ?? '#4A6B5A'}`,
              }}
            >
              {lastResult.cw_class}-intension
            </span>
          )}
          {lastResult.domain && (
            <span className="font-mono-dm" style={{ fontSize: 11, color: 'rgba(245,240,232,0.35)' }}>
              {lastResult.domain}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-5 flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <SignalCanvas
            signals={signals}
            cwOverlay={cwOverlay}
            onSignalMove={handleSignalMove}
            onSignalClick={() => {}}
          />

          {perspectiveSensitive.length > 0 && (
            <details
              className="mt-3 rounded-lg px-4 py-2"
              style={{ background: 'rgba(193,126,58,0.08)', border: '1px solid rgba(193,126,58,0.2)' }}
            >
              <summary
                className="font-mono-dm cursor-pointer"
                style={{ fontSize: 11, color: '#C17E3A' }}
              >
                Perspective-sensitive signals ({perspectiveSensitive.length})
              </summary>
              <ul className="mt-2 flex flex-col gap-1">
                {perspectiveSensitive.map((s) => (
                  <li key={s.id} className="font-spectral text-sm" style={{ color: 'rgba(245,240,232,0.6)' }}>
                    {s.text}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {coneOpen && (
          <div
            className="w-52 shrink-0 overflow-auto"
            style={{ borderLeft: '1px solid rgba(107,159,196,0.2)', paddingLeft: 16 }}
          >
            <p
              className="font-mono-dm mb-3"
              style={{ fontSize: 10, color: 'rgba(107,159,196,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Futures Cone
            </p>
            <FuturesCone signals={signals} onDropSignal={handleDropSignal} />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="font-mono-dm" style={{ fontSize: 11, color: 'rgba(245,240,232,0.3)' }}>
          {signals.length} signal{signals.length !== 1 ? 's' : ''} recorded
        </p>
      </div>
    </div>
  );
}
