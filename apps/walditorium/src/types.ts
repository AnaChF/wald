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

export interface AuditSession {
  id: string;
  user_id: string;
  input: { type: 'text' | 'pdf' | 'url'; content: string; source_url?: string };
  agent_context?: { description: string; known_beliefs: string[] };
  bolts: BOLT[];
  nuts: NUT[];
  bricks: BRICK[];
  audit_result?: AuditResult;
  stamp_image_url?: string;
  regenerative_plan_id?: string;
  visibility: 'private' | 'shared' | 'public';
  created_at: string;
}

export interface RegenerativePlan {
  layers: {
    roots: Array<{ id: string; text: string; failure_level: string; action: string }>;
    trunk: Array<{ id: string; text: string; failure_level: string; action: string }>;
    branches: Array<{ id: string; text: string; failure_level: string; action: string }>;
    leaves: Array<{ id: string; text: string; failure_level: string; action: string }>;
    fruits: Array<{ id: string; text: string; failure_level: string; action: string }>;
  };
}
