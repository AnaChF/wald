import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCanopyStore } from '../store';
import { generateBackcast, getIndicators, logDrift, exportHarvest, getReportUrl, submitPWTC, getRevisions } from '../api';
import type { Milestone, DecisionGate, HarvestSeed } from '../types';

const STATUS_COLOURS: Record<string, string> = {
  quiet: 'rgba(45,96,72,0.5)',
  stirring: '#C17E3A',
  firing: '#D4A843',
  contradicted: '#8B6B9E',
};

const HARVEST_LAYER_LABELS: Record<string, string> = {
  roots: 'Roots — foundational values and constraints',
  trunk: 'Trunk — core beliefs and commitments',
  branches: 'Branches — strategies and capabilities',
  leaves: 'Leaves — actions and practices',
  fruits: 'Fruits — outcomes and impacts',
};

const REVISION_META: Record<string, { label: string; color: string }> = {
  session_created:   { label: 'Session created',     color: 'rgba(45,96,72,0.9)' },
  framing_edit:      { label: 'Framing edited',       color: 'rgba(45,96,72,0.6)' },
  signal_added:      { label: 'Signal added',         color: '#6B9FC4' },
  signal_classified: { label: 'Signal classified',    color: '#6B9FC4' },
  triangle_updated:  { label: 'Triangle updated',     color: '#C17E3A' },
  cla_updated:       { label: 'CLA updated',          color: '#8B7355' },
  scenario_audited:  { label: 'Scenario audited',     color: '#D4A843' },
  forecast_generated:{ label: 'Forecast generated',  color: '#8B6B9E' },
  drift_logged:      { label: 'Drift logged',         color: '#C17E3A' },
  pwtc_submitted:    { label: 'Submitted to PWTC',    color: '#6B9FC4' },
};

const DRIFT_LOGIC = ['Deductive', 'Inductive', 'Abductive'];
const REVISION_TYPES = ['Expansion', 'Contraction', 'Full revision'];

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ForecastPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const { scenarios, forecast, setForecast, setStep } = useCanopyStore();

  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [timeHorizon, setTimeHorizon] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [indicators, setIndicators] = useState<Record<string, unknown>[]>([]);
  const [revisions, setRevisions] = useState<Record<string, unknown>[]>([]);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [driftOpen, setDriftOpen] = useState(false);
  const [drift, setDrift] = useState({ new_signals: '', drift_description: '', drift_logic: '', revision_type: '', monitor_focus: '' });
  const [driftSaving, setDriftSaving] = useState(false);
  const [driftSaved, setDriftSaved] = useState(false);
  const [harvestExporting, setHarvestExporting] = useState(false);
  const [harvestExported, setHarvestExported] = useState(false);

  const [pwtcScenarioId, setPwtcScenarioId] = useState('');
  const [pwtcConfirmOpen, setPwtcConfirmOpen] = useState(false);
  const [pwtcSubmitting, setPwtcSubmitting] = useState(false);
  const [pwtcSubmitted, setPwtcSubmitted] = useState(false);

  useEffect(() => {
    setStep(6);
    if (!sessionId) return;
    getIndicators(sessionId).then(setIndicators).catch(() => {});
    getRevisions(sessionId).then(setRevisions).catch(() => {});
  }, [sessionId]);

  const certifiedScenarios = scenarios.filter((s) => s.consistency_certified);

  const handleGenerate = async () => {
    if (!sessionId || !selectedScenarioId) return;
    setGenerating(true);
    try {
      const result = await generateBackcast(sessionId, {
        preferred_horizon_id: selectedScenarioId,
        time_horizon_years: timeHorizon,
      });
      setForecast(result);
      // Reload revisions after generating forecast
      getRevisions(sessionId).then(setRevisions).catch(() => {});
    } catch {}
    finally { setGenerating(false); }
  };

  const handleDriftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;
    setDriftSaving(true);
    try {
      await logDrift(sessionId, drift);
      setDriftSaved(true);
      setDrift({ new_signals: '', drift_description: '', drift_logic: '', revision_type: '', monitor_focus: '' });
      getRevisions(sessionId).then(setRevisions).catch(() => {});
    } catch {}
    finally { setDriftSaving(false); }
  };

  const handleExportHarvest = async () => {
    if (!sessionId) return;
    setHarvestExporting(true);
    try {
      await exportHarvest(sessionId);
      setHarvestExported(true);
    } catch {}
    finally { setHarvestExporting(false); }
  };

  const handlePwtcSubmit = async () => {
    if (!sessionId || !pwtcScenarioId) return;
    setPwtcSubmitting(true);
    try {
      await submitPWTC(sessionId, pwtcScenarioId);
      setPwtcSubmitted(true);
      setPwtcConfirmOpen(false);
      getRevisions(sessionId).then(setRevisions).catch(() => {});
    } catch {}
    finally { setPwtcSubmitting(false); }
  };

  const milestones: Milestone[] = forecast?.milestones ?? [];
  const gates: DecisionGate[] = forecast?.decision_gates ?? [];
  const seeds: HarvestSeed[] = forecast?.harvest_tree_seeds ?? [];
  const earliestIds = new Set(forecast?.earliest_decisions ?? []);

  const seedsByLayer = ['roots', 'trunk', 'branches', 'leaves', 'fruits'].reduce(
    (acc, layer) => {
      acc[layer] = seeds.filter((s) => s.layer === layer);
      return acc;
    },
    {} as Record<string, HarvestSeed[]>,
  );

  return (
    <div className="px-8 py-8" style={{ color: 'var(--parchment-text)' }}>
      <div className="flex items-start justify-between mb-2">
        <h2 className="font-cormorant font-light text-3xl">Early Warning System</h2>
        {sessionId && (
          <a
            href={getReportUrl(sessionId)}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded font-mono-dm transition-slow"
            style={{
              fontSize: 11,
              background: 'rgba(45,96,72,0.15)',
              border: '1px solid rgba(45,96,72,0.35)',
              color: 'rgba(245,240,232,0.6)',
              textDecoration: 'none',
            }}
          >
            ↓ Download PDF report
          </a>
        )}
      </div>
      <p className="font-spectral text-sm mb-8" style={{ color: 'rgba(245,240,232,0.45)' }}>
        Backcasting from your preferred scenario. Indicators. Drift detection.
      </p>

      {/* Backcast generation */}
      <div className="mb-8 rounded-xl px-6 py-6" style={{ background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)' }}>
        <h3 className="font-cormorant font-light text-xl mb-4">Generate Backcasting Forecast</h3>
        {certifiedScenarios.length === 0 ? (
          <p className="font-spectral text-sm" style={{ color: 'rgba(245,240,232,0.35)', fontStyle: 'italic' }}>
            Certify at least one scenario in the Scenario Studio to enable backcasting.
          </p>
        ) : (
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block font-mono-dm mb-2" style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Preferred scenario</label>
              <select
                value={selectedScenarioId}
                onChange={(e) => setSelectedScenarioId(e.target.value)}
                className="w-full rounded-lg px-4 py-3 font-spectral"
                style={{ background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.15)', color: 'var(--parchment-text)', outline: 'none' }}
              >
                <option value="">Select a scenario…</option>
                {certifiedScenarios.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono-dm mb-2" style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Years</label>
              <input
                type="number" value={timeHorizon} min={1} max={50}
                onChange={(e) => setTimeHorizon(Number(e.target.value))}
                className="w-20 rounded-lg px-3 py-3 font-mono-dm"
                style={{ background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.15)', color: 'var(--parchment-text)', outline: 'none' }}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedScenarioId}
              className="px-6 py-3 rounded-lg font-cormorant text-lg font-light transition-slow"
              style={{
                background: selectedScenarioId ? 'rgba(45,96,72,0.3)' : 'rgba(45,96,72,0.1)',
                border: '1px solid rgba(45,96,72,0.5)',
                color: selectedScenarioId ? 'var(--parchment-text)' : 'rgba(245,240,232,0.3)',
              }}
            >
              {generating ? 'Generating…' : 'Generate'}
            </button>
          </div>
        )}
      </div>

      {/* Milestone timeline */}
      {milestones.length > 0 && (
        <div className="mb-8">
          <h3 className="font-cormorant font-light text-xl mb-4">Backcasting Timeline</h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4" style={{ minWidth: milestones.length * 200 }}>
              {milestones.map((m) => {
                const gate = gates.find((g) => g.milestone_id === m.id);
                const isEarliest = earliestIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    className="shrink-0 rounded-lg px-4 py-4"
                    style={{
                      width: 188,
                      background: 'rgba(107,159,196,0.08)',
                      border: `1px solid ${isEarliest ? '#D4A843' : 'rgba(107,159,196,0.25)'}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono-dm" style={{ fontSize: 10, color: '#6B9FC4' }}>+{m.year_offset}y</span>
                      {isEarliest && <span className="font-mono-dm" style={{ fontSize: 9, color: '#D4A843' }}>◆ earliest</span>}
                      <span className="font-mono-dm px-1 rounded" style={{ fontSize: 9, background: 'rgba(107,159,196,0.15)', color: '#6B9FC4' }}>{m.type}</span>
                    </div>
                    <p className="font-cormorant text-sm font-light" style={{ color: 'var(--parchment-text)', lineHeight: 1.4 }}>
                      {m.description}
                    </p>
                    {gate && (
                      <div className="mt-3 pt-2" style={{ borderTop: '1px solid rgba(107,159,196,0.2)' }}>
                        <p className="font-mono-dm" style={{ fontSize: 9, color: 'rgba(245,240,232,0.3)' }}>if yes →</p>
                        <p className="font-spectral" style={{ fontSize: 11, color: 'rgba(245,240,232,0.55)' }}>{gate.if_yes_path}</p>
                        <p className="font-mono-dm mt-1" style={{ fontSize: 9, color: 'rgba(245,240,232,0.3)' }}>if no →</p>
                        <p className="font-spectral" style={{ fontSize: 11, color: 'rgba(245,240,232,0.55)' }}>{gate.if_no_path}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Harvest Tree Seeds panel */}
      {seeds.length > 0 && (
        <div className="mb-8 rounded-xl px-6 py-6" style={{ background: 'rgba(139,107,158,0.06)', border: '1px solid rgba(139,107,158,0.2)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-cormorant font-light text-xl">Harvest Tree Seeds</h3>
            <button
              onClick={handleExportHarvest}
              disabled={harvestExporting || harvestExported}
              className="px-4 py-1.5 rounded font-mono-dm transition-slow"
              style={{
                fontSize: 11,
                background: harvestExported ? 'rgba(45,96,72,0.2)' : 'rgba(139,107,158,0.2)',
                border: `1px solid ${harvestExported ? 'rgba(45,96,72,0.4)' : 'rgba(139,107,158,0.4)'}`,
                color: harvestExported ? 'var(--positive)' : '#8B6B9E',
              }}
            >
              {harvestExported ? '✓ Exported' : harvestExporting ? 'Exporting…' : 'Export to Harvest Trees™'}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {['roots', 'trunk', 'branches', 'leaves', 'fruits'].map((layer) => {
              const layerSeeds = seedsByLayer[layer];
              if (!layerSeeds?.length) return null;
              return (
                <div key={layer}>
                  <p className="font-mono-dm mb-2" style={{ fontSize: 10, color: '#8B6B9E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {HARVEST_LAYER_LABELS[layer]}
                  </p>
                  <div className="flex flex-col gap-1">
                    {layerSeeds.map((s, i) => (
                      <p key={i} className="font-spectral text-sm" style={{ color: 'rgba(245,240,232,0.65)', paddingLeft: 8, borderLeft: '2px solid rgba(139,107,158,0.3)' }}>
                        {s.text}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Indicator Library */}
      {indicators.length > 0 && (
        <div className="mb-8">
          <h3 className="font-cormorant font-light text-xl mb-4">Indicator Library</h3>
          <div className="flex flex-col gap-3">
            {indicators.map((sc: any) => (
              <div key={sc.scenario_id} className="rounded-lg px-5 py-4" style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.08)' }}>
                <p className="font-cormorant text-base font-light mb-3">{sc.scenario_title}</p>
                <div className="flex flex-wrap gap-4">
                  {sc.indicators.map((ind: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOURS[ind.status] ?? STATUS_COLOURS.quiet }} />
                      <span className="font-spectral text-sm" style={{ color: 'rgba(245,240,232,0.6)' }}>{ind.label}</span>
                      <span className="font-mono-dm" style={{ fontSize: 10, color: STATUS_COLOURS[ind.status] ?? STATUS_COLOURS.quiet }}>{ind.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drift Detector */}
      <div className="mb-8 rounded-xl px-6 py-5" style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.08)' }}>
        <button
          onClick={() => setDriftOpen((v) => !v)}
          className="flex items-center gap-3 w-full text-left font-cormorant font-light text-xl"
        >
          Weekly Drift Review {driftOpen ? '▲' : '▼'}
        </button>

        {driftOpen && (
          <form onSubmit={handleDriftSubmit} className="mt-5 flex flex-col gap-4">
            {[
              { key: 'new_signals', label: 'Did you observe any new signals this week?' },
              { key: 'drift_description', label: 'Where did the environment drift from the scenario?' },
              { key: 'monitor_focus', label: 'What will you monitor more closely next week?' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block font-spectral text-sm mb-2" style={{ color: 'rgba(245,240,232,0.6)' }}>{label}</label>
                <input
                  value={(drift as any)[key]}
                  onChange={(e) => setDrift((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full rounded px-3 py-2 font-spectral text-sm"
                  style={{ background: 'rgba(245,240,232,0.05)', border: '1px solid rgba(245,240,232,0.12)', color: 'var(--parchment-text)', outline: 'none' }}
                />
              </div>
            ))}

            <div>
              <label className="block font-spectral text-sm mb-2" style={{ color: 'rgba(245,240,232,0.6)' }}>
                Why did the drift happen? <span style={{ color: '#C17E3A' }}>*</span>
              </label>
              <div className="flex gap-2">
                {DRIFT_LOGIC.map((l) => (
                  <button type="button" key={l}
                    onClick={() => setDrift((prev) => ({ ...prev, drift_logic: l }))}
                    className="px-3 py-1.5 rounded font-mono-dm transition-slow"
                    style={{
                      fontSize: 11,
                      background: drift.drift_logic === l ? 'rgba(45,96,72,0.35)' : 'rgba(245,240,232,0.05)',
                      border: `1px solid ${drift.drift_logic === l ? 'rgba(45,96,72,0.6)' : 'rgba(245,240,232,0.12)'}`,
                      color: drift.drift_logic === l ? 'var(--parchment-text)' : 'rgba(245,240,232,0.4)',
                    }}
                  >{l}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-spectral text-sm mb-2" style={{ color: 'rgba(245,240,232,0.6)' }}>
                Minimal revision type <span style={{ color: '#C17E3A' }}>*</span>
              </label>
              <div className="flex gap-2">
                {REVISION_TYPES.map((r) => (
                  <button type="button" key={r}
                    onClick={() => setDrift((prev) => ({ ...prev, revision_type: r }))}
                    className="px-3 py-1.5 rounded font-mono-dm transition-slow"
                    style={{
                      fontSize: 11,
                      background: drift.revision_type === r ? 'rgba(139,107,158,0.3)' : 'rgba(245,240,232,0.05)',
                      border: `1px solid ${drift.revision_type === r ? 'rgba(139,107,158,0.6)' : 'rgba(245,240,232,0.12)'}`,
                      color: drift.revision_type === r ? 'var(--parchment-text)' : 'rgba(245,240,232,0.4)',
                    }}
                  >{r}</button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={driftSaving || !drift.drift_logic || !drift.revision_type}
              className="self-start px-6 py-2.5 rounded-lg font-cormorant text-base font-light transition-slow"
              style={{ background: 'rgba(45,96,72,0.25)', border: '1px solid rgba(45,96,72,0.45)', color: 'var(--parchment-text)' }}
            >
              {driftSaved ? 'Logged.' : driftSaving ? 'Logging…' : 'Log this week'}
            </button>
          </form>
        )}
      </div>

      {/* Revision Trail */}
      <div className="mb-8 rounded-xl px-6 py-5" style={{ background: 'rgba(245,240,232,0.02)', border: '1px solid rgba(245,240,232,0.07)' }}>
        <button
          onClick={() => setRevisionsOpen((v) => !v)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-cormorant font-light text-xl">Revision Trail</span>
          <span className="flex items-center gap-2">
            {revisions.length > 0 && (
              <span
                className="font-mono-dm px-2 py-0.5 rounded-full"
                style={{ fontSize: 10, background: 'rgba(45,96,72,0.2)', color: 'rgba(245,240,232,0.45)' }}
              >
                {revisions.length}
              </span>
            )}
            <span style={{ color: 'rgba(245,240,232,0.3)', fontSize: 12 }}>{revisionsOpen ? '▲' : '▼'}</span>
          </span>
        </button>

        {revisionsOpen && (
          <div className="mt-5">
            {revisions.length === 0 ? (
              <p className="font-spectral text-sm" style={{ color: 'rgba(245,240,232,0.3)', fontStyle: 'italic' }}>
                No revisions recorded yet.
              </p>
            ) : (
              <ol className="flex flex-col gap-0" style={{ borderLeft: '1px solid rgba(245,240,232,0.08)', paddingLeft: 16 }}>
                {revisions.map((r: any, i) => {
                  const meta = REVISION_META[r.revision_type] ?? { label: r.revision_type, color: 'rgba(245,240,232,0.4)' };
                  return (
                    <li key={r.id ?? i} className="relative pb-4">
                      {/* Timeline dot */}
                      <span
                        className="absolute w-2 h-2 rounded-full"
                        style={{ background: meta.color, left: -20, top: 4 }}
                      />
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span
                          className="font-mono-dm px-1.5 py-0.5 rounded"
                          style={{ fontSize: 10, background: `${meta.color}22`, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        <span className="font-mono-dm" style={{ fontSize: 10, color: 'rgba(245,240,232,0.25)' }}>
                          {relativeTime(r.created_at as string)}
                        </span>
                        <span className="font-mono-dm" style={{ fontSize: 10, color: 'rgba(245,240,232,0.18)' }}>
                          {r.entity_type}
                        </span>
                      </div>
                      {r.trigger_signal && (
                        <p className="font-spectral text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.5)' }}>
                          “{r.trigger_signal}”
                        </p>
                      )}
                      {r.rationale && (
                        <p className="font-spectral text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.4)', fontStyle: 'italic' }}>
                          {r.rationale}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}
      </div>

      {/* PWTC Submission */}
      <div className="rounded-xl px-6 py-5" style={{ background: 'rgba(107,159,196,0.04)', border: '1px solid rgba(107,159,196,0.15)' }}>
        <h3 className="font-cormorant font-light text-xl mb-2">Submit to PWTC</h3>
        <p className="font-spectral text-sm mb-5" style={{ color: 'rgba(245,240,232,0.45)', lineHeight: 1.7 }}>
          The Possible Worlds Trading Company receives certified scenarios as tradeable futures.
          Submission makes this session visible to the PWTC network for collective deliberation.
        </p>
        {certifiedScenarios.length === 0 ? (
          <p className="font-spectral text-sm" style={{ color: 'rgba(245,240,232,0.3)', fontStyle: 'italic' }}>
            Certify at least one scenario to enable PWTC submission.
          </p>
        ) : pwtcSubmitted ? (
          <div className="flex items-center gap-3">
            <span style={{ color: 'var(--positive)', fontSize: 20 }}>✓</span>
            <p className="font-cormorant font-light text-lg" style={{ color: 'var(--positive)' }}>
              Session submitted to the Possible Worlds Trading Company.
            </p>
          </div>
        ) : (
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block font-mono-dm mb-2" style={{ fontSize: 11, color: 'rgba(245,240,232,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Scenario to submit
              </label>
              <select
                value={pwtcScenarioId}
                onChange={(e) => setPwtcScenarioId(e.target.value)}
                className="w-full rounded-lg px-4 py-3 font-spectral"
                style={{ background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.15)', color: 'var(--parchment-text)', outline: 'none' }}
              >
                <option value="">Select a certified scenario…</option>
                {certifiedScenarios.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => pwtcScenarioId && setPwtcConfirmOpen(true)}
              disabled={!pwtcScenarioId}
              className="px-6 py-3 rounded-lg font-cormorant text-lg font-light transition-slow"
              style={{
                background: pwtcScenarioId ? 'rgba(107,159,196,0.2)' : 'rgba(107,159,196,0.07)',
                border: '1px solid rgba(107,159,196,0.4)',
                color: pwtcScenarioId ? 'var(--parchment-text)' : 'rgba(245,240,232,0.3)',
                cursor: pwtcScenarioId ? 'pointer' : 'default',
              }}
            >
              Submit to PWTC
            </button>
          </div>
        )}
      </div>

      {/* PWTC confirmation modal */}
      {pwtcConfirmOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(10,26,14,0.85)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setPwtcConfirmOpen(false); }}
        >
          <div
            className="rounded-2xl px-8 py-8 max-w-md w-full mx-4"
            style={{ background: '#0D1F11', border: '1px solid rgba(245,240,232,0.12)' }}
          >
            <h3 className="font-cormorant font-light text-2xl mb-3">Confirm PWTC submission</h3>
            <p className="font-spectral text-sm mb-2" style={{ color: 'rgba(245,240,232,0.65)', lineHeight: 1.75 }}>
              Submitting to the Possible Worlds Trading Company marks this session as public
              and makes the selected scenario available for collective deliberation.
            </p>
            <p className="font-spectral text-sm mb-6" style={{ color: 'rgba(193,126,58,0.8)', lineHeight: 1.75 }}>
              This action is logged in the revision trail and cannot be easily undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setPwtcConfirmOpen(false)}
                className="px-5 py-2 rounded font-spectral text-sm transition-slow"
                style={{ background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.15)', color: 'rgba(245,240,232,0.6)' }}
              >
                Cancel
              </button>
              <button
                onClick={handlePwtcSubmit}
                disabled={pwtcSubmitting}
                className="px-5 py-2 rounded font-spectral text-sm transition-slow"
                style={{ background: 'rgba(107,159,196,0.2)', border: '1px solid rgba(107,159,196,0.45)', color: 'var(--parchment-text)' }}
              >
                {pwtcSubmitting ? 'Submitting…' : 'Confirm submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
