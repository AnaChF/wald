import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useCanopyStore } from '../store';
import { createScenario, auditScenario, runScenarioAudit, getScenarios } from '../api';
import { ScenarioCertificationMark } from '../components/ScenarioCertificationMark';
import type { Scenario, ScenarioAuditResult } from '../types';

const SECTIONS = [
  { key: 'context', label: 'Context', prompt: 'What world obtains?' },
  { key: 'actors', label: 'Actors', prompt: 'Who is present?' },
  { key: 'dynamics', label: 'Dynamics', prompt: 'How do things move?' },
  { key: 'stakes', label: 'Stakes', prompt: 'What is at risk?' },
  { key: 'horizon', label: 'Horizon', prompt: 'What future does this lead to?' },
];

function buildNarrative(sections: Record<string, string>): string {
  return SECTIONS.map(({ key, label }) => sections[key] ? `${label}: ${sections[key]}` : '')
    .filter(Boolean).join('\n\n');
}

export function ScenarioStudioPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const location = useLocation();
  const { session, scenarios, addScenario, updateScenario, setScenarios, setStep } = useCanopyStore();

  const [title, setTitle] = useState('');
  const [sections, setSections] = useState<Record<string, string>>({});
  const [uncertainties, setUncertainties] = useState('');
  const [auditResult, setAuditResult] = useState<ScenarioAuditResult | null>(null);
  const [creating, setCreating] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [certifying, setCertifying] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setStep(5);
    if (sessionId) {
      const shareToken = new URLSearchParams(location.search).get('share_token') ?? undefined;
      getScenarios(sessionId, shareToken).then(setScenarios).catch(() => {});
    }
  }, [sessionId, location.search]);

  const handleNarrativeChange = useCallback(
    (key: string, value: string) => {
      setSections((prev) => ({ ...prev, [key]: value }));
      const narrative = buildNarrative({ ...sections, [key]: value });
      if (!narrative.trim()) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setAuditing(true);
        try {
          const result = await auditScenario({
            scenario_text: narrative,
            critical_uncertainties: uncertainties.split(',').map((s) => s.trim()).filter(Boolean),
            agent_context: session?.centre_description ?? '',
          });
          setAuditResult(result);
        } catch {}
        finally { setAuditing(false); }
      }, 1500);
    },
    [sections, uncertainties, session],
  );

  const handleCreate = async () => {
    if (!title.trim() || !sessionId) return;
    setCreating(true);
    try {
      const narrative = buildNarrative(sections);
      const cu = uncertainties.split(',').map((s) => s.trim()).filter(Boolean);
      const scenario = await createScenario(sessionId, { title, narrative, critical_uncertainties: cu });
      addScenario(scenario);
      setTitle('');
      setSections({});
      setUncertainties('');
      setAuditResult(null);
    } catch {}
    finally { setCreating(false); }
  };

  const handleCertify = async (scenario: Scenario) => {
    setCertifying(scenario.id);
    try {
      const result = await runScenarioAudit(scenario.id);
      updateScenario(scenario.id, result.scenario);
    } catch {}
    finally { setCertifying(null); }
  };

  const claIncast = auditResult?.cla_incast;

  return (
    <div className="px-8 py-8" style={{ color: 'var(--parchment-text)' }}>
      <h2 className="font-cormorant font-light text-3xl mb-2">Scenario Studio</h2>
      <p className="font-spectral text-sm mb-8" style={{ color: 'rgba(245,240,232,0.45)' }}>
        Build and certify your scenarios.
      </p>

      <div className="flex gap-8">
        {/* Builder */}
        <div className="flex-1">
          <div className="mb-5">
            <label className="block font-mono-dm mb-2" style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Scenario title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name this scenario"
              className="w-full rounded-lg px-4 py-3 font-cormorant text-xl font-light"
              style={{ background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.15)', color: 'var(--parchment-text)', outline: 'none' }}
            />
          </div>

          <div className="mb-5">
            <label className="block font-mono-dm mb-2" style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Critical uncertainties (comma-separated)
            </label>
            <input
              value={uncertainties}
              onChange={(e) => setUncertainties(e.target.value)}
              placeholder="e.g. AI adoption rate, geopolitical stability"
              className="w-full rounded-lg px-4 py-2 font-spectral text-sm"
              style={{ background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.15)', color: 'var(--parchment-text)', outline: 'none' }}
            />
          </div>

          <div className="flex flex-col gap-4 mb-6">
            {SECTIONS.map(({ key, label, prompt }) => (
              <div key={key} className="rounded-xl px-5 py-4" style={{ background: 'var(--bg-panel)', color: 'var(--ink)' }}>
                <h4 className="font-cormorant font-semibold text-lg mb-0.5">{label}</h4>
                <p className="font-spectral text-xs mb-3" style={{ fontStyle: 'italic', color: 'rgba(28,28,28,0.5)' }}>{prompt}</p>
                <textarea
                  value={sections[key] ?? ''}
                  onChange={(e) => handleNarrativeChange(key, e.target.value)}
                  rows={3}
                  className="w-full rounded px-3 py-2 font-spectral text-sm resize-none"
                  style={{ background: 'rgba(28,28,28,0.05)', border: '1px solid rgba(28,28,28,0.1)', color: 'var(--ink)', outline: 'none' }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !title.trim()}
            className="px-8 py-3 rounded-lg font-cormorant text-lg font-light transition-slow"
            style={{
              background: title.trim() ? 'rgba(45,96,72,0.3)' : 'rgba(45,96,72,0.1)',
              border: '1px solid rgba(45,96,72,0.5)',
              color: title.trim() ? 'var(--parchment-text)' : 'rgba(245,240,232,0.3)',
              cursor: title.trim() ? 'pointer' : 'default',
            }}
          >
            {creating ? 'Creating…' : 'Add scenario'}
          </button>
        </div>

        {/* Live audit sidebar */}
        <div
          className="w-72 shrink-0 flex flex-col gap-4"
          style={{ borderLeft: '1px solid rgba(245,240,232,0.08)', paddingLeft: 24 }}
        >
          <div>
            <p className="font-mono-dm mb-3" style={{ fontSize: 10, color: 'rgba(245,240,232,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Live consistency audit {auditing && '...'}
            </p>

            {auditResult ? (
              <div className="flex flex-col gap-3">
                {auditResult.internal_contradictions.length > 0 && (
                  <div className="rounded px-3 py-2" style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)' }}>
                    <p className="font-mono-dm mb-1" style={{ fontSize: 10, color: '#D4A843' }}>Tension worth naming</p>
                    {auditResult.internal_contradictions.map((c, i) => (
                      <p key={i} className="font-spectral text-xs" style={{ color: 'rgba(245,240,232,0.65)' }}>{c}</p>
                    ))}
                  </div>
                )}
                {auditResult.cw_map.c_elements.length > 0 && (
                  <div className="rounded px-3 py-2" style={{ background: 'rgba(193,126,58,0.1)', border: '1px solid rgba(193,126,58,0.3)' }}>
                    <p className="font-mono-dm mb-1" style={{ fontSize: 10, color: '#C17E3A' }}>C-intension elements</p>
                    {auditResult.cw_map.c_elements.map((el, i) => (
                      <p key={i} className="font-spectral text-xs" style={{ color: 'rgba(245,240,232,0.55)' }}>{el.text}</p>
                    ))}
                  </div>
                )}
                {auditResult.arrow_failure_flag && (
                  <div className="rounded px-3 py-2" style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.25)' }}>
                    <p className="font-mono-dm" style={{ fontSize: 10, color: '#D4A843' }}>arrow: flagged</p>
                  </div>
                )}
                {auditResult.consistency_pass && !auditResult.internal_contradictions.length && (
                  <p className="font-mono-dm" style={{ fontSize: 11, color: 'var(--positive)' }}>No contradictions detected.</p>
                )}
              </div>
            ) : (
              <p className="font-spectral text-xs" style={{ color: 'rgba(245,240,232,0.25)', fontStyle: 'italic' }}>
                Begin writing to see the audit.
              </p>
            )}
          </div>

          {claIncast && (
            <details
              open
              className="rounded-lg"
              style={{ background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)' }}
            >
              <summary className="px-3 py-2 font-mono-dm cursor-pointer" style={{ fontSize: 10, color: 'rgba(245,240,232,0.4)' }}>
                CLA incast
              </summary>
              <div className="px-3 pb-3 flex flex-col gap-2">
                {(['litany', 'systemic', 'worldview', 'metaphor'] as const).map((k) => (
                  <div key={k}>
                    <p className="font-mono-dm" style={{ fontSize: 9, color: 'rgba(245,240,232,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</p>
                    <p className="font-spectral text-xs" style={{ color: 'rgba(245,240,232,0.55)' }}>{claIncast[k]}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Scenario cards */}
      {scenarios.length > 0 && (
        <div className="mt-10">
          <h3 className="font-cormorant font-light text-2xl mb-4">Your scenarios</h3>
          <div className="flex flex-col gap-4">
            {scenarios.map((sc) => (
              <div
                key={sc.id}
                className="rounded-xl px-6 py-5"
                style={{
                  background: 'rgba(245,240,232,0.04)',
                  border: sc.consistency_certified
                    ? '1px solid rgba(45,96,72,0.5)'
                    : '1px solid rgba(245,240,232,0.1)',
                }}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <h4 className="font-cormorant font-light text-xl mb-1">{sc.title}</h4>
                    {sc.narrative && (
                      <p className="font-spectral text-sm mb-3" style={{ color: 'rgba(245,240,232,0.55)', whiteSpace: 'pre-line' }}>
                        {sc.narrative.length > 280 ? sc.narrative.slice(0, 280) + '…' : sc.narrative}
                      </p>
                    )}
                    {sc.arrow_failure_flag && (
                      <span className="font-mono-dm" style={{ fontSize: 10, color: '#D4A843' }}>arrow: flagged</span>
                    )}
                    <div className="mt-3">
                      <button
                        onClick={() => handleCertify(sc)}
                        disabled={certifying === sc.id}
                        className="px-4 py-1.5 rounded font-cormorant font-light text-sm transition-slow"
                        style={{
                          background: 'rgba(45,96,72,0.2)',
                          border: '1px solid rgba(45,96,72,0.4)',
                          color: 'var(--parchment-text)',
                        }}
                      >
                        {certifying === sc.id ? 'Running audit…' : 'Run certification audit'}
                      </button>
                    </div>
                  </div>
                  {(sc.consistency_certified || sc.iia_pass) && (
                    <ScenarioCertificationMark
                      consistency={sc.consistency_certified}
                      iiaPass={sc.iia_pass}
                      arrowFlag={sc.arrow_failure_flag}
                      claLevel={sc.cla_incast?.metaphor ? 'incremental' : null}
                      centreAttribution={sc.cla_incast?.dominant_centre ?? ''}
                      size={80}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
