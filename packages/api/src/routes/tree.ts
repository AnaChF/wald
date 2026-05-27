import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  Root,
  TrunkNode,
  Branch,
  Leaf,
  Fruit,
  EthicalConstraints,
  TreeDomain,
  extractBOLTs,
  extractNUTs,
  identifyBRICKs,
  runAuditPipeline,
  BOLT,
  NUT,
  BRICK,
} from '@wald/core';
import db from '../db/index';
import { optionalAuth, AuthRequest } from '../middleware/auth';

export const treeRouter = Router();

function safeParseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (value == null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

interface ParsedTree extends Record<string, unknown> {
  id: string;
  user_id: string | null;
  title: string;
  domain: string;
  roots: unknown[];
  trunk: unknown[];
  branches: unknown[];
  leaves: unknown[];
  fruits: unknown[];
  ethical_constraints: unknown;
  audit_stamp_id: string | null;
  last_audited_at: string | null;
  created_at: string;
  updated_at: string;
}

function parseTree(row: Record<string, unknown>): ParsedTree {
  return {
    ...(row as ParsedTree),
    roots: safeParseJSON(row.roots as string, []),
    trunk: safeParseJSON(row.trunk as string, []),
    branches: safeParseJSON(row.branches as string, []),
    leaves: safeParseJSON(row.leaves as string, []),
    fruits: safeParseJSON(row.fruits as string, []),
    ethical_constraints: safeParseJSON(row.ethical_constraints as string, {}),
  };
}

// Domain templates
function getDomainTemplate(domain: TreeDomain): {
  roots: Root[];
  trunk: TrunkNode[];
  branches: Branch[];
  leaves: Leaf[];
  fruits: Fruit[];
  ethical_constraints: EthicalConstraints;
} {
  const empty = {
    roots: [] as Root[],
    trunk: [] as TrunkNode[],
    branches: [] as Branch[],
    leaves: [] as Leaf[],
    fruits: [] as Fruit[],
    ethical_constraints: {
      freedom: '',
      responsibility: '',
      authenticity: '',
      solidarity: '',
      refusal_of_abandonment: '',
    } as EthicalConstraints,
  };

  if (domain === 'busyness_park') {
    return {
      ...empty,
      roots: [
        {
          id: uuidv4(),
          type: 'value',
          text: 'Economic security',
          waldconsistency_level: 'CE',
          is_negotiable: false,
        },
        {
          id: uuidv4(),
          type: 'commitment',
          text: 'Professional integrity',
          waldconsistency_level: 'CY',
          is_negotiable: true,
        },
      ],
      trunk: [
        {
          id: uuidv4(),
          text: 'Career development grounded in values',
          waldconsistency_level: 'CS',
          supports_roots: [],
        },
      ],
      ethical_constraints: {
        freedom: 'The freedom to choose the kind of work that aligns with your values',
        responsibility: 'Responsibility to contribute fairly to collective economic wellbeing',
        authenticity: 'Authentic engagement with work as meaningful, not merely instrumental',
        solidarity: 'Solidarity with workers whose conditions differ from your own',
        refusal_of_abandonment: 'Refusal to abandon those made redundant by structural change',
      },
    };
  }

  if (domain === 'parentown') {
    return {
      ...empty,
      roots: [
        {
          id: uuidv4(),
          type: 'value',
          text: 'Child wellbeing',
          waldconsistency_level: 'CE',
          is_negotiable: false,
        },
        {
          id: uuidv4(),
          type: 'value',
          text: 'Family stability',
          waldconsistency_level: 'CY',
          is_negotiable: true,
        },
      ],
      trunk: [
        {
          id: uuidv4(),
          text: 'Parenting philosophy',
          waldconsistency_level: 'CS',
          supports_roots: [],
        },
      ],
      ethical_constraints: {
        freedom: 'The freedom to parent according to one\'s considered values',
        responsibility: 'Responsibility to the child\'s long-term flourishing over short-term comfort',
        authenticity: 'Authentic modelling of the values you wish to transmit',
        solidarity: 'Solidarity with parents navigating structural disadvantage',
        refusal_of_abandonment: 'Refusal to abandon children to institutions without engaged presence',
      },
    };
  }

  if (domain === 'space_agency') {
    return {
      ...empty,
      roots: [
        {
          id: uuidv4(),
          type: 'value',
          text: 'Planetary stewardship',
          waldconsistency_level: 'CE',
          is_negotiable: false,
        },
        {
          id: uuidv4(),
          type: 'commitment',
          text: 'Scientific inquiry',
          waldconsistency_level: 'CY',
          is_negotiable: true,
        },
      ],
      trunk: [
        {
          id: uuidv4(),
          text: 'Long-term civilisational thinking',
          waldconsistency_level: 'CS',
          supports_roots: [],
        },
      ],
      ethical_constraints: {
        freedom: 'The freedom to pursue scientific knowledge without political constraint',
        responsibility: 'Responsibility to present Earth with the same care we project onto other worlds',
        authenticity: 'Authentic engagement with both the wonder and the risk of space exploration',
        solidarity: 'Solidarity with those who will bear the costs of planetary decisions',
        refusal_of_abandonment: 'Refusal to treat Earth as expendable in the pursuit of elsewhere',
      },
    };
  }

  return empty;
}

// POST /api/tree/create
treeRouter.post('/tree/create', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { title, domain, user_id } = req.body as {
    title?: string;
    domain?: string;
    user_id?: string;
  };

  if (!title || !domain) {
    res.status(400).json({ error: 'title and domain are required' });
    return;
  }

  const id = uuidv4();
  const userId = user_id ?? req.userId ?? null;
  const now = new Date().toISOString();

  const template = getDomainTemplate(domain as TreeDomain);

  try {
    db.prepare(`
      INSERT INTO harvest_trees
        (id, user_id, title, domain, roots, trunk, branches, leaves, fruits, ethical_constraints, created_at, updated_at)
      VALUES
        (@id, @user_id, @title, @domain, @roots, @trunk, @branches, @leaves, @fruits, @ethical_constraints, @created_at, @updated_at)
    `).run({
      id,
      user_id: userId,
      title,
      domain,
      roots: JSON.stringify(template.roots),
      trunk: JSON.stringify(template.trunk),
      branches: JSON.stringify(template.branches),
      leaves: JSON.stringify(template.leaves),
      fruits: JSON.stringify(template.fruits),
      ethical_constraints: JSON.stringify(template.ethical_constraints),
      created_at: now,
      updated_at: now,
    });

    const row = db.prepare('SELECT * FROM harvest_trees WHERE id = @id').get({ id }) as Record<string, unknown>;
    res.status(201).json({ data: parseTree(row) });
  } catch (err) {
    console.error('tree/create error:', err);
    res.status(500).json({ error: 'Failed to create harvest tree' });
  }
});

// GET /api/tree/:id
treeRouter.get('/tree/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;

  const row = db.prepare('SELECT * FROM harvest_trees WHERE id = @id').get({ id }) as
    | Record<string, unknown>
    | undefined;

  if (!row) {
    res.status(404).json({ error: 'Harvest tree not found' });
    return;
  }

  res.json({ data: parseTree(row) });
});

// PUT /api/tree/:id/layer/:name — update a specific layer
treeRouter.put('/tree/:id/layer/:name', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id, name } = req.params;
  const validLayers = ['roots', 'trunk', 'branches', 'leaves', 'fruits', 'ethical_constraints'];

  if (!validLayers.includes(name)) {
    res.status(400).json({ error: `Invalid layer name. Must be one of: ${validLayers.join(', ')}` });
    return;
  }

  const row = db.prepare('SELECT id FROM harvest_trees WHERE id = @id').get({ id });
  if (!row) {
    res.status(404).json({ error: 'Harvest tree not found' });
    return;
  }

  // Accept raw array or legacy {nodes:[...]} wrapper; reject anything else
  const body = req.body;
  const layerData = Array.isArray(body) ? body
    : Array.isArray(body?.nodes) ? body.nodes
    : null;
  if (layerData === null) {
    res.status(400).json({ error: 'Body must be a JSON array or { nodes: [] }' });
    return;
  }

  try {
    db.prepare(`UPDATE harvest_trees SET ${name} = @data, updated_at = @now WHERE id = @id`).run({
      id,
      data: JSON.stringify(layerData),
      now: new Date().toISOString(),
    });

    const updated = db.prepare('SELECT * FROM harvest_trees WHERE id = @id').get({ id }) as Record<string, unknown>;
    res.json({ data: parseTree(updated) });
  } catch (err) {
    console.error('tree/layer error:', err);
    res.status(500).json({ error: 'Failed to update layer' });
  }
});

// POST /api/tree/:id/audit — serialize tree to text, create audit session
treeRouter.post('/tree/:id/audit', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;

  const row = db.prepare('SELECT * FROM harvest_trees WHERE id = @id').get({ id }) as
    | Record<string, unknown>
    | undefined;

  if (!row) {
    res.status(404).json({ error: 'Harvest tree not found' });
    return;
  }

  const tree = parseTree(row);

  // Serialize tree to text for audit
  const parts: string[] = [];
  parts.push(`Harvest Tree: ${tree.title}`);
  parts.push(`Domain: ${tree.domain}`);

  if (Array.isArray(tree.roots) && tree.roots.length > 0) {
    parts.push('Roots (core values and commitments):');
    for (const r of tree.roots as Root[]) parts.push(`- ${r.text}`);
  }
  if (Array.isArray(tree.trunk) && tree.trunk.length > 0) {
    parts.push('Trunk (core positions):');
    for (const t of tree.trunk as TrunkNode[]) parts.push(`- ${t.text}`);
  }
  if (Array.isArray(tree.branches) && tree.branches.length > 0) {
    parts.push('Branches (applied positions):');
    for (const b of tree.branches as Branch[]) parts.push(`- ${b.text}`);
  }
  if (Array.isArray(tree.leaves) && tree.leaves.length > 0) {
    parts.push('Leaves (practices):');
    for (const l of tree.leaves as Leaf[]) parts.push(`- ${l.practice}`);
  }
  if (Array.isArray(tree.fruits) && tree.fruits.length > 0) {
    parts.push('Fruits (outcomes):');
    for (const f of tree.fruits as Fruit[]) parts.push(`- ${f.outcome}`);
  }

  const inputContent = parts.join('\n');
  const sessionId = uuidv4();
  const userId = req.userId ?? (row.user_id as string | null) ?? null;

  try {
    const bolts: BOLT[] = extractBOLTs(inputContent);
    const nuts: NUT[] = extractNUTs(bolts, inputContent);
    const bricks: BRICK[] = identifyBRICKs(bolts, nuts);
    const auditResult = runAuditPipeline(bolts, nuts, bricks);

    db.prepare(`
      INSERT INTO audit_sessions
        (id, user_id, input_type, input_content, bolts, nuts, bricks, audit_result, visibility)
      VALUES
        (@id, @user_id, 'text', @input_content, @bolts, @nuts, @bricks, @audit_result, 'private')
    `).run({
      id: sessionId,
      user_id: userId,
      input_content: inputContent,
      bolts: JSON.stringify(bolts),
      nuts: JSON.stringify(nuts),
      bricks: JSON.stringify(bricks),
      audit_result: JSON.stringify(auditResult),
    });

    // Link the audit stamp to the tree
    db.prepare(`
      UPDATE harvest_trees SET audit_stamp_id = @sessionId, last_audited_at = @now, updated_at = @now WHERE id = @id
    `).run({ id, sessionId, now: new Date().toISOString() });

    res.status(201).json({ data: { session_id: sessionId, tree_id: id } });
  } catch (err) {
    console.error('tree/audit error:', err);
    res.status(500).json({ error: 'Failed to create audit session for tree' });
  }
});

// GET /api/tree/:id/report
treeRouter.get('/tree/:id/report', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;

  const row = db.prepare('SELECT * FROM harvest_trees WHERE id = @id').get({ id }) as
    | Record<string, unknown>
    | undefined;

  if (!row) {
    res.status(404).json({ error: 'Harvest tree not found' });
    return;
  }

  const tree = parseTree(row);

  let auditData: unknown = null;
  if (row.audit_stamp_id) {
    const auditRow = db
      .prepare('SELECT audit_result, created_at FROM audit_sessions WHERE id = @id')
      .get({ id: row.audit_stamp_id as string }) as Record<string, unknown> | undefined;
    if (auditRow) {
      auditData = {
        audit_result: auditRow.audit_result
          ? safeParseJSON(auditRow.audit_result as string, null)
          : null,
        audited_at: auditRow.created_at,
      };
    }
  }

  const roots = Array.isArray(tree.roots) ? tree.roots as Root[] : [];
  const trunk = Array.isArray(tree.trunk) ? tree.trunk as TrunkNode[] : [];
  const branches = Array.isArray(tree.branches) ? tree.branches as Branch[] : [];
  const leaves = Array.isArray(tree.leaves) ? tree.leaves as Leaf[] : [];
  const fruits = Array.isArray(tree.fruits) ? tree.fruits as Fruit[] : [];

  res.json({
    data: {
      id: tree.id,
      title: tree.title,
      domain: tree.domain,
      summary: {
        root_count: roots.length,
        trunk_count: trunk.length,
        branch_count: branches.length,
        leaf_count: leaves.length,
        fruit_count: fruits.length,
      },
      ethical_constraints: tree.ethical_constraints,
      audit: auditData,
      created_at: tree.created_at,
      updated_at: tree.updated_at,
    },
  });
});

// GET /api/user/:id/trees
treeRouter.get('/user/:id/trees', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;

  const rows = db
    .prepare('SELECT * FROM harvest_trees WHERE user_id = @id ORDER BY created_at DESC')
    .all({ id }) as Record<string, unknown>[];

  res.json({ data: rows.map(parseTree) });
});

// PATCH /api/tree/:id/title — rename a tree (owner only)
treeRouter.patch('/tree/:id/title', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { title } = req.body as { title?: string };
  if (!title?.trim()) { res.status(400).json({ error: 'title is required' }); return; }
  const row = db.prepare('SELECT id, user_id FROM harvest_trees WHERE id = @id').get({ id }) as
    { id: string; user_id: string | null } | undefined;
  if (!row) { res.status(404).json({ error: 'Harvest tree not found' }); return; }
  if (row.user_id && row.user_id !== req.userId) { res.status(403).json({ error: 'Access denied' }); return; }
  db.prepare('UPDATE harvest_trees SET title = @title, updated_at = @now WHERE id = @id').run({
    id, title: title.trim(), now: new Date().toISOString(),
  });
  const updated = db.prepare('SELECT * FROM harvest_trees WHERE id = @id').get({ id }) as Record<string, unknown>;
  res.json({ data: parseTree(updated) });
});

treeRouter.post('/tree/:id/share', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;

  const row = db.prepare('SELECT id FROM harvest_trees WHERE id = @id').get({ id });
  if (!row) {
    res.status(404).json({ error: 'Harvest tree not found' });
    return;
  }

  db.prepare(`UPDATE harvest_trees SET visibility = 'shared', updated_at = @now WHERE id = @id`).run({
    id,
    now: new Date().toISOString(),
  });

  const shareLink = `${process.env.PUBLIC_URL ?? 'http://localhost:5173'}/tree/${id}/shared`;

  res.json({ data: { share_link: shareLink, tree_id: id, visibility: 'shared' } });
});
