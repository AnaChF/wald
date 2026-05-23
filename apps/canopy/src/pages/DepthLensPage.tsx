import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCanopyStore } from '../store';
import { saveCLA, classifySignal } from '../api';
import type { CLAData, CentreAttribution } from '../types';

const LEVELS = [
  {
    key: 'litany' as const,
    name: 'Litany',
    prompt: 'What symptoms are visible? What events are being reported?',
    centering: 'W-intension',
    depth: 0,
  },
  {
    key: 'systemic' as const,
    name: 'Systemic',
    prompt: 'What structures, systems, and processes produce these symptoms?',
    centering: 'Mixed',
    depth: 1,
  },
  {
    key: 'worldview' as const,
    name: 'Worldview',
    prompt: 'What assumptions make these structures seem natural or inevitable?',
    centering: 'C-intension',
    depth: 2,
  },
  {
    key: 'metaphor' as const,
    name: 'Metaphor / Deep Story',
    prompt: 'What deep story or image sustains this worldview?',
    centering: 'C-intension',
    depth: 3,
    requiresCentre: true,
  },
];

const SOIL_BACKGROUNDS = [
  'rgba(245,240,232,0.97)',
  'rgba(238,229,215,0.97)',
  'rgba(224,208,185,0.97)',
  'rgba(188,162,128,0.97)',
];

export function DepthLensPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, setStep, setCLA } = useCanopyStore();

  const [data, setData] = useState<Record<string, string>>({
    litany: '', systemic: '', worldview: '', metaphor: '',
  });
  const [centres, setCentres] = useState<Record<string, CentreAttribution[]>>({
    litany: [], systemic: [], worldview: [], metaphor: [],
  });
  const [revealed, setRevealed] = useState<number>(0);
  const [cwClass, setCwClass] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newCentreName, setNewCentreName] = useState<Record<string, string>>({});
  const [newCentreRole, setNewCentreRole] = useState<Record<string, string>>({});

  useEffect(() => { setStep(4); }, []);

  const handleNext = () => setRevealed((v) => Math.min(v + 1, LEVELS.length - 1));

  const handleBlur = async (key: string, value: string) => {
    if (!value.trim()) return;
    try {
      const result = await classifySignal({
        signal_text: value,
        agent_context: session?.centre_description ?? '',
        session_id: sessionId ?? '',
      });
      setCwClass((prev) => ({ ...prev, [key]: result.cw_classification }));
    } catch {}
  };

  const addCentre = (level: string) => {
    const name = newCentreName[level]?.trim();
    if (!name) return;
    setCentres((prev) => ({
      ...prev,
      [level]: [...(prev[level] ?? []), { name, role: newCentreRole[level] ?? '' }],
    }));
    setNewCentreName((prev) => ({ ...prev, [level]: '' }));
    setNewCentreRole((prev) => ({ ...prev, [level]: '' }));
  };

  const canSave = data.metaphor.trim() && centres.metaphor.length > 0;

  const handleSave = async () => {
    if (!sessionId || !canSave) return;
    setSaving(true);
    try {
      const claData: CLAData = {
        litany: data.litany,
        systemic: data.systemic,
        worldview: data.worldview,
        metaphor: data.metaphor,
        centre_attributions: Object.values(centres).flat(),
      };
      await saveCLA(sessionId, claData);
      setCLA(claData);
      setSaved(true);
      setTimeout(() => navigate(`/canopy/session/${sessionId}/scenarios`), 900);
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div className="px-8 py-8" style={{ color: 'var(--parchment-text)' }}>
      <h2 className="font-cormorant font-light text-3xl mb-2">Depth Lens</h2>
      <p className="font-spectral text-sm mb-8" style={{ color: 'rgba(245,240,232,0.45)' }}>
        Causal Layered Analysis with centering. Surface to depth.
      </p>

      <div className="flex flex-col gap-6">
        {LEVELS.slice(0, revealed + 1).map((level, i) => {
          const bg = SOIL_BACKGROUNDS[i];
          const isLast = i === LEVELS.length - 1;
          const dominantCentre = centres[level.key];
          const cw = cwClass[level.key];

          return (
            <div
              key={level.key}
              className="rounded-xl px-6 py-6 cla-reveal"
              style={{
                background: bg,
                color: 'var(--ink)',
                animationDelay: `${i * 0.15}s`,
                border: `1px solid rgba(28,28,28,0.1)`,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span
                    className="font-mono-dm"
                    style={{ fontSize: 10, color: 'rgba(28,28,28,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  >
                    Level {i + 1}
                  </span>
                  <h3 className="font-cormorant font-semibold text-2xl">{level.name}</h3>
                  <p className="font-spectral text-sm" style={{ fontStyle: 'italic', color: 'rgba(28,28,28,0.55)' }}>
                    {level.prompt}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono-dm px-2 py-0.5 rounded"
                    style={{
                      fontSize: 10,
                      background: level.depth >= 2 ? 'rgba(193,126,58,0.15)' : 'rgba(45,96,72,0.1)',
                      color: level.depth >= 2 ? '#C17E3A' : '#2D6048',
                    }}
                  >
                    {level.centering}
                  </span>
                  {cw && (
                    <span
                      className="font-mono-dm px-2 py-0.5 rounded"
                      style={{
                        fontSize: 10,
                        background: 'rgba(28,28,28,0.06)',
                        color: 'rgba(28,28,28,0.5)',
                      }}
                    >
                      {cw}
                    </span>
                  )}
                </div>
              </div>

              <textarea
                value={data[level.key]}
                onChange={(e) => setData((prev) => ({ ...prev, [level.key]: e.target.value }))}
                onBlur={(e) => handleBlur(level.key, e.target.value)}
                placeholder={`Write your ${level.name.toLowerCase()} here…`}
                rows={4}
                className="w-full rounded-lg px-4 py-3 font-spectral text-base resize-none mb-4"
                style={{
                  background: 'rgba(28,28,28,0.05)',
                  border: '1px solid rgba(28,28,28,0.12)',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
              />

              <div>
                <p
                  className="font-mono-dm mb-2"
                  style={{ fontSize: 11, color: 'rgba(28,28,28,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                >
                  Centre Attribution {level.requiresCentre && <span style={{ color: '#C17E3A' }}>*</span>}
                </p>
                {dominantCentre.length > 0 && (
                  <ul className="mb-3 flex flex-col gap-1">
                    {dominantCentre.map((c, ci) => (
                      <li key={ci} className="flex items-center gap-2">
                        <span className="font-spectral text-sm font-semibold">{c.name}</span>
                        {c.role && (
                          <span className="font-spectral text-xs" style={{ color: 'rgba(28,28,28,0.5)' }}>
                            — {c.role}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <input
                    value={newCentreName[level.key] ?? ''}
                    onChange={(e) => setNewCentreName((prev) => ({ ...prev, [level.key]: e.target.value }))}
                    placeholder="Centre name"
                    className="flex-1 rounded px-3 py-1.5 font-spectral text-sm"
                    style={{ background: 'rgba(28,28,28,0.06)', border: '1px solid rgba(28,28,28,0.12)', color: 'var(--ink)', outline: 'none' }}
                  />
                  <input
                    value={newCentreRole[level.key] ?? ''}
                    onChange={(e) => setNewCentreRole((prev) => ({ ...prev, [level.key]: e.target.value }))}
                    placeholder="Role"
                    className="w-32 rounded px-3 py-1.5 font-spectral text-sm"
                    style={{ background: 'rgba(28,28,28,0.06)', border: '1px solid rgba(28,28,28,0.12)', color: 'var(--ink)', outline: 'none' }}
                  />
                  <button
                    onClick={() => addCentre(level.key)}
                    className="px-3 py-1.5 rounded font-cormorant text-sm font-light"
                    style={{ background: 'rgba(45,96,72,0.15)', border: '1px solid rgba(45,96,72,0.3)', color: 'var(--ink)' }}
                  >
                    + Centre
                  </button>
                </div>
                {level.requiresCentre && dominantCentre.length === 0 && (
                  <p className="mt-2 font-mono-dm" style={{ fontSize: 10, color: '#C17E3A' }}>
                    At least one centre attribution is required at Level 4.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        {revealed < LEVELS.length - 1 && (
          <button
            onClick={handleNext}
            className="px-8 py-3 rounded-lg font-cormorant text-lg font-light transition-slow"
            style={{
              background: 'rgba(45,96,72,0.2)',
              border: '1px solid rgba(45,96,72,0.4)',
              color: 'var(--parchment-text)',
            }}
          >
            Descend
          </button>
        )}
        {revealed === LEVELS.length - 1 && (
          <button
            onClick={handleSave}
            disabled={!canSave || saving || saved}
            className="px-8 py-3 rounded-lg font-cormorant text-lg font-light transition-slow"
            style={{
              background: canSave && !saved ? 'rgba(45,96,72,0.3)' : 'rgba(45,96,72,0.1)',
              border: '1px solid rgba(45,96,72,0.4)',
              color: canSave && !saved ? 'var(--parchment-text)' : 'rgba(245,240,232,0.3)',
              cursor: canSave && !saved ? 'pointer' : 'default',
            }}
          >
            {saved ? 'Saved — continuing…' : saving ? 'Saving…' : 'Complete Narrative Inventory'}
          </button>
        )}
      </div>
    </div>
  );
}
