import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  extractBOLTs,
  extractNUTs,
  identifyBRICKs,
  runAuditPipeline,
  AuditResult,
  BOLT,
  NUT,
  BRICK,
} from '@wald/core';
import db from '../db/index';
import { optionalAuth, AuthRequest } from '../middleware/auth';

export const auditRouter = Router();

// Helper: parse all JSON fields on a raw audit session row
function parseSession(row: Record<string, unknown>) {
  return {
    ...row,
    bolts: safeParseJSON(row.bolts as string, []),
    nuts: safeParseJSON(row.nuts as string, []),
    bricks: safeParseJSON(row.bricks as string, []),
    audit_result: row.audit_result ? safeParseJSON(row.audit_result as string, null) : null,
    agent_context: row.agent_context ? safeParseJSON(row.agent_context as string, null) : null,
  };
}

function safeParseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (value == null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// POST /api/audit/submit
auditRouter.post('/audit/submit', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { input_type, input_content, input_source_url, agent_context } = req.body as {
    input_type?: string;
    input_content?: string;
    input_source_url?: string;
    agent_context?: unknown;
  };

  if (!input_type || !input_content) {
    res.status(400).json({ error: 'input_type and input_content are required' });
    return;
  }

  try {
    const id = uuidv4();
    const userId = req.userId ?? null;

    // Run extraction
    const bolts: BOLT[] = extractBOLTs(input_content);
    const nuts: NUT[] = extractNUTs(bolts, input_content);
    const bricks: BRICK[] = identifyBRICKs(bolts, nuts);

    db.prepare(`
      INSERT INTO audit_sessions
        (id, user_id, input_type, input_content, input_source_url, agent_context, bolts, nuts, bricks, visibility)
      VALUES
        (@id, @user_id, @input_type, @input_content, @input_source_url, @agent_context, @bolts, @nuts, @bricks, 'private')
    `).run({
      id,
      user_id: userId,
      input_type,
      input_content,
      input_source_url: input_source_url ?? null,
      agent_context: agent_context ? JSON.stringify(agent_context) : null,
      bolts: JSON.stringify(bolts),
      nuts: JSON.stringify(nuts),
      bricks: JSON.stringify(bricks),
    });

    const row = db.prepare('SELECT * FROM audit_sessions WHERE id = @id').get({ id }) as Record<string, unknown>;

    res.status(201).json({ data: parseSession(row) });
  } catch (err) {
    console.error('audit/submit error:', err);
    res.status(500).json({ error: 'Failed to submit audit session' });
  }
});

// GET /api/audit/:id
auditRouter.get('/audit/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;

  const row = db.prepare('SELECT * FROM audit_sessions WHERE id = @id').get({ id }) as
    | Record<string, unknown>
    | undefined;

  if (!row) {
    res.status(404).json({ error: 'Audit session not found' });
    return;
  }

  res.json({ data: parseSession(row) });
});

// POST /api/audit/:id/run — run full audit pipeline
auditRouter.post('/audit/:id/run', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;

  const row = db.prepare('SELECT * FROM audit_sessions WHERE id = @id').get({ id }) as
    | Record<string, unknown>
    | undefined;

  if (!row) {
    res.status(404).json({ error: 'Audit session not found' });
    return;
  }

  try {
    const bolts: BOLT[] = safeParseJSON(row.bolts as string, []);
    const nuts: NUT[] = safeParseJSON(row.nuts as string, []);
    const bricks: BRICK[] = safeParseJSON(row.bricks as string, []);

    const auditResult: AuditResult = runAuditPipeline(bolts, nuts, bricks);

    db.prepare(`
      UPDATE audit_sessions SET audit_result = @audit_result WHERE id = @id
    `).run({ id, audit_result: JSON.stringify(auditResult) });

    const updated = db.prepare('SELECT * FROM audit_sessions WHERE id = @id').get({ id }) as Record<string, unknown>;
    res.json({ data: parseSession(updated) });
  } catch (err) {
    console.error('audit/run error:', err);
    res.status(500).json({ error: 'Failed to run audit pipeline' });
  }
});

// GET /api/audit/:id/stamp
auditRouter.get('/audit/:id/stamp', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;

  const row = db.prepare('SELECT * FROM audit_sessions WHERE id = @id').get({ id }) as
    | Record<string, unknown>
    | undefined;

  if (!row) {
    res.status(404).json({ error: 'Audit session not found' });
    return;
  }

  const auditResult = row.audit_result
    ? safeParseJSON<AuditResult | null>(row.audit_result as string, null)
    : null;

  res.json({
    data: {
      session_id: id,
      title: `Wald Audit — ${new Date(row.created_at as string).toLocaleDateString('en-GB')}`,
      audit_result: auditResult,
      stamp_image_url: row.stamp_image_url ?? null,
      input_type: row.input_type,
      created_at: row.created_at,
    },
  });
});

// POST /api/audit/:id/plan — generate regenerative plan from failures
auditRouter.post('/audit/:id/plan', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;

  const row = db.prepare('SELECT * FROM audit_sessions WHERE id = @id').get({ id }) as
    | Record<string, unknown>
    | undefined;

  if (!row) {
    res.status(404).json({ error: 'Audit session not found' });
    return;
  }

  const auditResult = row.audit_result
    ? safeParseJSON<AuditResult | null>(row.audit_result as string, null)
    : null;

  if (!auditResult) {
    res.status(400).json({ error: 'Run the audit pipeline first before generating a plan' });
    return;
  }

  // Map failures to tree layers
  const roots: string[] = [];
  const trunk: string[] = [];
  const branches: string[] = [];
  const leaves: string[] = [];
  const fruits: string[] = [];

  for (const failure of auditResult.failures) {
    const desc = failure.description;
    switch (failure.level) {
      case 'CE':
      case 'CY':
        roots.push(`Address failure: ${desc}`);
        break;
      case 'CS':
      case 'L':
        trunk.push(`Strengthen: ${desc}`);
        break;
      case 'S':
      case 'CN':
        branches.push(`Clarify: ${desc}`);
        break;
      case 'K':
        leaves.push(`Build knowledge: ${desc}`);
        break;
      case 'CR':
        fruits.push(`Contextualise: ${desc}`);
        break;
    }
  }

  const planId = uuidv4();

  db.prepare(`
    UPDATE audit_sessions SET regenerative_plan_id = @planId WHERE id = @id
  `).run({ id, planId });

  res.json({
    data: {
      plan_id: planId,
      session_id: id,
      verdict: auditResult.verdict,
      cl_score: auditResult.cl_score,
      sci_score: auditResult.sci_score,
      layers: { roots, trunk, branches, leaves, fruits },
    },
  });
});

// GET /api/user/:id/stamps — list user's audit sessions
auditRouter.get('/user/:id/stamps', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;

  const rows = db
    .prepare(`
      SELECT * FROM audit_sessions
      WHERE user_id = @id
      ORDER BY created_at DESC
    `)
    .all({ id }) as Record<string, unknown>[];

  res.json({ data: rows.map(parseSession) });
});
