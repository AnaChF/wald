export type CitizenType = 'crowdster' | 'curator' | 'creator' | 'copilot';
export type Zone = 'arrivals_departures' | 'civic_centre' | 'commonwealth' | 'science_fair';

export interface Territory {
  id: string;
  name: string;
  zone: Zone;
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
  evidence: { source: string; url: string; credibility_score: number }[];
  possible_worlds_note: string;
  challenge_question: string;
  required_action: {
    id: string;
    description: string;
    verification: 'self_reported' | 'photo' | 'peer_review';
    reward: { train_station_unlock: boolean; citizenship_points: number };
  };
  created_by: string;
  status: 'draft' | 'review' | 'published' | 'archived';
}

export interface TotemicCharacter {
  id: string;
  user_id: string;
  name: string;
  base_form: string;
  attributes: { curiosity: number; solidarity: number; rootedness: number; reach: number };
  shaped_by: {
    territories: string[];
    actions_completed: string[];
    citizen_type: CitizenType;
    waldconsistency_avg: number;
  };
  visual: { silhouette: string; primary_colour: string; texture: string; emblem: string };
  downloadable_svg?: string;
}

export interface PossibleWorldsFuture {
  id: string;
  author_id: string;
  title: string;
  description: string;
  territory_id: string;
  stakes: { user_id: string; what_they_risk: string; magnitude: number }[];
  currency_value: number;
  shares: { user_id: string; share_pct: number }[];
  options: { condition: string; action_if_triggered: string }[];
  arrow_failure_flag: boolean;
  status: 'open' | 'closed' | 'traded' | 'expired';
}

export interface User {
  id: string;
  email: string;
  username: string;
  citizen_type: CitizenType;
  created_at: string;
}

export interface TrainStationResource {
  id: string;
  territory_id: string;
  title: string;
  type: 'pdf' | 'audio' | 'video' | 'ebook' | 'article';
  url: string;
  waldconsistency_level: string;
  description: string;
  is_locked: boolean;
}

export interface ForumPost {
  id: string;
  territory_id: string;
  author: string;
  bolt_claim: string;
  content: string;
  created_at: string;
  reply_count: number;
  replies: ForumReply[];
}

export interface ForumReply {
  id: string;
  post_id: string;
  author: string;
  content: string;
  created_at: string;
}
