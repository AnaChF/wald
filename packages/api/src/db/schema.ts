// SQLite schema definitions
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  citizen_type TEXT DEFAULT 'crowdster',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  input_type TEXT NOT NULL,
  input_content TEXT NOT NULL,
  input_source_url TEXT,
  agent_context TEXT,
  bolts TEXT DEFAULT '[]',
  nuts TEXT DEFAULT '[]',
  bricks TEXT DEFAULT '[]',
  audit_result TEXT,
  stamp_image_url TEXT,
  regenerative_plan_id TEXT,
  visibility TEXT DEFAULT 'private',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS harvest_trees (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  roots TEXT DEFAULT '[]',
  trunk TEXT DEFAULT '[]',
  branches TEXT DEFAULT '[]',
  leaves TEXT DEFAULT '[]',
  fruits TEXT DEFAULT '[]',
  ethical_constraints TEXT DEFAULT '{}',
  audit_stamp_id TEXT,
  last_audited_at TEXT,
  visibility TEXT DEFAULT 'private',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS territories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  zone TEXT NOT NULL,
  seek_question TEXT,
  tech_tool TEXT,
  pipeline TEXT DEFAULT '[]',
  tagline TEXT,
  land_type TEXT DEFAULT 'landscape',
  real_estate_status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS epistemic_cards (
  id TEXT PRIMARY KEY,
  territory_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  claim TEXT NOT NULL,
  evidence TEXT DEFAULT '[]',
  possible_worlds_note TEXT,
  challenge_question TEXT,
  required_action TEXT DEFAULT '{}',
  waldconsistency_precheck TEXT,
  created_by TEXT,
  status TEXT DEFAULT 'published',
  FOREIGN KEY (territory_id) REFERENCES territories(id)
);

CREATE TABLE IF NOT EXISTS totemic_characters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  name TEXT,
  base_form TEXT,
  attributes TEXT DEFAULT '{}',
  shaped_by TEXT DEFAULT '{}',
  visual TEXT DEFAULT '{}',
  downloadable_svg TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS possible_worlds_futures (
  id TEXT PRIMARY KEY,
  author_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  territory_id TEXT,
  audit_stamp_id TEXT,
  stakes TEXT DEFAULT '[]',
  currency_value REAL DEFAULT 0,
  shares TEXT DEFAULT '[]',
  options TEXT DEFAULT '[]',
  arrow_failure_flag INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_actions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  card_id TEXT,
  territory_id TEXT,
  completed_at TEXT DEFAULT (datetime('now')),
  verification_type TEXT,
  UNIQUE(user_id, action_id)
);

CREATE TABLE IF NOT EXISTS train_station_resources (
  id TEXT PRIMARY KEY,
  territory_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT,
  waldconsistency_level TEXT,
  description TEXT,
  is_locked INTEGER DEFAULT 0,
  FOREIGN KEY (territory_id) REFERENCES territories(id)
);

CREATE TABLE IF NOT EXISTS canopy_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  foresight_question TEXT,
  audit_result_seed TEXT,
  brick_seed TEXT,
  centre_description TEXT,
  status TEXT DEFAULT 'active',
  visibility TEXT DEFAULT 'private',
  share_token TEXT UNIQUE,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS canopy_signals (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  source TEXT,
  domain TEXT,
  logic_type TEXT,
  strength TEXT,
  cw_class TEXT,
  classifier_rationale TEXT,
  linked_bolts TEXT DEFAULT '[]',
  futures_cone_layer TEXT,
  canvas_x REAL DEFAULT 0,
  canvas_y REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS canopy_horizons (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cone_layer TEXT,
  cw_class TEXT,
  centre TEXT,
  plausibility_score REAL DEFAULT 0.5,
  desirability_score REAL DEFAULT 0.5,
  linked_signals TEXT DEFAULT '[]',
  linked_bricks TEXT DEFAULT '[]',
  futures_triangle TEXT,
  pwtc_submitted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS canopy_scenarios (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  horizon_id TEXT,
  title TEXT NOT NULL,
  narrative TEXT,
  critical_uncertainties TEXT DEFAULT '[]',
  consistency_certified INTEGER DEFAULT 0,
  iia_pass INTEGER DEFAULT 0,
  arrow_failure_flag INTEGER DEFAULT 0,
  cw_map TEXT,
  cla_incast TEXT,
  relaxed_arrow_condition TEXT,
  relaxation_rationale TEXT,
  audit_stamp_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS canopy_forecasts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  scenario_id TEXT,
  preferred_horizon_id TEXT,
  time_horizon_years INTEGER,
  milestones TEXT DEFAULT '[]',
  decision_gates TEXT DEFAULT '[]',
  earliest_decisions TEXT DEFAULT '[]',
  harvest_tree_seeds TEXT DEFAULT '[]',
  early_indicators TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS canopy_revisions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  revision_type TEXT NOT NULL,
  trigger_signal TEXT,
  rationale TEXT,
  snapshot TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`;
