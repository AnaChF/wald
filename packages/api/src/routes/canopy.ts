import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';

export const canopyRouter = Router();

// ─── helpers ──────────────────────────────────────────────────────────────────

function safeJSON<T>(v: string | null | undefined, fallback: T): T {
  if (v == null) return fallback;
  try { return JSON.parse(v) as T; } catch { return fallback; }
}

function parseSession(row: Record<string, unknown>) {
  return {
    ...row,
    audit_result_seed: safeJSON(row.audit_result_seed as string, null),
    brick_seed: safeJSON(row.brick_seed as string, null),
  };
}

function parseSignal(row: Record<string, unknown>) {
  return { ...row, linked_bolts: safeJSON(row.linked_bolts as string, []) };
}

function parseScenario(row: Record<string, unknown>) {
  return {
    ...row,
    critical_uncertainties: safeJSON(row.critical_uncertainties as string, []),
    cw_map: safeJSON(row.cw_map as string, null),
    cla_incast: safeJSON(row.cla_incast as string, null),
  };
}

function parseForecast(row: Record<string, unknown>) {
  return {
    ...row,
    milestones: safeJSON(row.milestones as string, []),
    decision_gates: safeJSON(row.decision_gates as string, []),
    earliest_decisions: safeJSON(row.earliest_decisions as string, []),
    harvest_tree_seeds: safeJSON(row.harvest_tree_seeds as string, []),
    early_indicators: safeJSON(row.early_indicators as string, []),
  };
}

// ─── MOCK AI helpers ───────────────────────────────────────────────────────────
// Replace these with real Claude Sonnet API calls when API key is available.

function mockClassifySignal(text: string, agentContext: string) {
  const lower = text.toLowerCase();
  const logic_type =
    lower.includes('because') || lower.includes('therefore') ? 'deductive'
    : lower.includes('suggests') || lower.includes('pattern') ? 'inductive'
    : 'abductive';
  const strength =
    lower.includes('definitely') || lower.includes('certainly') ? 'strong'
    : lower.includes('wildcard') || lower.includes('unlikely') ? 'wildcard'
    : 'weak';
  const domains = ['Technology', 'Environment', 'Politics', 'Economy', 'Society', 'Culture'];
  const domain = domains[text.length % domains.length];
  const cw_classification = agentContext && agentContext.length > 10 ? 'mixed' : 'W';
  return {
    logic_type,
    strength,
    domain,
    cw_classification,
    linked_bolt_ids: [],
    rationale: {
      logic_type: `Signal uses ${logic_type} reasoning based on its linguistic structure.`,
      strength: `Evidence in the signal is ${strength} in its support of the claim.`,
      domain: `The primary domain of concern is ${domain}.`,
      cw_classification: `This signal is classified as ${cw_classification}-intension given the agent context provided.`,
    },
  };
}

function mockAuditScenario(scenarioText: string, criticalUncertainties: string[]) {
  const words = scenarioText.split(' ');
  const has_contradiction = words.length > 50;
  return {
    consistency_pass: !has_contradiction,
    iia_pass: true,
    internal_contradictions: has_contradiction
      ? ['This scenario contains a tension between the dynamics and the horizon that may be worth naming.']
      : [],
    cw_map: {
      w_elements: [{ text: 'The structural conditions described are verifiable across perspectives.', confidence: 0.82 }],
      c_elements: criticalUncertainties.map((u, i) => ({
        text: u,
        centre_id: `centre-${i}`,
        confidence: 0.65,
      })),
    },
    cla_incast: {
      litany: 'Visible symptoms reported in the scenario suggest surface-level disruption.',
      systemic: 'Structural drivers produce these symptoms through resource allocation mechanisms.',
      worldview: 'The scenario presupposes that growth remains the primary measure of progress.',
      metaphor: 'The deep story sustaining this scenario is one of a frontier to be conquered.',
      dominant_centre: null,
    },
    arrow_failure_flag: false,
  };
}

function mockBackcast(timeHorizonYears: number) {
  const now = new Date().getFullYear();
  const milestones = [];
  const gates = [];
  const steps = Math.min(timeHorizonYears, 8);
  for (let i = 1; i <= steps; i++) {
    const id = uuidv4();
    const yearOffset = Math.round((i / steps) * timeHorizonYears);
    milestones.push({
      id,
      year_offset: yearOffset,
      description: `Milestone ${i}: Structural conditions for the preferred horizon begin to consolidate.`,
      type: i % 3 === 0 ? 'decision' : i % 3 === 1 ? 'event' : 'condition',
      is_gate: i % 3 === 0,
      harvest_tree_layer: ['roots', 'trunk', 'branches', 'leaves', 'fruits'][i % 5] as string,
    });
    if (i % 3 === 0) {
      gates.push({
        milestone_id: id,
        if_yes_path: 'Continue toward the preferred horizon with current momentum.',
        if_no_path: 'Pause and reassess foundational assumptions before proceeding.',
        decision_window_months: 6,
      });
    }
  }
  return {
    milestones,
    decision_gates: gates,
    earliest_decisions: milestones.filter((m) => m.type === 'decision').slice(0, 2).map((m) => m.id),
    harvest_tree_seeds: milestones.map((m) => ({
      layer: m.harvest_tree_layer,
      text: `From milestone at year +${m.year_offset}: ${m.description}`,
      linked_milestone_id: m.id,
    })),
  };
}

// ─── AI ENGINE ENDPOINTS ───────────────────────────────────────────────────────

// POST /api/canopy/signals/classify
canopyRouter.post('/canopy/signals/classify', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { signal_text, agent_context, session_id } = req.body as {
    signal_text: string;
    agent_context: string;
    session_id: string;
  };
  if (!signal_text) {
    res.status(400).json({ error: 'signal_text is required' });
    return;
  }
  try {
    const result = mockClassifySignal(signal_text, agent_context ?? '');
    res.json({ data: result });
  } catch (err) {
    console.error('canopy/signals/classify error:', err);
    res.status(500).json({ error: 'Classification failed' });
  }
});

// POST /api/canopy/scenarios/audit
canopyRouter.post('/canopy/scenarios/audit', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { scenario_text, critical_uncertainties, agent_context } = req.body as {
    scenario_text: string;
    critical_uncertainties: string[];
    agent_context: string;
  };
  if (!scenario_text) {
    res.status(400).json({ error: 'scenario_text is required' });
    return;
  }
  try {
    const result = mockAuditScenario(scenario_text, critical_uncertainties ?? []);
    res.json({ data: result });
  } catch (err) {
    console.error('canopy/scenarios/audit error:', err);
    res.status(500).json({ error: 'Audit failed' });
  }
});

// POST /api/canopy/backcast
canopyRouter.post('/canopy/backcast', authenticate, (req: AuthRequest, res: Response): void => {
  const { preferred_horizon_id, time_horizon_years } = req.body as {
    preferred_horizon_id: string;
    current_beliefs: unknown;
    time_horizon_years: number;
  };
  if (!preferred_horizon_id || !time_horizon_years) {
    res.status(400).json({ error: 'preferred_horizon_id and time_horizon_years are required' });
    return;
  }
  try {
    const result = mockBackcast(time_horizon_years);
    res.json({ data: result });
  } catch (err) {
    console.error('canopy/backcast error:', err);
    res.status(500).json({ error: 'Backcasting failed' });
  }
});

// ─── SESSION ROUTES ────────────────────────────────────────────────────────────

// POST /api/canopy/session/create
canopyRouter.post('/canopy/session/create', authenticate, (req: AuthRequest, res: Response): void => {
  const { title, foresight_question, time_horizon_years, audit_result_seed, brick_seed, centre_description } =
    req.body as Record<string, unknown>;
  const id = uuidv4();
  const userId = req.userId!;
  const shareToken = uuidv4();
  db.prepare(`
    INSERT INTO canopy_sessions
      (id, user_id, title, foresight_question, audit_result_seed, brick_seed, centre_description, share_token)
    VALUES
      (@id, @user_id, @title, @foresight_question, @audit_result_seed, @brick_seed, @centre_description, @share_token)
  `).run({
    id,
    user_id: userId,
    title: title ?? null,
    foresight_question: foresight_question ?? null,
    audit_result_seed: audit_result_seed ? JSON.stringify(audit_result_seed) : null,
    brick_seed: brick_seed ? JSON.stringify(brick_seed) : null,
    centre_description: centre_description ?? null,
    share_token: shareToken,
  });
  const row = db.prepare('SELECT * FROM canopy_sessions WHERE id = @id').get({ id }) as Record<string, unknown>;
  res.status(201).json({ data: parseSession(row) });
});

// GET /api/canopy/session/:id
canopyRouter.get('/canopy/session/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const shareToken = req.query.share_token as string | undefined;
  const row = db.prepare('SELECT * FROM canopy_sessions WHERE id = @id').get({ id }) as
    | Record<string, unknown>
    | undefined;
  if (!row) { res.status(404).json({ error: 'Session not found' }); return; }
  if (
    row.visibility !== 'shared' &&
    row.user_id !== req.userId &&
    !(shareToken && shareToken === row.share_token)
  ) {
    res.status(403).json({ error: 'Access denied' }); return;
  }
  res.json({ data: parseSession(row) });
});

// PUT /api/canopy/session/:id
canopyRouter.put('/canopy/session/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const row = db.prepare('SELECT * FROM canopy_sessions WHERE id = @id AND user_id = @user_id').get({
    id, user_id: req.userId,
  }) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'Session not found' }); return; }
  const fields = ['title', 'foresight_question', 'centre_description', 'status', 'visibility'];
  const updates: Record<string, unknown> = { id, updated_at: new Date().toISOString() };
  const setClauses: string[] = ['updated_at = @updated_at'];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates[f] = req.body[f];
      setClauses.push(`${f} = @${f}`);
    }
  }
  db.prepare(`UPDATE canopy_sessions SET ${setClauses.join(', ')} WHERE id = @id`).run(updates);
  const updated = db.prepare('SELECT * FROM canopy_sessions WHERE id = @id').get({ id }) as Record<string, unknown>;
  res.json({ data: parseSession(updated) });
});

// GET /api/canopy/user/:id/sessions
canopyRouter.get('/canopy/user/:id/sessions', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  if (id !== req.userId) { res.status(403).json({ error: 'Access denied' }); return; }
  const rows = db.prepare('SELECT * FROM canopy_sessions WHERE user_id = @id ORDER BY created_at DESC').all({ id }) as
    Record<string, unknown>[];
  res.json({ data: rows.map(parseSession) });
});

// POST /api/canopy/session/:id/share
canopyRouter.post('/canopy/session/:id/share', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const row = db.prepare('SELECT * FROM canopy_sessions WHERE id = @id AND user_id = @user_id').get({
    id, user_id: req.userId,
  }) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'Session not found' }); return; }
  db.prepare(`UPDATE canopy_sessions SET visibility = 'shared', updated_at = @now WHERE id = @id`).run({
    id, now: new Date().toISOString(),
  });
  const updated = db.prepare('SELECT * FROM canopy_sessions WHERE id = @id').get({ id }) as Record<string, unknown>;
  res.json({ data: { share_token: updated.share_token, share_url: `/canopy/session/${id}?share_token=${updated.share_token}` } });
});

// ─── SIGNAL ROUTES ─────────────────────────────────────────────────────────────

// POST /api/canopy/session/:id/signals
canopyRouter.post('/canopy/session/:id/signals', authenticate, (req: AuthRequest, res: Response): void => {
  const { id: sessionId } = req.params;
  const { text, source, canvas_x, canvas_y } = req.body as Record<string, unknown>;
  if (!text) { res.status(400).json({ error: 'text is required' }); return; }
  const signalId = uuidv4();
  db.prepare(`
    INSERT INTO canopy_signals (id, session_id, user_id, text, source, canvas_x, canvas_y)
    VALUES (@id, @session_id, @user_id, @text, @source, @canvas_x, @canvas_y)
  `).run({
    id: signalId,
    session_id: sessionId,
    user_id: req.userId,
    text,
    source: source ?? null,
    canvas_x: canvas_x ?? Math.random() * 800,
    canvas_y: canvas_y ?? Math.random() * 500,
  });
  const row = db.prepare('SELECT * FROM canopy_signals WHERE id = @id').get({ id: signalId }) as Record<string, unknown>;
  res.status(201).json({ data: parseSignal(row) });
});

// PUT /api/canopy/signal/:id/classify
canopyRouter.put('/canopy/signal/:id/classify', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { logic_type, strength, domain, cw_class, classifier_rationale, linked_bolts, futures_cone_layer, canvas_x, canvas_y } =
    req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = { id };
  const setClauses: string[] = [];
  const fields = { logic_type, strength, domain, cw_class, classifier_rationale, futures_cone_layer, canvas_x, canvas_y };
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) { updates[k] = v; setClauses.push(`${k} = @${k}`); }
  }
  if (linked_bolts !== undefined) {
    updates.linked_bolts = JSON.stringify(linked_bolts);
    setClauses.push('linked_bolts = @linked_bolts');
  }
  if (setClauses.length) {
    db.prepare(`UPDATE canopy_signals SET ${setClauses.join(', ')} WHERE id = @id`).run(updates);
  }
  const row = db.prepare('SELECT * FROM canopy_signals WHERE id = @id').get({ id }) as Record<string, unknown>;
  res.json({ data: parseSignal(row) });
});

// GET signals for session
canopyRouter.get('/canopy/session/:id/signals', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const rows = db.prepare('SELECT * FROM canopy_signals WHERE session_id = @id ORDER BY created_at ASC').all({ id }) as
    Record<string, unknown>[];
  res.json({ data: rows.map(parseSignal) });
});

// ─── TRIANGLE / CLA ────────────────────────────────────────────────────────────

// POST /api/canopy/session/:id/triangle
canopyRouter.post('/canopy/session/:id/triangle', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { push, weight, pull, tensions } = req.body as Record<string, unknown>;
  db.prepare(`UPDATE canopy_sessions SET audit_result_seed = @seed, updated_at = @now WHERE id = @id`).run({
    id,
    seed: JSON.stringify({ futures_triangle: { push, weight, pull, tensions } }),
    now: new Date().toISOString(),
  });
  res.json({ data: { session_id: id, futures_triangle: { push, weight, pull, tensions } } });
});

// POST /api/canopy/session/:id/cla
canopyRouter.post('/canopy/session/:id/cla', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { litany, systemic, worldview, metaphor, centre_attributions } = req.body as Record<string, unknown>;
  db.prepare(`UPDATE canopy_sessions SET brick_seed = @cla, updated_at = @now WHERE id = @id`).run({
    id,
    cla: JSON.stringify({ litany, systemic, worldview, metaphor, centre_attributions }),
    now: new Date().toISOString(),
  });
  res.json({ data: { session_id: id, cla: { litany, systemic, worldview, metaphor, centre_attributions } } });
});

// ─── SCENARIO ROUTES ───────────────────────────────────────────────────────────

// POST /api/canopy/session/:id/scenario
canopyRouter.post('/canopy/session/:id/scenario', authenticate, (req: AuthRequest, res: Response): void => {
  const { id: sessionId } = req.params;
  const { title, narrative, critical_uncertainties, horizon_id } = req.body as Record<string, unknown>;
  if (!title) { res.status(400).json({ error: 'title is required' }); return; }
  const scenarioId = uuidv4();
  db.prepare(`
    INSERT INTO canopy_scenarios (id, session_id, horizon_id, title, narrative, critical_uncertainties)
    VALUES (@id, @session_id, @horizon_id, @title, @narrative, @critical_uncertainties)
  `).run({
    id: scenarioId,
    session_id: sessionId,
    horizon_id: horizon_id ?? null,
    title,
    narrative: narrative ?? null,
    critical_uncertainties: JSON.stringify(critical_uncertainties ?? []),
  });
  const row = db.prepare('SELECT * FROM canopy_scenarios WHERE id = @id').get({ id: scenarioId }) as Record<string, unknown>;
  res.status(201).json({ data: parseScenario(row) });
});

// POST /api/canopy/scenario/:id/audit
canopyRouter.post('/canopy/scenario/:id/audit', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const row = db.prepare('SELECT * FROM canopy_scenarios WHERE id = @id').get({ id }) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'Scenario not found' }); return; }
  const narrative = row.narrative as string ?? '';
  const cu = safeJSON<string[]>(row.critical_uncertainties as string, []);
  const result = mockAuditScenario(narrative, cu);
  db.prepare(`
    UPDATE canopy_scenarios SET
      consistency_certified = @cc, iia_pass = @iia, arrow_failure_flag = @aff, cw_map = @cw, cla_incast = @cla
    WHERE id = @id
  `).run({
    id,
    cc: result.consistency_pass ? 1 : 0,
    iia: result.iia_pass ? 1 : 0,
    aff: result.arrow_failure_flag ? 1 : 0,
    cw: JSON.stringify(result.cw_map),
    cla: JSON.stringify(result.cla_incast),
  });
  const updated = db.prepare('SELECT * FROM canopy_scenarios WHERE id = @id').get({ id }) as Record<string, unknown>;
  res.json({ data: { scenario: parseScenario(updated), audit: result } });
});

// GET /api/canopy/scenario/:id/certification
canopyRouter.get('/canopy/scenario/:id/certification', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const row = db.prepare('SELECT * FROM canopy_scenarios WHERE id = @id').get({ id }) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'Scenario not found' }); return; }
  res.json({
    data: {
      scenario_id: id,
      consistency_certified: !!row.consistency_certified,
      iia_pass: !!row.iia_pass,
      arrow_failure_flag: !!row.arrow_failure_flag,
      cla_incast: safeJSON(row.cla_incast as string, null),
      relaxed_arrow_condition: row.relaxed_arrow_condition ?? null,
      certified: !!row.consistency_certified && !!row.iia_pass,
    },
  });
});

// GET scenarios for session
canopyRouter.get('/canopy/session/:id/scenarios', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const rows = db.prepare('SELECT * FROM canopy_scenarios WHERE session_id = @id ORDER BY created_at ASC').all({ id }) as
    Record<string, unknown>[];
  res.json({ data: rows.map(parseScenario) });
});

// ─── COLLECTIVE HORIZONS ───────────────────────────────────────────────────────

// POST /api/canopy/session/:id/collective  (Phase 2 stub)
canopyRouter.post('/canopy/session/:id/collective', authenticate, (req: AuthRequest, res: Response): void => {
  res.status(202).json({ message: 'Collective Horizons is Phase 2. Architecture ready.' });
});

// POST /api/canopy/collective/:id/ranking
canopyRouter.post('/canopy/collective/:id/ranking', authenticate, (req: AuthRequest, res: Response): void => {
  res.status(202).json({ message: 'Collective ranking endpoint — Phase 2.' });
});

// GET /api/canopy/collective/:id/arrow
canopyRouter.get('/canopy/collective/:id/arrow', authenticate, (req: AuthRequest, res: Response): void => {
  res.status(202).json({ message: 'Arrow diagnostic endpoint — Phase 2.' });
});

// POST /api/canopy/collective/:id/relax
canopyRouter.post('/canopy/collective/:id/relax', authenticate, (req: AuthRequest, res: Response): void => {
  const { relaxation_type, rationale } = req.body as { relaxation_type: string; rationale: string };
  if (!relaxation_type || !rationale) {
    res.status(400).json({ error: 'relaxation_type and rationale are required' }); return;
  }
  res.json({ data: { relaxation_type, rationale, recorded_at: new Date().toISOString() } });
});

// ─── FORECAST / INDICATORS ─────────────────────────────────────────────────────

// POST /api/canopy/session/:id/backcast
canopyRouter.post('/canopy/session/:id/backcast', authenticate, (req: AuthRequest, res: Response): void => {
  const { id: sessionId } = req.params;
  const { preferred_horizon_id, time_horizon_years, current_beliefs } = req.body as Record<string, unknown>;
  if (!preferred_horizon_id || !time_horizon_years) {
    res.status(400).json({ error: 'preferred_horizon_id and time_horizon_years are required' }); return;
  }
  const backcast = mockBackcast(time_horizon_years as number);
  const forecastId = uuidv4();
  db.prepare(`
    INSERT INTO canopy_forecasts
      (id, session_id, preferred_horizon_id, time_horizon_years, milestones, decision_gates, earliest_decisions, harvest_tree_seeds)
    VALUES
      (@id, @session_id, @preferred_horizon_id, @time_horizon_years, @milestones, @decision_gates, @earliest_decisions, @harvest_tree_seeds)
  `).run({
    id: forecastId,
    session_id: sessionId,
    preferred_horizon_id,
    time_horizon_years,
    milestones: JSON.stringify(backcast.milestones),
    decision_gates: JSON.stringify(backcast.decision_gates),
    earliest_decisions: JSON.stringify(backcast.earliest_decisions),
    harvest_tree_seeds: JSON.stringify(backcast.harvest_tree_seeds),
  });
  const row = db.prepare('SELECT * FROM canopy_forecasts WHERE id = @id').get({ id: forecastId }) as Record<string, unknown>;
  res.status(201).json({ data: parseForecast(row) });
});

// GET /api/canopy/session/:id/indicators
canopyRouter.get('/canopy/session/:id/indicators', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const scenarios = db.prepare('SELECT * FROM canopy_scenarios WHERE session_id = @id').all({ id }) as
    Record<string, unknown>[];
  const indicators = scenarios.map((s) => ({
    scenario_id: s.id,
    scenario_title: s.title,
    indicators: [
      { label: 'Early signal of preferred horizon emerging', status: 'quiet' },
      { label: 'Structural conditions beginning to shift', status: 'quiet' },
      { label: 'Counter-signals detected', status: 'quiet' },
    ],
  }));
  res.json({ data: indicators });
});

// POST /api/canopy/session/:id/drift
canopyRouter.post('/canopy/session/:id/drift', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { new_signals, drift_description, drift_logic, revision_type, monitor_focus } =
    req.body as Record<string, unknown>;
  if (!drift_logic || !revision_type) {
    res.status(400).json({ error: 'drift_logic and revision_type are required' }); return;
  }
  res.status(201).json({
    data: {
      session_id: id,
      logged_at: new Date().toISOString(),
      new_signals,
      drift_description,
      drift_logic,
      revision_type,
      monitor_focus,
    },
  });
});

// GET /api/canopy/session/:id/revisions
canopyRouter.get('/canopy/session/:id/revisions', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  res.json({ data: [] });
});

// POST /api/canopy/session/:id/pwtc
canopyRouter.post('/canopy/session/:id/pwtc', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { scenario_id } = req.body as { scenario_id: string };
  if (!scenario_id) { res.status(400).json({ error: 'scenario_id is required' }); return; }
  db.prepare(`UPDATE canopy_sessions SET visibility = 'submitted', updated_at = @now WHERE id = @id`).run({
    id, now: new Date().toISOString(),
  });
  res.json({ data: { submitted: true, session_id: id, scenario_id } });
});

// POST /api/canopy/session/:id/harvest
canopyRouter.post('/canopy/session/:id/harvest', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const forecast = db.prepare(
    'SELECT * FROM canopy_forecasts WHERE session_id = @id ORDER BY created_at DESC LIMIT 1'
  ).get({ id }) as Record<string, unknown> | undefined;
  if (!forecast) { res.status(404).json({ error: 'No forecast found for this session' }); return; }
  const seeds = safeJSON<unknown[]>(forecast.harvest_tree_seeds as string, []);
  res.json({ data: { harvest_tree_seeds: seeds, export_ready: true } });
});

// GET /api/canopy/session/:id/report
canopyRouter.get('/canopy/session/:id/report', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const session = db.prepare('SELECT * FROM canopy_sessions WHERE id = @id').get({ id }) as
    Record<string, unknown> | undefined;
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  const signals = db.prepare('SELECT * FROM canopy_signals WHERE session_id = @id').all({ id }) as Record<string, unknown>[];
  const scenarios = db.prepare('SELECT * FROM canopy_scenarios WHERE session_id = @id').all({ id }) as Record<string, unknown>[];
  const forecast = db.prepare(
    'SELECT * FROM canopy_forecasts WHERE session_id = @id ORDER BY created_at DESC LIMIT 1'
  ).get({ id }) as Record<string, unknown> | undefined;
  res.json({
    data: {
      session: parseSession(session),
      signals: signals.map(parseSignal),
      scenarios: scenarios.map(parseScenario),
      forecast: forecast ? parseForecast(forecast) : null,
    },
  });
});
