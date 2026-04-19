import type { HarvestTree, DomainInfo } from './types';

export const MOCK_TREE: HarvestTree = {
  id: 'mock-tree-001',
  user_id: 'mock-user-001',
  title: 'My Busyness Park Tree',
  domain: 'busyness_park',
  roots: [
    {
      id: 'root-001',
      type: 'value',
      text: 'Economic security above exploitation',
      waldconsistency_level: 'CE',
      is_negotiable: false,
    },
    {
      id: 'root-002',
      type: 'commitment',
      text: 'Professional integrity',
      waldconsistency_level: 'CE',
      is_negotiable: false,
    },
    {
      id: 'root-003',
      type: 'value',
      text: 'Work that serves people',
      waldconsistency_level: 'CY',
      is_negotiable: true,
    },
  ],
  trunk: [
    {
      id: 'trunk-001',
      text: 'Career grounded in clear values',
      waldconsistency_level: 'CS',
      supports_roots: ['root-001', 'root-002', 'root-003'],
    },
    {
      id: 'trunk-002',
      text: 'Sustainable income without soul compromise',
      waldconsistency_level: 'L',
      supports_roots: ['root-001', 'root-003'],
    },
  ],
  branches: [
    {
      id: 'branch-001',
      territory: 'Busyness Park',
      text: 'Employment choices aligned with values',
      waldconsistency_level: 'S',
      linked_trunk: ['trunk-001'],
    },
    {
      id: 'branch-002',
      territory: 'Bond Street',
      text: 'Financial independence strategy',
      waldconsistency_level: 'S',
      linked_trunk: ['trunk-002'],
    },
    {
      id: 'branch-003',
      territory: 'Studio City',
      text: 'Creative work that nourishes',
      waldconsistency_level: 'CN',
      linked_trunk: ['trunk-001', 'trunk-002'],
    },
  ],
  leaves: [
    {
      id: 'leaf-001',
      practice: 'Review one decision against my values',
      frequency: 'daily',
      waldconsistency_level: 'K',
      branch_id: 'branch-001',
    },
    {
      id: 'leaf-002',
      practice: 'Assess financial health without anxiety',
      frequency: 'weekly',
      waldconsistency_level: 'K',
      branch_id: 'branch-002',
    },
    {
      id: 'leaf-003',
      practice: 'Creative project time (min 2hrs)',
      frequency: 'weekly',
      waldconsistency_level: 'K',
      branch_id: 'branch-003',
    },
    {
      id: 'leaf-004',
      practice: 'Talk to mentor when stuck',
      frequency: 'as_needed',
      waldconsistency_level: 'K',
      branch_id: 'branch-001',
    },
  ],
  fruits: [
    {
      id: 'fruit-001',
      outcome: 'Financial independence by 40',
      visibility: 'private',
      waldconsistency_level: 'CR',
      measured_by: 'Savings rate > 30%',
      leaf_ids: ['leaf-001', 'leaf-002'],
    },
    {
      id: 'fruit-002',
      outcome: 'Work I can describe honestly to my children',
      visibility: 'shared',
      waldconsistency_level: 'CR',
      measured_by: 'Could I explain this proudly?',
      leaf_ids: ['leaf-001', 'leaf-003', 'leaf-004'],
    },
  ],
  ethical_constraints: {
    freedom:
      'I will not accept work that requires me to mislead others or suppress my judgment. My autonomy is non-negotiable even when economic pressure mounts.',
    responsibility:
      'I am responsible for the downstream effects of my professional output. I will not externalise harm to clients, colleagues, or communities to protect my income.',
    authenticity:
      'My professional persona must match my private values. I will not perform enthusiasm for work I find ethically hollow.',
    solidarity:
      'I will use my economic security to advocate for those with less professional leverage, not to distance myself from collective struggle.',
    refusal_of_abandonment:
      'I will not abandon colleagues or clients mid-process for personal gain. Commitments made are commitments kept, or clearly renegotiated.',
  },
  created_at: '2026-01-15T09:00:00Z',
  updated_at: '2026-04-19T14:30:00Z',
};

export const DOMAIN_INFO: DomainInfo[] = [
  {
    id: 'busyness_park',
    name: 'Busyness Park',
    tagline: 'Work, career, and livelihood choices',
    icon: '🏢',
    color: '#c9940a',
  },
  {
    id: 'parentown',
    name: 'Parentown',
    tagline: 'Family, parenting, and domestic life',
    icon: '🏡',
    color: '#4a6741',
  },
  {
    id: 'space_agency',
    name: 'Space Agency',
    tagline: 'Inner life, growth, and self-knowledge',
    icon: '🚀',
    color: '#5c3d00',
  },
  {
    id: 'bond_street',
    name: 'Bond Street',
    tagline: 'Money, resources, and financial life',
    icon: '💰',
    color: '#3d2b00',
  },
  {
    id: 'times_square',
    name: 'Times Square',
    tagline: 'Social life, community, and relationships',
    icon: '🌐',
    color: '#6b4226',
  },
  {
    id: 'studio_city',
    name: 'Studio City',
    tagline: 'Creativity, expression, and making',
    icon: '🎨',
    color: '#7a5c3d',
  },
  {
    id: 'custom',
    name: 'Custom Domain',
    tagline: 'Define your own life territory',
    icon: '✨',
    color: '#2c1a00',
  },
];
