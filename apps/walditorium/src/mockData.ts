import type { AuditSession, RegenerativePlan } from './types';

export const MOCK_SESSION: AuditSession = {
  id: 'mock-session-001',
  user_id: 'user-001',
  input: {
    type: 'text',
    content: `The future of knowledge work is being fundamentally reshaped by artificial intelligence. Within the next decade, most routine cognitive tasks — data analysis, report drafting, legal research, and code generation — will be performed more accurately and efficiently by AI systems than by human workers. This is not a speculative claim but an observable trajectory confirmed by current performance benchmarks.

Knowledge workers who thrive in this new environment will be those who develop meta-cognitive skills: the ability to evaluate AI outputs critically, to frame problems precisely, and to integrate machine-generated insights with human judgment. The value of human cognition will shift from execution to curation and from computation to contextual understanding. Institutions that fail to restructure their knowledge workflows around this transition will face significant competitive disadvantage by 2035.

Therefore, educational institutions must immediately pivot their curricula away from technical skill transmission toward epistemic literacy, critical appraisal, and collaborative intelligence. Vocational training that still emphasises rote information retention or procedural mastery without AI fluency is already obsolete, and continuing to offer it represents a fundamental misalignment between institutional mission and societal need.`,
  },
  agent_context: {
    description: 'Technology futurist writing a policy brief on workforce adaptation',
    known_beliefs: [
      'AI will automate most routine cognitive work within 10 years',
      'Human value lies in judgment and contextualisation',
      'Educational reform is urgently needed',
    ],
  },
  bolts: [
    {
      id: 'bolt-001',
      text: 'AI systems will perform most routine cognitive tasks more accurately than humans within a decade.',
      c_intension: 'Empirical claim about near-future AI capability relative to human cognitive performance across a defined class of tasks.',
      w_intension: 'In all possible worlds where current AI development trajectories continue linearly, AI surpasses human performance on routine cognitive tasks by 2034.',
      waldconsistency: { CE: 58, CY: 72, CS: 80, L: 90, S: 85, CN: 78, K: 65, CR: 70 },
      is_brick: false,
    },
    {
      id: 'bolt-002',
      text: 'The value of human cognition will shift from execution to curation and from computation to contextual understanding.',
      c_intension: 'Normative-predictive claim about how the labour market will revalue different cognitive capacities.',
      w_intension: 'In worlds where AI automates execution, human comparative advantage necessarily migrates to higher-order meta-cognitive functions.',
      waldconsistency: { CE: 45, CY: 68, CS: 75, L: 82, S: 79, CN: 60, K: 55, CR: 62 },
      is_brick: false,
    },
    {
      id: 'bolt-003',
      text: 'Institutions that fail to restructure knowledge workflows will face significant competitive disadvantage by 2035.',
      c_intension: 'Causal-predictive claim linking institutional inaction to competitive outcomes within a specified timeframe.',
      w_intension: 'In worlds where AI adoption occurs and some institutions adapt while others do not, the non-adapting institutions suffer measurable competitive loss.',
      waldconsistency: { CE: 40, CY: 55, CS: 65, L: 75, S: 70, CN: 50, K: 45, CR: 52 },
      is_brick: true,
    },
    {
      id: 'bolt-004',
      text: 'Educational institutions must immediately pivot curricula toward epistemic literacy and collaborative intelligence.',
      c_intension: 'Normative imperative deriving an educational policy prescription from the preceding empirical and predictive claims.',
      w_intension: 'In all worlds where the descriptive claims hold, the normative prescription is obligatory for institutions with an educational mission.',
      waldconsistency: { CE: 35, CY: 60, CS: 70, L: 85, S: 80, CN: 55, K: 48, CR: 58 },
      is_brick: false,
    },
    {
      id: 'bolt-005',
      text: 'Vocational training emphasising rote retention without AI fluency is already obsolete.',
      c_intension: 'Categorical evaluative claim that a class of educational practice has ceased to fulfil its function.',
      w_intension: 'In worlds where AI fluency is a necessary condition for workforce effectiveness, any training omitting it is by definition insufficient.',
      waldconsistency: { CE: 50, CY: 62, CS: 72, L: 88, S: 83, CN: 65, K: 58, CR: 68 },
      is_brick: false,
    },
  ],
  nuts: [
    {
      id: 'nut-001',
      bolt_id: 'bolt-001',
      text: 'Current AI performance benchmarks are a reliable predictor of near-future real-world deployment.',
      type: 'assumption',
    },
    {
      id: 'nut-002',
      bolt_id: 'bolt-001',
      text: 'The class of "routine cognitive tasks" is well-defined and stable across the transition period.',
      type: 'premise',
    },
    {
      id: 'nut-003',
      bolt_id: 'bolt-002',
      text: 'Labour markets will efficiently price and reward meta-cognitive skills once execution is automated.',
      type: 'assumption',
    },
    {
      id: 'nut-004',
      bolt_id: 'bolt-002',
      text: 'Human contextual understanding is not itself automatable within the relevant timeframe.',
      type: 'premise',
    },
    {
      id: 'nut-005',
      bolt_id: 'bolt-003',
      text: 'Competitive advantage in knowledge industries is primarily determined by cognitive workflow efficiency.',
      type: 'assumption',
    },
    {
      id: 'nut-006',
      bolt_id: 'bolt-004',
      text: '"Immediate" pivot is feasible given institutional governance and accreditation cycles.',
      type: 'premise',
    },
    {
      id: 'nut-007',
      bolt_id: 'bolt-004',
      text: 'Epistemic literacy is teachable at scale within standard curriculum frameworks.',
      type: 'inference',
    },
    {
      id: 'nut-008',
      bolt_id: 'bolt-005',
      text: 'AI fluency will be a required competency across all vocational fields, not only knowledge-intensive ones.',
      type: 'assumption',
    },
  ],
  bricks: [
    {
      id: 'brick-001',
      bolt_id: 'bolt-001',
      text: 'The claim extrapolates from narrow benchmark performance to general cognitive task performance without accounting for the embodied, social, and tacit dimensions of real-world knowledge work.',
      resistance_type: 'logical',
      severity: 'high',
    },
    {
      id: 'brick-002',
      bolt_id: 'bolt-004',
      text: 'The normative imperative conflates "should restructure" with "must immediately restructure," imposing an urgency that the empirical evidence does not yet warrant and that ignores legitimate transition costs.',
      resistance_type: 'normative',
      severity: 'medium',
    },
  ],
  audit_result: {
    verdict: 'CONDITIONAL',
    cl_score: 72,
    sci_score: 68,
    waldconsistency: {
      CE: 46,
      CY: 63,
      CS: 72,
      L: 84,
      S: 79,
      CN: 62,
      K: 54,
      CR: 62,
    },
    failures: [
      {
        level: 'CE',
        bolt_id: 'bolt-001',
        description: 'Conceptual extension is insufficiently specified: "routine cognitive tasks" lacks a formal boundary, permitting unfalsifiable interpretation.',
        severity: 'moderate',
      },
      {
        level: 'K',
        bolt_id: 'bolt-003',
        description: 'Knowledge consistency is weak: the claim relies on competitive dynamics without citing documented precedents for comparable technological transitions.',
        severity: 'moderate',
      },
      {
        level: 'CY',
        bolt_id: 'bolt-002',
        description: 'Causal yield is unverified: the assumed migration of human value to meta-cognition presupposes labour market rationality that historical data does not consistently support.',
        severity: 'minor',
      },
    ],
    timestamp: '2026-04-19T10:30:00Z',
  },
  visibility: 'private',
  created_at: '2026-04-19T10:00:00Z',
};

export const MOCK_PLAN: RegenerativePlan = {
  layers: {
    roots: [
      {
        id: 'root-001',
        text: 'CE failure in bolt-001: Under-specified conceptual extension',
        failure_level: 'CE',
        action: 'Define "routine cognitive task" with a formal operational taxonomy referencing O*NET or equivalent skills framework.',
      },
      {
        id: 'root-002',
        text: 'K failure in bolt-003: Insufficient knowledge grounding',
        failure_level: 'K',
        action: 'Cite documented competitive outcomes from prior automation waves (e.g., industrial robotics, accounting software) to ground the competitive-disadvantage claim.',
      },
    ],
    trunk: [
      {
        id: 'trunk-001',
        text: 'CY weakness in bolt-002: Causal yield not demonstrated',
        failure_level: 'CY',
        action: 'Introduce a qualified claim acknowledging conditions under which labour markets may fail to price meta-cognitive skills correctly, and cite supporting economic literature.',
      },
      {
        id: 'trunk-002',
        text: 'Overall trajectory claim requires uncertainty quantification',
        failure_level: 'CS',
        action: 'Replace "observable trajectory" with a probabilistic statement and cite benchmark studies with confidence intervals.',
      },
    ],
    branches: [
      {
        id: 'branch-001',
        text: 'Normative urgency in bolt-004 outpaces evidential warrant',
        failure_level: 'CN',
        action: 'Reframe the policy prescription as a phased recommendation with trigger conditions rather than an immediate imperative.',
      },
      {
        id: 'branch-002',
        text: 'bolt-005 overgeneralises across all vocational domains',
        failure_level: 'CE',
        action: 'Restrict the claim to knowledge-intensive vocational fields or provide domain-by-domain analysis of AI fluency requirements.',
      },
    ],
    leaves: [
      {
        id: 'leaf-001',
        text: 'Strengthen the argument for epistemic literacy as teachable at scale',
        failure_level: 'K',
        action: 'Reference existing epistemic literacy curricula (e.g., Stanford History Education Group, SIFT method) to demonstrate feasibility.',
      },
      {
        id: 'leaf-002',
        text: 'Acknowledge counter-evidence on AI reliability in high-stakes tasks',
        failure_level: 'CR',
        action: 'Add a section on AI failure modes, hallucination rates, and contexts where human oversight remains essential.',
      },
    ],
    fruits: [
      {
        id: 'fruit-001',
        text: 'Revised thesis: A grounded, conditional claim about AI and knowledge work',
        failure_level: 'L',
        action: 'Restate the central thesis with explicit conditions, confidence levels, and scope limitations, elevating it to a GROUNDED verdict.',
      },
      {
        id: 'fruit-002',
        text: 'Policy brief is strengthened with empirical scaffolding',
        failure_level: 'S',
        action: 'Present the brief to a peer epistemic review process before submission to policy audiences.',
      },
    ],
  },
};
