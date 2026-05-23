export type LogicType = 'deductive' | 'inductive' | 'abductive';
export type SignalStrength = 'strong' | 'weak' | 'wildcard';
export type CWClass = 'W' | 'C' | 'mixed';
export type ConeLayer = 'possible' | 'plausible' | 'probable' | 'projected' | 'preferable';
export type HarvestLayer = 'roots' | 'trunk' | 'branches' | 'leaves' | 'fruits';
export type SessionVisibility = 'private' | 'shared' | 'submitted';

export interface CanopySession {
  id: string;
  user_id: string;
  title: string | null;
  foresight_question: string | null;
  audit_result_seed: AuditResultSeed | null;
  brick_seed: CLAData | null;
  centre_description: string | null;
  status: string;
  visibility: SessionVisibility;
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditResultSeed {
  bolts?: AuditBolt[];
  nuts?: AuditNut[];
  bricks?: AuditBrick[];
  futures_triangle?: FuturesTriangle;
}

export interface AuditBolt { id: string; claim: string; }
export interface AuditNut { id: string; uncertainty: string; }
export interface AuditBrick { id: string; description: string; }

export interface Signal {
  id: string;
  session_id: string;
  user_id: string;
  text: string;
  source: string | null;
  domain: string | null;
  logic_type: LogicType | null;
  strength: SignalStrength | null;
  cw_class: CWClass | null;
  classifier_rationale: string | null;
  linked_bolts: string[];
  futures_cone_layer: ConeLayer | null;
  canvas_x: number;
  canvas_y: number;
  created_at: string;
}

export interface ClassificationResult {
  logic_type: LogicType;
  strength: SignalStrength;
  domain: string;
  cw_classification: CWClass;
  linked_bolt_ids: string[];
  rationale: { logic_type: string; strength: string; domain: string; cw_classification: string };
}

export interface Scenario {
  id: string;
  session_id: string;
  horizon_id: string | null;
  title: string;
  narrative: string | null;
  critical_uncertainties: string[];
  consistency_certified: boolean;
  iia_pass: boolean;
  arrow_failure_flag: boolean;
  cw_map: CWMap | null;
  cla_incast: CLAIncast | null;
  relaxed_arrow_condition: string | null;
  relaxation_rationale: string | null;
  created_at: string;
}

export interface CWMap {
  w_elements: { text: string; confidence: number }[];
  c_elements: { text: string; centre_id: string; confidence: number }[];
}

export interface CLAIncast {
  litany: string;
  systemic: string;
  worldview: string;
  metaphor: string;
  dominant_centre: string | null;
}

export interface ScenarioAuditResult {
  consistency_pass: boolean;
  iia_pass: boolean;
  internal_contradictions: string[];
  cw_map: CWMap;
  cla_incast: CLAIncast;
  arrow_failure_flag: boolean;
}

export interface Forecast {
  id: string;
  session_id: string;
  scenario_id: string | null;
  preferred_horizon_id: string | null;
  time_horizon_years: number;
  milestones: Milestone[];
  decision_gates: DecisionGate[];
  earliest_decisions: string[];
  harvest_tree_seeds: HarvestSeed[];
  early_indicators: EarlyIndicator[];
  created_at: string;
}

export interface Milestone {
  id: string;
  year_offset: number;
  description: string;
  type: 'decision' | 'event' | 'condition';
  is_gate: boolean;
  harvest_tree_layer: HarvestLayer | null;
}

export interface DecisionGate {
  milestone_id: string;
  if_yes_path: string;
  if_no_path: string;
  decision_window_months: number;
}

export interface HarvestSeed {
  layer: string;
  text: string;
  linked_milestone_id: string;
}

export interface EarlyIndicator {
  label: string;
  status: 'quiet' | 'stirring' | 'firing' | 'contradicted';
}

export interface CLAData {
  litany: string;
  systemic: string;
  worldview: string;
  metaphor: string;
  centre_attributions: CentreAttribution[];
}

export interface CentreAttribution {
  name: string;
  role: string;
}

export interface FuturesTriangle {
  push: string[];
  weight: string[];
  pull: string[];
  tensions?: Tension[];
}

export interface Tension {
  type: 'pull-weight' | 'push-pull' | 'push-weight';
  description: string;
  magnitude: 'low' | 'medium' | 'high';
  signal_ids: string[];
}

export interface StepStatus {
  step: number;
  label: string;
  route: string;
  complete: boolean;
}
