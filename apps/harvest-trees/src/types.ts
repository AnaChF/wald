export type LayerName = 'roots' | 'trunk' | 'branches' | 'leaves' | 'fruits';

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

export type Domain =
  | 'busyness_park'
  | 'parentown'
  | 'space_agency'
  | 'bond_street'
  | 'times_square'
  | 'studio_city'
  | 'custom';

export interface HarvestTree {
  id: string;
  user_id: string;
  title: string;
  domain: Domain;
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

export interface DomainInfo {
  id: Domain;
  name: string;
  tagline: string;
  icon: string;
  color: string;
}
