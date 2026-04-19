// ─────────────────────────────────────────────
//  Waldconsistency core types
// ─────────────────────────────────────────────

export type WaldconsistencyLevel = 'CE' | 'CY' | 'CS' | 'L' | 'S' | 'CN' | 'K' | 'CR';

export type WaldconsistencyScore = Record<WaldconsistencyLevel, number>;

export type Verdict = 'GROUNDED' | 'CONDITIONAL' | 'CONTESTED' | 'UNGROUNDED';

export interface AuditFailure {
  level: WaldconsistencyLevel;
  bolt_id?: string;
  description: string;
  severity: 'critical' | 'moderate' | 'minor';
}

export interface AuditResult {
  verdict: Verdict;
  cl_score: number;
  sci_score: number;
  waldconsistency: WaldconsistencyScore;
  failures: AuditFailure[];
  timestamp: string;
}

// ─────────────────────────────────────────────
//  Belief anatomy types
// ─────────────────────────────────────────────

export interface BOLT {
  id: string;
  text: string;
  c_intension: string;
  w_intension: string;
  waldconsistency: Partial<WaldconsistencyScore>;
  is_brick: boolean;
}

export interface NUT {
  id: string;
  bolt_id: string;
  text: string;
  type: 'assumption' | 'premise' | 'inference';
}

export interface BRICK {
  id: string;
  bolt_id: string;
  text: string;
  resistance_type: 'empirical' | 'logical' | 'normative';
  severity: 'low' | 'medium' | 'high';
}

// ─────────────────────────────────────────────
//  AuditSession (Walditorium)
// ─────────────────────────────────────────────

export interface AuditSession {
  id: string;
  user_id: string;
  input: {
    type: 'text' | 'pdf' | 'url';
    content: string;
    source_url?: string;
  };
  agent_context?: {
    description: string;
    known_beliefs: string[];
  };
  bolts: BOLT[];
  nuts: NUT[];
  bricks: BRICK[];
  audit_result?: AuditResult;
  stamp_image_url?: string;
  regenerative_plan_id?: string;
  visibility: 'private' | 'shared' | 'public';
  created_at: string;
}

// ─────────────────────────────────────────────
//  HarvestTree
// ─────────────────────────────────────────────

export type TreeDomain =
  | 'busyness_park'
  | 'parentown'
  | 'space_agency'
  | 'bond_street'
  | 'times_square'
  | 'studio_city'
  | 'custom';

export interface Root {
  id: string;
  type: 'value' | 'commitment' | 'brick';
  text: string;
  waldconsistency_level: 'CE' | 'CY';
  is_negotiable: boolean;
  linked_brick_id?: string;
}

export interface TrunkNode {
  id: string;
  text: string;
  waldconsistency_level: 'CS' | 'L';
  linked_bolt_id?: string;
  supports_roots: string[];
}

export interface Branch {
  id: string;
  territory: string;
  text: string;
  waldconsistency_level: 'S' | 'CN';
  linked_trunk: string[];
}

export interface Leaf {
  id: string;
  practice: string;
  frequency: 'daily' | 'weekly' | 'as_needed';
  waldconsistency_level: 'K';
  linked_nut_id?: string;
  branch_id: string;
}

export interface Fruit {
  id: string;
  outcome: string;
  visibility: 'private' | 'shared' | 'public';
  waldconsistency_level: 'CR';
  measured_by: string;
  leaf_ids: string[];
}

export interface EthicalConstraints {
  freedom: string;
  responsibility: string;
  authenticity: string;
  solidarity: string;
  refusal_of_abandonment: string;
}

export interface HarvestTree {
  id: string;
  user_id: string;
  title: string;
  domain: TreeDomain;
  roots: Root[];
  trunk: TrunkNode[];
  branches: Branch[];
  leaves: Leaf[];
  fruits: Fruit[];
  ethical_constraints: EthicalConstraints;
  audit_stamp_id?: string;
  last_audited_at?: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
//  Community types
// ─────────────────────────────────────────────

export type TerritoryZone =
  | 'arrivals_departures'
  | 'civic_centre'
  | 'commonwealth'
  | 'science_fair';

export interface Territory {
  id: string;
  name: string;
  zone: TerritoryZone;
  seek_question: string;
  tech_tool: string;
  pipeline: string[];
  tagline: string;
  land_type: 'landscape' | 'wasteland';
  real_estate_status: 'placeholder' | 'active' | 'archived';
}

export interface EpistemicCard {
  id: string;
  territory_id: string;
  position: number;
  claim: string;
  evidence: {
    source: string;
    url: string;
    credibility_score: number;
  }[];
  possible_worlds_note: string;
  challenge_question: string;
  required_action: {
    id: string;
    description: string;
    verification: 'self_reported' | 'photo' | 'peer_review';
    reward: {
      train_station_unlock: boolean;
      citizenship_points: number;
    };
  };
  waldconsistency_precheck?: AuditResult;
  created_by: string;
  status: 'draft' | 'review' | 'published' | 'archived';
}

export type CitizenType = 'crowdster' | 'curator' | 'creator' | 'copilot';

export interface TotemicCharacter {
  id: string;
  user_id: string;
  name: string;
  base_form: string;
  attributes: {
    curiosity: number;
    solidarity: number;
    rootedness: number;
    reach: number;
  };
  shaped_by: {
    territories: string[];
    actions_completed: string[];
    citizen_type: CitizenType;
    waldconsistency_avg: number;
  };
  visual: {
    silhouette: string;
    primary_colour: string;
    texture: string;
    emblem: string;
  };
  downloadable_svg?: string;
}

export interface PossibleWorldsFuture {
  id: string;
  author_id: string;
  title: string;
  description: string;
  territory_id: string;
  audit_stamp_id?: string;
  stakes: {
    user_id: string;
    what_they_risk: string;
    magnitude: number;
  }[];
  currency_value: number;
  shares: {
    user_id: string;
    share_pct: number;
  }[];
  options: {
    condition: string;
    action_if_triggered: string;
  }[];
  arrow_failure_flag: boolean;
  status: 'open' | 'closed' | 'traded' | 'expired';
}

// ─────────────────────────────────────────────
//  User
// ─────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  citizen_type: CitizenType;
  created_at: string;
}

// ─────────────────────────────────────────────
//  API Response wrapper
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error?: string;
}
