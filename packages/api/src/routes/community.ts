import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { CitizenType } from '@wald/core';
import db from '../db/index';
import { optionalAuth, AuthRequest } from '../middleware/auth';

export const communityRouter = Router();

function safeParseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (value == null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseTerritory(row: Record<string, unknown>) {
  return {
    ...row,
    pipeline: safeParseJSON(row.pipeline as string, []),
  };
}

function parseCard(row: Record<string, unknown>) {
  return {
    ...row,
    evidence: safeParseJSON(row.evidence as string, []),
    required_action: safeParseJSON(row.required_action as string, {}),
    waldconsistency_precheck: row.waldconsistency_precheck
      ? safeParseJSON(row.waldconsistency_precheck as string, null)
      : null,
  };
}

// GET /api/territories
communityRouter.get('/territories', optionalAuth, (req: AuthRequest, res: Response): void => {
  const rows = db.prepare('SELECT * FROM territories ORDER BY name ASC').all() as Record<string, unknown>[];
  res.json({ data: rows.map(parseTerritory) });
});

// GET /api/territory/:id
communityRouter.get('/territory/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const row = db.prepare('SELECT * FROM territories WHERE id = @id').get({ id }) as Record<string, unknown> | undefined;
  if (!row) {
    res.status(404).json({ error: 'Territory not found' });
    return;
  }
  res.json({ data: parseTerritory(row) });
});

// GET /api/territory/:id/cards
communityRouter.get('/territory/:id/cards', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const rows = db
    .prepare(`
      SELECT * FROM epistemic_cards
      WHERE territory_id = @id AND status = 'published'
      ORDER BY position ASC
    `)
    .all({ id }) as Record<string, unknown>[];
  res.json({ data: rows.map(parseCard) });
});

// POST /api/action/:id/complete
communityRouter.post('/action/:id/complete', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id: action_id } = req.params;
  const userId = req.userId ?? (req.body as { user_id?: string }).user_id ?? null;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required to complete actions' });
    return;
  }

  const { card_id, territory_id, verification_type } = req.body as {
    card_id?: string;
    territory_id?: string;
    verification_type?: string;
  };

  try {
    const userActionId = uuidv4();
    db.prepare(`
      INSERT OR IGNORE INTO user_actions (id, user_id, action_id, card_id, territory_id, verification_type)
      VALUES (@id, @user_id, @action_id, @card_id, @territory_id, @verification_type)
    `).run({
      id: userActionId,
      user_id: userId,
      action_id,
      card_id: card_id ?? null,
      territory_id: territory_id ?? null,
      verification_type: verification_type ?? 'self_reported',
    });

    // Update citizen type based on completed actions
    const count = (
      db.prepare('SELECT COUNT(*) as cnt FROM user_actions WHERE user_id = @user_id').get({
        user_id: userId,
      }) as { cnt: number }
    ).cnt;

    let citizen_type: CitizenType = 'crowdster';
    if (count >= 20) citizen_type = 'copilot';
    else if (count >= 10) citizen_type = 'creator';
    else if (count >= 5) citizen_type = 'curator';

    db.prepare('UPDATE users SET citizen_type = @citizen_type WHERE id = @id').run({
      citizen_type,
      id: userId,
    });

    res.status(201).json({
      data: {
        action_id,
        user_id: userId,
        completed: true,
        new_citizen_type: citizen_type,
        total_actions_completed: count,
      },
    });
  } catch (err) {
    console.error('action/complete error:', err);
    res.status(500).json({ error: 'Failed to record action completion' });
  }
});

// Deterministic colour generator from a string hash
function hashToHex(input: string, salt: string): string {
  const hash = crypto.createHash('sha256').update(input + salt).digest('hex');
  return '#' + hash.slice(0, 6);
}

function deriveTotem(userId: string, actionsCount: number, territoriesVisited: number) {
  const curiosity = Math.min(100, actionsCount * 8 + territoriesVisited * 10);
  const solidarity = Math.min(100, actionsCount * 5 + territoriesVisited * 8);
  const rootedness = Math.min(100, actionsCount * 4 + 20);
  const reach = Math.min(100, territoriesVisited * 15 + actionsCount * 3);

  const primaryColour = hashToHex(userId, 'primary');
  const secondaryColour = hashToHex(userId, 'secondary');

  const baseForms = ['tree', 'bird', 'fish', 'stone', 'flame', 'river'];
  const hashNum = parseInt(crypto.createHash('md5').update(userId).digest('hex').slice(0, 8), 16);
  const baseForm = baseForms[hashNum % baseForms.length];

  const silhouettes: Record<string, string> = {
    tree: 'branching-upward',
    bird: 'winged-in-flight',
    fish: 'streamlined',
    stone: 'grounded-mass',
    flame: 'upward-flicker',
    river: 'flowing-lateral',
  };

  const textures = ['smooth', 'rough', 'woven', 'crystalline', 'layered'];
  const texture = textures[hashNum % textures.length];

  const emblems = ['eye', 'spiral', 'seed', 'wave', 'knot', 'star'];
  const emblem = emblems[(hashNum >> 4) % emblems.length];

  const names = ['Waldling', 'Thinker', 'Rooted One', 'Seeker', 'Connector', 'Weaver'];
  const name = names[hashNum % names.length];

  return {
    name,
    base_form: baseForm,
    attributes: { curiosity, solidarity, rootedness, reach },
    visual: {
      silhouette: silhouettes[baseForm],
      primary_colour: primaryColour,
      texture,
      emblem,
      secondary_colour: secondaryColour,
    },
  };
}

// GET /api/totem/:user_id
communityRouter.get('/totem/:user_id', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { user_id } = req.params;

  // Check if totem already exists
  const existing = db
    .prepare('SELECT * FROM totemic_characters WHERE user_id = @user_id')
    .get({ user_id }) as Record<string, unknown> | undefined;

  if (existing) {
    res.json({
      data: {
        ...existing,
        attributes: safeParseJSON(existing.attributes as string, {}),
        shaped_by: safeParseJSON(existing.shaped_by as string, {}),
        visual: safeParseJSON(existing.visual as string, {}),
      },
    });
    return;
  }

  // Generate a new totem
  const user = db.prepare('SELECT * FROM users WHERE id = @id').get({ id: user_id }) as
    | Record<string, unknown>
    | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const actionCount = (
    db.prepare('SELECT COUNT(*) as cnt FROM user_actions WHERE user_id = @id').get({ id: user_id }) as {
      cnt: number;
    }
  ).cnt;

  const territoriesVisited = (
    db
      .prepare('SELECT COUNT(DISTINCT territory_id) as cnt FROM user_actions WHERE user_id = @id AND territory_id IS NOT NULL')
      .get({ id: user_id }) as { cnt: number }
  ).cnt;

  const completedActions = (
    db.prepare('SELECT action_id FROM user_actions WHERE user_id = @id').all({ id: user_id }) as {
      action_id: string;
    }[]
  ).map((r) => r.action_id);

  const visitedTerritoryIds = (
    db
      .prepare('SELECT DISTINCT territory_id FROM user_actions WHERE user_id = @id AND territory_id IS NOT NULL')
      .all({ id: user_id }) as { territory_id: string }[]
  ).map((r) => r.territory_id);

  const totemData = deriveTotem(user_id, actionCount, territoriesVisited);
  const id = uuidv4();

  const shaped_by = {
    territories: visitedTerritoryIds,
    actions_completed: completedActions,
    citizen_type: user.citizen_type as CitizenType,
    waldconsistency_avg: 0,
  };

  db.prepare(`
    INSERT INTO totemic_characters (id, user_id, name, base_form, attributes, shaped_by, visual)
    VALUES (@id, @user_id, @name, @base_form, @attributes, @shaped_by, @visual)
  `).run({
    id,
    user_id,
    name: totemData.name,
    base_form: totemData.base_form,
    attributes: JSON.stringify(totemData.attributes),
    shaped_by: JSON.stringify(shaped_by),
    visual: JSON.stringify(totemData.visual),
  });

  res.status(201).json({
    data: {
      id,
      user_id,
      name: totemData.name,
      base_form: totemData.base_form,
      attributes: totemData.attributes,
      shaped_by,
      visual: totemData.visual,
    },
  });
});

// GET /api/station/:territory_id
communityRouter.get('/station/:territory_id', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { territory_id } = req.params;
  const userId = req.userId;

  const territory = db.prepare('SELECT id FROM territories WHERE id = @id').get({ id: territory_id });
  if (!territory) {
    res.status(404).json({ error: 'Territory not found' });
    return;
  }

  const resources = db
    .prepare('SELECT * FROM train_station_resources WHERE territory_id = @territory_id ORDER BY id ASC')
    .all({ territory_id }) as Record<string, unknown>[];

  // Check which resources user has unlocked
  let unlockedActionIds: Set<string> = new Set();
  if (userId) {
    const actions = db
      .prepare('SELECT action_id FROM user_actions WHERE user_id = @user_id AND territory_id = @territory_id')
      .all({ user_id: userId, territory_id }) as { action_id: string }[];
    unlockedActionIds = new Set(actions.map((a) => a.action_id));
  }

  const enriched = resources.map((r) => ({
    ...r,
    is_locked: userId
      ? r.is_locked === 1 && unlockedActionIds.size === 0
      : r.is_locked === 1,
  }));

  res.json({ data: enriched });
});

// POST /api/pwtc/future
communityRouter.post('/pwtc/future', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { title, description, territory_id, options } = req.body as {
    title?: string;
    description?: string;
    territory_id?: string;
    options?: { condition: string; action_if_triggered: string }[];
  };

  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  const id = uuidv4();
  const author_id = req.userId ?? null;

  try {
    db.prepare(`
      INSERT INTO possible_worlds_futures
        (id, author_id, title, description, territory_id, options, stakes, shares)
      VALUES
        (@id, @author_id, @title, @description, @territory_id, @options, '[]', '[]')
    `).run({
      id,
      author_id,
      title,
      description: description ?? null,
      territory_id: territory_id ?? null,
      options: JSON.stringify(options ?? []),
    });

    const row = db.prepare('SELECT * FROM possible_worlds_futures WHERE id = @id').get({ id }) as Record<string, unknown>;
    res.status(201).json({
      data: {
        ...row,
        stakes: safeParseJSON(row.stakes as string, []),
        shares: safeParseJSON(row.shares as string, []),
        options: safeParseJSON(row.options as string, []),
        arrow_failure_flag: row.arrow_failure_flag === 1,
      },
    });
  } catch (err) {
    console.error('pwtc/future error:', err);
    res.status(500).json({ error: 'Failed to create possible worlds future' });
  }
});

// POST /api/pwtc/:id/stake
communityRouter.post('/pwtc/:id/stake', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;
  const { what_they_risk, magnitude } = req.body as {
    what_they_risk?: string;
    magnitude?: number;
  };

  const userId = req.userId ?? null;

  if (!what_they_risk) {
    res.status(400).json({ error: 'what_they_risk is required' });
    return;
  }

  const row = db.prepare('SELECT * FROM possible_worlds_futures WHERE id = @id').get({ id }) as
    | Record<string, unknown>
    | undefined;

  if (!row) {
    res.status(404).json({ error: 'Possible worlds future not found' });
    return;
  }

  if (row.status !== 'open') {
    res.status(400).json({ error: 'This future is no longer open for staking' });
    return;
  }

  const stakes = safeParseJSON<{ user_id: string | null; what_they_risk: string; magnitude: number }[]>(
    row.stakes as string,
    [],
  );

  stakes.push({
    user_id: userId,
    what_they_risk,
    magnitude: magnitude ?? 1,
  });

  const newCurrencyValue = stakes.reduce((sum, s) => sum + s.magnitude, 0);

  db.prepare(`
    UPDATE possible_worlds_futures SET stakes = @stakes, currency_value = @currency_value WHERE id = @id
  `).run({ id, stakes: JSON.stringify(stakes), currency_value: newCurrencyValue });

  res.json({
    data: {
      future_id: id,
      stakes,
      currency_value: newCurrencyValue,
    },
  });
});

// GET /api/pwtc/futures
communityRouter.get('/pwtc/futures', optionalAuth, (req: AuthRequest, res: Response): void => {
  const rows = db
    .prepare(`SELECT * FROM possible_worlds_futures WHERE status = 'open' ORDER BY created_at DESC`)
    .all() as Record<string, unknown>[];

  const parsed = rows.map((r) => ({
    ...r,
    stakes: safeParseJSON(r.stakes as string, []),
    shares: safeParseJSON(r.shares as string, []),
    options: safeParseJSON(r.options as string, []),
    arrow_failure_flag: r.arrow_failure_flag === 1,
  }));

  res.json({ data: parsed });
});

// GET /api/user/:id/journey
communityRouter.get('/user/:id/journey', optionalAuth, (req: AuthRequest, res: Response): void => {
  const { id } = req.params;

  const user = db
    .prepare('SELECT citizen_type FROM users WHERE id = @id')
    .get({ id }) as { citizen_type: string } | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const actions = db
    .prepare('SELECT * FROM user_actions WHERE user_id = @id ORDER BY completed_at ASC')
    .all({ id }) as Record<string, unknown>[];

  const territoriesVisited = Array.from(
    new Set(
      actions
        .filter((a) => a.territory_id != null)
        .map((a) => a.territory_id as string),
    ),
  );

  const actionsCompleted = actions.length;
  const citizen_type = user.citizen_type as CitizenType;

  // Determine current stage based on citizen type and actions
  const stageMap: Record<CitizenType, string> = {
    crowdster: 'arrival',
    curator: 'exploration',
    creator: 'contribution',
    copilot: 'stewardship',
  };

  const current_stage = stageMap[citizen_type] ?? 'arrival';

  res.json({
    data: {
      user_id: id,
      current_stage,
      citizen_type,
      territories_visited: territoriesVisited,
      territories_visited_count: territoriesVisited.length,
      actions_completed: actionsCompleted,
      actions: actions.map((a) => ({
        action_id: a.action_id,
        card_id: a.card_id,
        territory_id: a.territory_id,
        completed_at: a.completed_at,
      })),
    },
  });
});
