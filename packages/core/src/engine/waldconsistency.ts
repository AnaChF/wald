import {
  BOLT,
  NUT,
  BRICK,
  WaldconsistencyScore,
  WaldconsistencyLevel,
  AuditResult,
  AuditFailure,
  Verdict,
} from '../types/index';

const RELATIONAL_KEYWORDS = [
  'implies',
  'relates',
  'connects',
  'affects',
  'influences',
  'depends',
  'causes',
  'requires',
  'entails',
  'enables',
  'supports',
  'undermines',
  'with',
  'between',
  'among',
  'toward',
  'relative',
  'context',
];

// ─────────────────────────────────────────────
//  Individual level scorers
// ─────────────────────────────────────────────

function scoreCE(bolts: BOLT[]): number {
  if (bolts.length === 0) return 0;
  const withCIntension = bolts.filter(
    (b) => b.c_intension && b.c_intension.trim().length > 0,
  ).length;
  return (withCIntension / bolts.length) * 100;
}

function scoreCY(bolts: BOLT[]): number {
  if (bolts.length === 0) return 0;
  const withWIntension = bolts.filter(
    (b) => b.w_intension && b.w_intension.trim().length > 0,
  ).length;
  return (withWIntension / bolts.length) * 100;
}

function scoreCS(bolts: BOLT[], nuts: NUT[]): number {
  if (bolts.length === 0) return 0;
  // Ideal: at least 3 NUTs per BOLT
  const nutsPerBolt = nuts.length / bolts.length;
  const normalised = Math.min(nutsPerBolt / 3, 1);
  return normalised * 100;
}

function scoreL(bolts: BOLT[], bricks: BRICK[]): number {
  if (bolts.length === 0) return 100;
  const criticalBricks = bricks.filter(
    (b) => b.resistance_type === 'logical' && b.severity === 'high',
  ).length;
  return Math.max(0, 100 - (criticalBricks / bolts.length) * 100);
}

function scoreS(bolts: BOLT[]): number {
  if (bolts.length === 0) return 0;
  let total = 0;
  for (const bolt of bolts) {
    const len = bolt.c_intension.trim().length;
    if (len >= 20 && len <= 100) {
      total += 100;
    } else if (len > 100) {
      // Slightly long but still ok, degrade gently
      total += Math.max(60, 100 - (len - 100) * 0.4);
    } else {
      // Very short — likely vague
      total += Math.max(0, len * 5);
    }
  }
  return total / bolts.length;
}

function scoreCN(bricks: BRICK[]): number {
  if (bricks.length === 0) return 100;
  const normativeBricks = bricks.filter(
    (b) => b.resistance_type === 'normative',
  ).length;
  return Math.max(0, 100 - (normativeBricks / bricks.length) * 50);
}

function scoreK(nuts: NUT[]): number {
  if (nuts.length === 0) return 0;
  const withContent = nuts.filter((n) => n.text && n.text.trim().length > 0).length;
  return (withContent / nuts.length) * 100;
}

function scoreCR(bolts: BOLT[]): number {
  if (bolts.length === 0) return 0;
  let total = 0;
  for (const bolt of bolts) {
    const lower = bolt.w_intension.toLowerCase();
    const hasRelational = RELATIONAL_KEYWORDS.some((kw) => lower.includes(kw));
    total += hasRelational ? 100 : 30;
  }
  return total / bolts.length;
}

// ─────────────────────────────────────────────
//  Main scoring function
// ─────────────────────────────────────────────

export function scoreWaldconsistency(
  bolts: BOLT[],
  nuts: NUT[],
  bricks: BRICK[],
): WaldconsistencyScore {
  return {
    CE: Math.round(scoreCE(bolts) * 100) / 100,
    CY: Math.round(scoreCY(bolts) * 100) / 100,
    CS: Math.round(scoreCS(bolts, nuts) * 100) / 100,
    L: Math.round(scoreL(bolts, bricks) * 100) / 100,
    S: Math.round(scoreS(bolts) * 100) / 100,
    CN: Math.round(scoreCN(bricks) * 100) / 100,
    K: Math.round(scoreK(nuts) * 100) / 100,
    CR: Math.round(scoreCR(bolts) * 100) / 100,
  };
}

// ─────────────────────────────────────────────
//  CL — Conceptual Loyalty
// ─────────────────────────────────────────────

export function computeCL(
  bolts: BOLT[],
  auditResult: Partial<AuditResult>,
): number {
  if (bolts.length === 0) return 0;

  if (auditResult.waldconsistency) {
    const scores = Object.values(auditResult.waldconsistency) as number[];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(avg * 100) / 100;
  }

  // Fallback: ratio of non-brick BOLTs
  const intact = bolts.filter((b) => !b.is_brick).length;
  return Math.round((intact / bolts.length) * 100 * 100) / 100;
}

// ─────────────────────────────────────────────
//  SCI — Systemic Coherence Index
// ─────────────────────────────────────────────

export function computeSCI(
  waldconsistency: WaldconsistencyScore,
  _bricks: BRICK[],
): number {
  const weighted =
    waldconsistency.CE * 0.15 +
    waldconsistency.CY * 0.15 +
    waldconsistency.CS * 0.1 +
    waldconsistency.L * 0.2 +
    waldconsistency.S * 0.1 +
    waldconsistency.CN * 0.1 +
    waldconsistency.K * 0.1 +
    waldconsistency.CR * 0.1;
  return Math.round(weighted * 100) / 100;
}

// ─────────────────────────────────────────────
//  Verdict
// ─────────────────────────────────────────────

export function determineVerdict(
  cl: number,
  sci: number,
  _waldconsistency: WaldconsistencyScore,
): Verdict {
  if (cl >= 85 && sci >= 80) return 'GROUNDED';
  if (cl >= 65 && sci >= 60) return 'CONDITIONAL';
  if (cl >= 45 || sci >= 45) return 'CONTESTED';
  return 'UNGROUNDED';
}

// ─────────────────────────────────────────────
//  Failure detection
// ─────────────────────────────────────────────

function collectFailures(
  bolts: BOLT[],
  nuts: NUT[],
  bricks: BRICK[],
  waldconsistency: WaldconsistencyScore,
): AuditFailure[] {
  const failures: AuditFailure[] = [];

  const threshold: Record<WaldconsistencyLevel, number> = {
    CE: 70,
    CY: 70,
    CS: 50,
    L: 60,
    S: 50,
    CN: 60,
    K: 50,
    CR: 40,
  };

  const descriptions: Record<WaldconsistencyLevel, string> = {
    CE: 'Insufficient conceptual definitions (c_intension) across BOLTs',
    CY: 'BOLTs lack world-referring definitions (w_intension)',
    CS: 'NUT support per BOLT is below the stable threshold (3 per BOLT)',
    L: 'Logical contradictions detected via high-severity logical BRICKs',
    S: 'Semantic definitions are too vague or overly verbose',
    CN: 'High proportion of normative claims without empirical grounding',
    K: 'Knowledge support (NUT content) is insufficient',
    CR: 'BOLTs lack relational framing in their world-referring definitions',
  };

  for (const level of Object.keys(waldconsistency) as WaldconsistencyLevel[]) {
    const score = waldconsistency[level];
    if (score < threshold[level]) {
      const severity: AuditFailure['severity'] =
        score < 30 ? 'critical' : score < 55 ? 'moderate' : 'minor';
      failures.push({
        level,
        description: descriptions[level],
        severity,
      });
    }
  }

  // Per-BOLT failures for missing intensions
  for (const bolt of bolts) {
    if (!bolt.c_intension || bolt.c_intension.trim().length === 0) {
      failures.push({
        level: 'CE',
        bolt_id: bolt.id,
        description: `BOLT "${bolt.text.slice(0, 60)}" has no conceptual definition`,
        severity: 'critical',
      });
    }
    if (!bolt.w_intension || bolt.w_intension.trim().length === 0) {
      failures.push({
        level: 'CY',
        bolt_id: bolt.id,
        description: `BOLT "${bolt.text.slice(0, 60)}" has no world-referring definition`,
        severity: 'moderate',
      });
    }
  }

  // Per-BRICK failures
  for (const brick of bricks) {
    if (brick.severity === 'high') {
      failures.push({
        level: brick.resistance_type === 'logical' ? 'L' : brick.resistance_type === 'normative' ? 'CN' : 'K',
        bolt_id: brick.bolt_id,
        description: `High-severity ${brick.resistance_type} BRICK: "${brick.text.slice(0, 80)}"`,
        severity: 'critical',
      });
    }
  }

  // Deduplicate by description
  const seen = new Set<string>();
  return failures.filter((f) => {
    const key = `${f.level}:${f.bolt_id ?? ''}:${f.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─────────────────────────────────────────────
//  Full audit pipeline
// ─────────────────────────────────────────────

export function runAuditPipeline(
  bolts: BOLT[],
  nuts: NUT[],
  bricks: BRICK[],
): AuditResult {
  const waldconsistency = scoreWaldconsistency(bolts, nuts, bricks);
  const failures = collectFailures(bolts, nuts, bricks, waldconsistency);

  const partialResult: Partial<AuditResult> = { waldconsistency };
  const cl_score = computeCL(bolts, partialResult);
  const sci_score = computeSCI(waldconsistency, bricks);
  const verdict = determineVerdict(cl_score, sci_score, waldconsistency);

  return {
    verdict,
    cl_score,
    sci_score,
    waldconsistency,
    failures,
    timestamp: new Date().toISOString(),
  };
}
