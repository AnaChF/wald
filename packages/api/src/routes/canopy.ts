import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import db from '../db/index';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';

export const canopyRouter = Router();

// ─── Claude client ─────────────────────────────────────────────────────────────

const claude = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const CLAUDE_MODEL = 'claude-sonnet-4-6';

async function callClaude(prompt: string): Promise<string> {
  if (!claude) throw new Error('ANTHROPIC_API_KEY not set');
  const msg = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = msg.content[0];
  return block.type === 'text' ? block.text : '';
}

function extractJSON(raw: string): unknown {
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(stripped);
}

// ─── helpers ─────────────────────────────────────────────────────────────────

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

function parseRevision(row: Record<string, unknown>) {
  return {
    ...row,
    snapshot: safeJSON(row.snapshot as string, null),
  };
}

// ─── REVISION LOGGING ────────────────────────────────────────────────────────

function logRevision(params: {
  session_id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  revision_type: string;
  trigger_signal?: string;
  rationale?: string;
  snapshot?: unknown;
}) {
  try {
    db.prepare(`
      INSERT INTO canopy_revisions
        (id, session_id, user_id, entity_type, entity_id, revision_type, trigger_signal, rationale, snapshot)
      VALUES
        (@id, @session_id, @user_id, @entity_type, @entity_id, @revision_type, @trigger_signal, @rationale, @snapshot)
    `).run({
      id: uuidv4(),
      session_id: params.session_id,
      user_id: params.user_id,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      revision_type: params.revision_type,
      trigger_signal: params.trigger_signal ?? null,
      rationale: params.rationale ?? null,
      snapshot: params.snapshot ? JSON.stringify(params.snapshot) : null,
    });
  } catch (err) {
    console.warn('logRevision failed (non-fatal):', err);
  }
}

// ─── FALLBACK MOCKS (used when API key absent or Claude call fails) ──────────────────

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
    logic_type, strength, domain, cw_classification,
    linked_bolt_ids: [],
    rationale: {
      logic_type: `Signal uses ${logic_type} reasoning based on its linguistic structure.`,
      strength: `Evidence in the signal is ${strength} in its support of the claim.`,
      domain: `The primary domain of concern is ${domain}.`,
      cw_classification: `Classified as ${cw_classification}-intension given the agent context provided.`,
    },
  };
}

function mockAuditScenario(scenarioText: string, criticalUncertainties: string[]) {
  const has_contradiction = scenarioText.split(' ').length > 50;
  return {
    consistency_pass: !has_contradiction,
    iia_pass: true,
    internal_contradictions: has_contradiction
      ? ['This scenario contains a tension between the dynamics and the horizon that may be worth naming.']
      : [],
    cw_map: {
      w_elements: [{ text: 'The structural conditions described are verifiable across perspectives.', confidence: 0.82 }],
      c_elements: criticalUncertainties.map((u, i) => ({ text: u, centre_id: `centre-${i}`, confidence: 0.65 })),
    },
    cla_incast: {
      litany: 'Visible symptoms suggest surface-level disruption.',
      systemic: 'Structural drivers produce these symptoms through resource allocation.',
      worldview: 'The scenario presupposes growth as the primary measure of progress.',
      metaphor: 'The deep story sustaining this scenario is one of a frontier to be conquered.',
      dominant_centre: null,
    },
    arrow_failure_flag: false,
  };
}

function mockBackcast(timeHorizonYears: number) {
  const steps = Math.min(timeHorizonYears, 8);
  const milestones: Record<string, unknown>[] = [];
  const gates: Record<string, unknown>[] = [];
  const idMap: Record<string, string> = {};

  for (let i = 1; i <= steps; i++) {
    const localId = `m${i}`;
    const uuid = uuidv4();
    idMap[localId] = uuid;
    const yearOffset = Math.round((i / steps) * timeHorizonYears);
    const isGate = i % 3 === 0;
    milestones.push({
      id: uuid, year_offset: yearOffset,
      description: `Milestone ${i}: Conditions for the preferred horizon begin to consolidate.`,
      type: isGate ? 'decision' : i % 2 === 0 ? 'event' : 'condition',
      is_gate: isGate,
      harvest_tree_layer: ['roots', 'trunk', 'branches', 'leaves', 'fruits'][i % 5],
    });
    if (isGate) {
      gates.push({
        milestone_id: uuid,
        if_yes_path: 'Continue toward the preferred horizon with current momentum.',
        if_no_path: 'Pause and reassess foundational assumptions before proceeding.',
        decision_window_months: 6,
      });
    }
  }
  const earliest = milestones.filter((m) => m.type === 'decision').slice(0, 2).map((m) => m.id);
  const seeds = milestones.map((m) => ({
    layer: m.harvest_tree_layer,
    text: `From +${m.year_offset}y: ${m.description}`,
    linked_milestone_id: m.id,
  }));
  return { milestones, decision_gates: gates, earliest_decisions: earliest, harvest_tree_seeds: seeds };
}

// ─── REAL AI FUNCTIONS ───────────────────────────────────────────────────────────

async function classifySignalWithClaude(text: string, agentContext: string) {
  const prompt = `You are a signal classification engine for a strategic foresight application.

Classify the following observed signal across four dimensions. Return ONLY valid JSON, no prose, no markdown fences.

Signal: "${text.replace(/"/g, "'")}"
Agent context: "${agentContext.replace(/"/g, "'")}"

Dimensions:

LOGIC TYPE (choose one):
- "deductive": the signal follows necessarily from known premises or established trends
- "inductive": the signal generalises from a pattern of repeated observations
- "abductive": the signal is the best available explanation for an anomaly or surprising observation

STRENGTH (choose one):
- "strong": well-evidenced, multiple corroborating sources
- "weak": suggestive but uncertain, limited evidence
- "wildcard": low probability but high potential impact if true

DOMAIN: choose the most relevant single word from — Technology, Environment, Politics, Economy, Society, Culture, Governance, Demographics, Science, Energy

CW CLASSIFICATION (choose one):
- "W": what the signal implies holds regardless of who is observing or from when; a verifiable claim
- "C": what the signal means is specific to the current agent's position, time, and context
- "mixed": contains both W-intension and C-intension components

Provide a one-sentence rationale for each classification decision.

Return exactly this JSON:
{
  "logic_type": "deductive" | "inductive" | "abductive",
  "strength": "strong" | "weak" | "wildcard",
  "domain": string,
  "cw_classification": "W" | "C" | "mixed",
  "linked_bolt_ids": [],
  "rationale": {
    "logic_type": string,
    "strength": string,
    "domain": string,
    "cw_classification": string
  }
}`;

  const raw = await callClaude(prompt);
  return extractJSON(raw) as ReturnType<typeof mockClassifySignal>;
}

async function auditScenarioWithClaude(
  scenarioText: string,
  criticalUncertainties: string[],
  agentContext: string,
) {
  const cuList = criticalUncertainties.length > 0
    ? criticalUncertainties.join('; ')
    : 'none specified';

  const prompt = `You are auditing a scenario for a strategic foresight session. Your role is to identify tensions worth naming, not to judge correctness.

Scenario:
${scenarioText}

Critical uncertainties this scenario is built on: ${cuList}
Agent context: ${agentContext || 'not specified'}

Perform these checks:

1. DEDUCTIVE CONTRADICTIONS: pairs of claims that together imply the negation of a third claim also present. List each as a single sentence beginning "This scenario contains a tension between..."
2. IIA VIOLATIONS: language where evaluating one scenario element presupposes another independent scenario element.
3. C/W CONFLATION: claims stated as universal facts that are actually perspective-dependent.
4. CW MAPPING: identify W-intension elements (verifiable by any observer) and C-intension elements (perspective-dependent).
5. CLA INCASTING: what this scenario presupposes at each CLA level.
6. ARROW FAILURE FLAG: true only if the scenario's logical structure fails to preserve preference ordering in a way that matters for collective decision-making.

consistency_pass is true if there are no deductive contradictions.
iia_pass is true if there are no IIA violations.

Return ONLY this exact JSON:
{
  "consistency_pass": boolean,
  "iia_pass": boolean,
  "internal_contradictions": [string],
  "cw_map": {
    "w_elements": [{"text": string, "confidence": number}],
    "c_elements": [{"text": string, "centre_id": "unspecified", "confidence": number}]
  },
  "cla_incast": {
    "litany": string,
    "systemic": string,
    "worldview": string,
    "metaphor": string,
    "dominant_centre": null
  },
  "arrow_failure_flag": boolean
}`;

  const raw = await callClaude(prompt);
  return extractJSON(raw) as ReturnType<typeof mockAuditScenario>;
}

async function backcastWithClaude(preferredHorizonId: string, timeHorizonYears: number) {
  const prompt = `You are generating a backcasting forecast for a strategic foresight session.

The user has identified a preferred future horizon. Working backward from that horizon over ${timeHorizonYears} years, generate a sequence of milestones, decision gates, and Harvest Tree seeds.

Preferred horizon reference: ${preferredHorizonId}
Time horizon: ${timeHorizonYears} years from now

Generate 6 to 10 milestones. Each milestone is a waypoint between now and the preferred future — conditions that must obtain, events that must occur, or decisions that must be made. Order them from nearest to furthest (ascending year_offset).

For milestones with is_gate: true, generate a corresponding decision gate entry.

Harvest Tree seeds should cover all five layers: roots (foundational values/constraints), trunk (core beliefs/commitments), branches (strategies/capabilities), leaves (actions/practices), fruits (outcomes/impacts).

Use sequential IDs "m1", "m2" etc. The server will replace them with UUIDs.

Return ONLY this exact JSON:
{
  "milestones": [
    {
      "id": "m1",
      "year_offset": integer,
      "description": string,
      "type": "decision" | "event" | "condition",
      "is_gate": boolean,
      "harvest_tree_layer": "roots" | "trunk" | "branches" | "leaves" | "fruits" | null
    }
  ],
  "decision_gates": [
    {
      "milestone_id": "m1",
      "if_yes_path": string,
      "if_no_path": string,
      "decision_window_months": integer
    }
  ],
  "earliest_decisions": ["m1"],
  "harvest_tree_seeds": [
    {"layer": string, "text": string, "linked_milestone_id": "m1"}
  ]
}`;

  const raw = await callClaude(prompt);
  const parsed = extractJSON(raw) as {
    milestones: Array<{ id: string; year_offset: number; description: string; type: string; is_gate: boolean; harvest_tree_layer: string | null }>;
    decision_gates: Array<{ milestone_id: string; if_yes_path: string; if_no_path: string; decision_window_months: number }>;
    earliest_decisions: string[];
    harvest_tree_seeds: Array<{ layer: string; text: string; linked_milestone_id: string }>;
  };

  const idMap: Record<string, string> = {};
  for (const m of parsed.milestones) {
    idMap[m.id] = uuidv4();
    m.id = idMap[m.id];
  }
  for (const g of parsed.decision_gates) {
    g.milestone_id = idMap[g.milestone_id] ?? g.milestone_id;
  }
  parsed.earliest_decisions = parsed.earliest_decisions.map((id) => idMap[id] ?? id);
  for (const s of parsed.harvest_tree_seeds) {
    s.linked_milestone_id = idMap[s.linked_milestone_id] ?? s.linked_milestone_id;
  }
  return parsed;
}

// ─── AI ENGINE ENDPOINTS ───────────────────────────────────────────────────────

// POST /api/canopy/signals/classify
canopyRouter.post('/canopy/signals/classify', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { signal_text, agent_context, session_id } = req.body as {
    signal_text: string; agent_context: string; session_id: string;
  };
  if (!signal_text) { res.status(400).json({ error: 'signal_text is required' }); return; }
  try {
    let result;
    if (claude) {
      try {
        result = await classifySignalWithClaude(signal_text, agent_context ?? '');
      } catch (aiErr) {
        console.warn('Claude classify failed, using mock:', aiErr);
        result = mockClassifySignal(signal_text, agent_context ?? '');
      }
    } else {
      result = mockClassifySignal(signal_text, agent_context ?? '');
    }
    res.json({ data: result });
  } catch (err) {
    console.error('canopy/signals/classify error:', err);
    res.status(500).json({ error: 'Classification failed' });
  }
});

// POST /api/canopy/scenarios/audit
canopyRouter.post('/canopy/scenarios/audit', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { scenario_text, critical_uncertainties, agent_context } = req.body as {
    scenario_text: string; critical_uncertainties: string[]; agent_context: string;
  };
  if (!scenario_text) { res.status(400).json({ error: 'scenario_text is required' }); return; }
  try {
    let result;
    if (claude) {
      try {
        result = await auditScenarioWithClaude(scenario_text, critical_uncertainties ?? [], agent_context ?? '');
      } catch (aiErr) {
        console.warn('Claude audit failed, using mock:', aiErr);
        result = mockAuditScenario(scenario_text, critical_uncertainties ?? []);
      }
    } else {
      result = mockAuditScenario(scenario_text, critical_uncertainties ?? []);
    }
    res.json({ data: result });
  } catch (err) {
    console.error('canopy/scenarios/audit error:', err);
    res.status(500).json({ error: 'Audit failed' });
  }
});

// POST /api/canopy/backcast
canopyRouter.post('/canopy/backcast', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { preferred_horizon_id, time_horizon_years } = req.body as {
    preferred_horizon_id: string; current_beliefs: unknown; time_horizon_years: number;
  };
  if (!preferred_horizon_id || !time_horizon_years) {
    res.status(400).json({ error: 'preferred_horizon_id and time_horizon_years are required' }); return;
  }
  try {
    let result;
    if (claude) {
      try {
        result = await backcastWithClaude(preferred_horizon_id, time_horizon_years);
      } catch (aiErr) {
        console.warn('Claude backcast failed, using mock:', aiErr);
        result = mockBackcast(time_horizon_years);
      }
    } else {
      result = mockBackcast(time_horizon_years);
    }
    res.json({ data: result });
  } catch (err) {
    console.error('canopy/backcast error:', err);
    res.status(500).json({ error: 'Backcasting failed' });
  }
});

// ─── SESSION ROUTES ───────────────────────────────────────────────────────────

canopyRouter.post('/canopy/session/create', authenticate, (req: AuthRequest, res: Response): void => {
  const { title, foresight_question, audit_result_seed, brick_seed, centre_description } =
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
    id, user_id: userId,
    title: title ?? null,
    foresight_question: foresight_question ?? null,
    audit_result_seed: audit_result_seed ? JSON.stringify(audit_result_seed) : null,
    brick_seed: brick_seed ? JSON.stringify(brick_seed) : null,
    centre_description: centre_description ?? null,
    share_token: shareToken,
  });
  const row = db.prepare('SELECT * FROM canopy_sessions WHERE id = @id').get({ id }) as Record<string, unknown>;
  logRevision({ session_id: id, user_id: userId, entity_type: 'session', entity_id: id, revision_type: 'session_created' });
  res.status(201).json({ data: parseSession(row) });
});

canopyRouter.get('/canopy/session/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const shareToken = req.query.share_token as string | undefined;
  const row = db.prepare('SELECT * FROM canopy_sessions WHERE id = @id').get({ id }) as
    | Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'Session not found' }); return; }
  if (
    row.visibility !== 'shared' &&
    row.user_id !== req.userId &&
    !(shareToken && shareToken === row.share_token)
  ) { res.status(403).json({ error: 'Access denied' }); return; }
  res.json({ data: parseSession(row) });
});

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
    if (req.body[f] !== undefined) { updates[f] = req.body[f]; setClauses.push(`${f} = @${f}`); }
  }
  db.prepare(`UPDATE canopy_sessions SET ${setClauses.join(', ')} WHERE id = @id`).run(updates);
  const updated = db.prepare('SELECT * FROM canopy_sessions WHERE id = @id').get({ id }) as Record<string, unknown>;
  logRevision({
    session_id: id, user_id: req.userId!, entity_type: 'session', entity_id: id,
    revision_type: 'framing_edit',
    snapshot: { changed_fields: Object.keys(req.body).filter((k) => fields.includes(k)) },
  });
  res.json({ data: parseSession(updated) });
});

canopyRouter.get('/canopy/user/:id/sessions', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  if (id !== req.userId) { res.status(403).json({ error: 'Access denied' }); return; }
  const rows = db.prepare('SELECT * FROM canopy_sessions WHERE user_id = @id ORDER BY created_at DESC').all({ id }) as
    Record<string, unknown>[];
  res.json({ data: rows.map(parseSession) });
});

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

// ─── SIGNAL ROUTES ────────────────────────────────────────────────────────────

canopyRouter.post('/canopy/session/:id/signals', authenticate, (req: AuthRequest, res: Response): void => {
  const { id: sessionId } = req.params;
  const { text, source, canvas_x, canvas_y } = req.body as Record<string, unknown>;
  if (!text) { res.status(400).json({ error: 'text is required' }); return; }
  const signalId = uuidv4();
  db.prepare(`
    INSERT INTO canopy_signals (id, session_id, user_id, text, source, canvas_x, canvas_y)
    VALUES (@id, @session_id, @user_id, @text, @source, @canvas_x, @canvas_y)
  `).run({
    id: signalId, session_id: sessionId, user_id: req.userId,
    text, source: source ?? null,
    canvas_x: canvas_x ?? Math.random() * 800,
    canvas_y: canvas_y ?? Math.random() * 500,
  });
  const row = db.prepare('SELECT * FROM canopy_signals WHERE id = @id').get({ id: signalId }) as Record<string, unknown>;
  logRevision({
    session_id: sessionId, user_id: req.userId!, entity_type: 'signal', entity_id: signalId,
    revision_type: 'signal_added', trigger_signal: text as string,
  });
  res.status(201).json({ data: parseSignal(row) });
});

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
  logRevision({
    session_id: row.session_id as string, user_id: req.userId!, entity_type: 'signal', entity_id: id,
    revision_type: 'signal_classified',
    snapshot: { logic_type, strength, domain, cw_class },
  });
  res.json({ data: parseSignal(row) });
});

canopyRouter.get('/canopy/session/:id/signals', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const rows = db.prepare('SELECT * FROM canopy_signals WHERE session_id = @id ORDER BY created_at ASC').all({ id }) as
    Record<string, unknown>[];
  res.json({ data: rows.map(parseSignal) });
});

// ─── TRIANGLE / CLA ───────────────────────────────────────────────────────────

canopyRouter.post('/canopy/session/:id/triangle', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { push, weight, pull, tensions } = req.body as Record<string, unknown>;
  db.prepare(`UPDATE canopy_sessions SET audit_result_seed = @seed, updated_at = @now WHERE id = @id`).run({
    id,
    seed: JSON.stringify({ futures_triangle: { push, weight, pull, tensions } }),
    now: new Date().toISOString(),
  });
  logRevision({
    session_id: id, user_id: req.userId!, entity_type: 'session', entity_id: id,
    revision_type: 'triangle_updated',
    snapshot: { push, weight, pull, tension_count: Array.isArray(tensions) ? tensions.length : 0 },
  });
  res.json({ data: { session_id: id, futures_triangle: { push, weight, pull, tensions } } });
});

canopyRouter.post('/canopy/session/:id/cla', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { litany, systemic, worldview, metaphor, centre_attributions } = req.body as Record<string, unknown>;
  db.prepare(`UPDATE canopy_sessions SET brick_seed = @cla, updated_at = @now WHERE id = @id`).run({
    id,
    cla: JSON.stringify({ litany, systemic, worldview, metaphor, centre_attributions }),
    now: new Date().toISOString(),
  });
  logRevision({
    session_id: id, user_id: req.userId!, entity_type: 'session', entity_id: id,
    revision_type: 'cla_updated',
    snapshot: { levels_filled: [litany, systemic, worldview, metaphor].filter(Boolean).length },
  });
  res.json({ data: { session_id: id, cla: { litany, systemic, worldview, metaphor, centre_attributions } } });
});

// ─── SCENARIO ROUTES ──────────────────────────────────────────────────────────

canopyRouter.post('/canopy/session/:id/scenario', authenticate, (req: AuthRequest, res: Response): void => {
  const { id: sessionId } = req.params;
  const { title, narrative, critical_uncertainties, horizon_id } = req.body as Record<string, unknown>;
  if (!title) { res.status(400).json({ error: 'title is required' }); return; }
  const scenarioId = uuidv4();
  db.prepare(`
    INSERT INTO canopy_scenarios (id, session_id, horizon_id, title, narrative, critical_uncertainties)
    VALUES (@id, @session_id, @horizon_id, @title, @narrative, @critical_uncertainties)
  `).run({
    id: scenarioId, session_id: sessionId, horizon_id: horizon_id ?? null,
    title, narrative: narrative ?? null,
    critical_uncertainties: JSON.stringify(critical_uncertainties ?? []),
  });
  const row = db.prepare('SELECT * FROM canopy_scenarios WHERE id = @id').get({ id: scenarioId }) as Record<string, unknown>;
  res.status(201).json({ data: parseScenario(row) });
});

canopyRouter.post('/canopy/scenario/:id/audit', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const row = db.prepare('SELECT * FROM canopy_scenarios WHERE id = @id').get({ id }) as Record<string, unknown> | undefined;
  if (!row) { res.status(404).json({ error: 'Scenario not found' }); return; }
  const narrative = (row.narrative as string) ?? '';
  const cu = safeJSON<string[]>(row.critical_uncertainties as string, []);
  try {
    let result;
    if (claude) {
      try {
        result = await auditScenarioWithClaude(narrative, cu, '');
      } catch (aiErr) {
        console.warn('Claude scenario audit failed, using mock:', aiErr);
        result = mockAuditScenario(narrative, cu);
      }
    } else {
      result = mockAuditScenario(narrative, cu);
    }
    db.prepare(`
      UPDATE canopy_scenarios SET
        consistency_certified = @cc, iia_pass = @iia, arrow_failure_flag = @aff,
        cw_map = @cw, cla_incast = @cla
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
    logRevision({
      session_id: row.session_id as string, user_id: req.userId!, entity_type: 'scenario', entity_id: id,
      revision_type: 'scenario_audited',
      snapshot: {
        consistency_pass: result.consistency_pass,
        iia_pass: result.iia_pass,
        arrow_failure_flag: result.arrow_failure_flag,
        contradiction_count: result.internal_contradictions.length,
      },
    });
    res.json({ data: { scenario: parseScenario(updated), audit: result } });
  } catch (err) {
    console.error('scenario/audit error:', err);
    res.status(500).json({ error: 'Audit failed' });
  }
});

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

canopyRouter.get('/canopy/session/:id/scenarios', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const rows = db.prepare('SELECT * FROM canopy_scenarios WHERE session_id = @id ORDER BY created_at ASC').all({ id }) as
    Record<string, unknown>[];
  res.json({ data: rows.map(parseScenario) });
});

// ─── COLLECTIVE HORIZONS (Phase 2 stubs) ────────────────────────────────────────────

canopyRouter.post('/canopy/session/:id/collective', authenticate, (req: AuthRequest, res: Response): void => {
  res.status(202).json({ message: 'Collective Horizons is Phase 2. Architecture ready.' });
});
canopyRouter.post('/canopy/collective/:id/ranking', authenticate, (req: AuthRequest, res: Response): void => {
  res.status(202).json({ message: 'Collective ranking — Phase 2.' });
});
canopyRouter.get('/canopy/collective/:id/arrow', authenticate, (req: AuthRequest, res: Response): void => {
  res.status(202).json({ message: 'Arrow diagnostic — Phase 2.' });
});
canopyRouter.post('/canopy/collective/:id/relax', authenticate, (req: AuthRequest, res: Response): void => {
  const { relaxation_type, rationale } = req.body as { relaxation_type: string; rationale: string };
  if (!relaxation_type || !rationale) {
    res.status(400).json({ error: 'relaxation_type and rationale are required' }); return;
  }
  res.json({ data: { relaxation_type, rationale, recorded_at: new Date().toISOString() } });
});

// ─── FORECAST / INDICATORS ─────────────────────────────────────────────────────

canopyRouter.post('/canopy/session/:id/backcast', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: sessionId } = req.params;
  const { preferred_horizon_id, time_horizon_years } = req.body as Record<string, unknown>;
  if (!preferred_horizon_id || !time_horizon_years) {
    res.status(400).json({ error: 'preferred_horizon_id and time_horizon_years are required' }); return;
  }
  try {
    let backcast;
    if (claude) {
      try {
        backcast = await backcastWithClaude(preferred_horizon_id as string, time_horizon_years as number);
      } catch (aiErr) {
        console.warn('Claude backcast failed, using mock:', aiErr);
        backcast = mockBackcast(time_horizon_years as number);
      }
    } else {
      backcast = mockBackcast(time_horizon_years as number);
    }
    const forecastId = uuidv4();
    db.prepare(`
      INSERT INTO canopy_forecasts
        (id, session_id, preferred_horizon_id, time_horizon_years, milestones, decision_gates, earliest_decisions, harvest_tree_seeds)
      VALUES
        (@id, @session_id, @preferred_horizon_id, @time_horizon_years, @milestones, @decision_gates, @earliest_decisions, @harvest_tree_seeds)
    `).run({
      id: forecastId, session_id: sessionId, preferred_horizon_id, time_horizon_years,
      milestones: JSON.stringify(backcast.milestones),
      decision_gates: JSON.stringify(backcast.decision_gates),
      earliest_decisions: JSON.stringify(backcast.earliest_decisions),
      harvest_tree_seeds: JSON.stringify(backcast.harvest_tree_seeds),
    });
    const row = db.prepare('SELECT * FROM canopy_forecasts WHERE id = @id').get({ id: forecastId }) as Record<string, unknown>;
    logRevision({
      session_id: sessionId, user_id: req.userId!, entity_type: 'forecast', entity_id: forecastId,
      revision_type: 'forecast_generated',
      snapshot: { milestone_count: backcast.milestones.length, time_horizon_years },
    });
    res.status(201).json({ data: parseForecast(row) });
  } catch (err) {
    console.error('canopy/backcast error:', err);
    res.status(500).json({ error: 'Backcasting failed' });
  }
});

canopyRouter.get('/canopy/session/:id/indicators', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const scenarios = db.prepare('SELECT * FROM canopy_scenarios WHERE session_id = @id').all({ id }) as
    Record<string, unknown>[];
  const signals = db.prepare('SELECT domain, strength FROM canopy_signals WHERE session_id = @id').all({ id }) as
    Array<{ domain: string; strength: string }>;
  const domainCounts: Record<string, number> = {};
  const wildcardDomains = new Set<string>();
  for (const sig of signals) {
    if (sig.domain) {
      domainCounts[sig.domain] = (domainCounts[sig.domain] ?? 0) + 1;
      if (sig.strength === 'wildcard') wildcardDomains.add(sig.domain);
    }
  }
  const indicators = scenarios.map((s) => {
    const claIncast = safeJSON(s.cla_incast as string, null) as Record<string, string> | null;
    return {
      scenario_id: s.id,
      scenario_title: s.title,
      indicators: [
        {
          label: 'Early signal of preferred horizon emerging',
          status: (domainCounts['Society'] ?? 0) + (domainCounts['Culture'] ?? 0) >= 3 ? 'firing'
            : (domainCounts['Society'] ?? 0) + (domainCounts['Culture'] ?? 0) >= 1 ? 'stirring' : 'quiet',
        },
        {
          label: 'Structural conditions beginning to shift',
          status: (domainCounts['Economy'] ?? 0) + (domainCounts['Governance'] ?? 0) >= 2 ? 'firing'
            : (domainCounts['Economy'] ?? 0) + (domainCounts['Governance'] ?? 0) >= 1 ? 'stirring' : 'quiet',
        },
        {
          label: 'Counter-signals detected',
          status: wildcardDomains.size >= 2 ? 'contradicted' : wildcardDomains.size >= 1 ? 'stirring' : 'quiet',
        },
        ...(claIncast ? [{
          label: `Metaphor layer: ${(claIncast.metaphor ?? '').slice(0, 60)}`,
          status: s.consistency_certified ? 'firing' : 'quiet',
        }] : []),
      ],
    };
  });
  res.json({ data: indicators });
});

canopyRouter.post('/canopy/session/:id/drift', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { new_signals, drift_description, drift_logic, revision_type, monitor_focus } =
    req.body as Record<string, unknown>;
  if (!drift_logic || !revision_type) {
    res.status(400).json({ error: 'drift_logic and revision_type are required' }); return;
  }
  const loggedAt = new Date().toISOString();
  logRevision({
    session_id: id,
    user_id: req.userId!,
    entity_type: 'session',
    entity_id: id,
    revision_type: 'drift_logged',
    trigger_signal: typeof new_signals === 'string' ? new_signals : undefined,
    rationale: drift_description as string | undefined,
    snapshot: { drift_logic, revision_type, monitor_focus, new_signals },
  });
  res.status(201).json({
    data: { session_id: id, logged_at: loggedAt, new_signals, drift_description, drift_logic, revision_type, monitor_focus },
  });
});

canopyRouter.get('/canopy/session/:id/revisions', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const rows = db.prepare(
    'SELECT * FROM canopy_revisions WHERE session_id = @id ORDER BY created_at DESC'
  ).all({ id }) as Record<string, unknown>[];
  res.json({ data: rows.map(parseRevision) });
});

canopyRouter.post('/canopy/session/:id/pwtc', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { scenario_id } = req.body as { scenario_id: string };
  if (!scenario_id) { res.status(400).json({ error: 'scenario_id is required' }); return; }
  db.prepare(`UPDATE canopy_sessions SET visibility = 'submitted', updated_at = @now WHERE id = @id`).run({
    id, now: new Date().toISOString(),
  });
  res.json({ data: { submitted: true, session_id: id, scenario_id } });
});

canopyRouter.post('/canopy/session/:id/harvest', authenticate, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const forecast = db.prepare(
    'SELECT * FROM canopy_forecasts WHERE session_id = @id ORDER BY created_at DESC LIMIT 1'
  ).get({ id }) as Record<string, unknown> | undefined;
  if (!forecast) { res.status(404).json({ error: 'No forecast found for this session' }); return; }
  const seeds = safeJSON<unknown[]>(forecast.harvest_tree_seeds as string, []);
  res.json({ data: { harvest_tree_seeds: seeds, export_ready: true } });
});

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
