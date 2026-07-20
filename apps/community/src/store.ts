import { create } from 'zustand';
import type { Territory, EpistemicCard, TotemicCharacter, PossibleWorldsFuture, TrainStationResource, ForumPost } from './types';
import { communityApi } from './api';
import { MOCK_TERRITORIES, MOCK_CARDS, MOCK_CHARACTER, MOCK_FUTURES, MOCK_RESOURCES } from './mockData';

interface CommunityStore {
  territories: Territory[];
  currentTerritory: Territory | null;
  cards: EpistemicCard[];
  currentCardIndex: number;
  completedActions: string[];
  totemicCharacter: TotemicCharacter | null;
  futures: PossibleWorldsFuture[];
  resources: TrainStationResource[];
  posts: ForumPost[];
  journeyStage: number;
  loading: boolean;
  entryText: string;

  initStore: () => Promise<void>;
  setCurrentTerritory: (t: Territory) => void;
  loadCards: (territoryId: string) => Promise<void>;
  advanceCard: () => void;
  prevCard: () => void;
  completeAction: (actionId: string) => Promise<void>;
  loadResources: (territoryId: string) => Promise<void>;
  loadFutures: () => Promise<void>;
  submitFuture: (future: Partial<PossibleWorldsFuture>) => Promise<void>;
  addStake: (futureId: string, whatTheyRisk: string) => Promise<void>;
  loadPosts: (territoryId: string) => Promise<void>;
  submitPost: (territoryId: string, bolt: string, content: string) => Promise<void>;
  submitReply: (postId: string, content: string) => Promise<void>;
  setEntryText: (text: string) => void;
}

export const useStore = create<CommunityStore>((set, get) => ({
  territories: [],
  currentTerritory: null,
  cards: [],
  currentCardIndex: 0,
  completedActions: [],
  totemicCharacter: null,
  futures: [],
  resources: [],
  posts: [],
  journeyStage: 1,
  loading: false,
  entryText: '',

  initStore: async () => {
    set({ loading: true });
    try {
      const res = await communityApi.getTerritories();
      set({ territories: res.data.data || MOCK_TERRITORIES, loading: false });
    } catch {
      set({ territories: MOCK_TERRITORIES, totemicCharacter: MOCK_CHARACTER, loading: false });
    }
  },

  setCurrentTerritory: (territory) => {
    set({ currentTerritory: territory, currentCardIndex: 0, cards: [] });
  },

  loadCards: async (territoryId) => {
    set({ loading: true });
    try {
      const res = await communityApi.getCards(territoryId);
      set({ cards: res.data.data || MOCK_CARDS[territoryId] || [], loading: false });
    } catch {
      set({ cards: MOCK_CARDS[territoryId] || [], loading: false });
    }
  },

  advanceCard: () => {
    const { currentCardIndex, cards } = get();
    if (currentCardIndex < cards.length - 1) {
      set({ currentCardIndex: currentCardIndex + 1 });
    }
  },

  prevCard: () => {
    const { currentCardIndex } = get();
    if (currentCardIndex > 0) {
      set({ currentCardIndex: currentCardIndex - 1 });
    }
  },

  completeAction: async (actionId) => {
    set((s) => ({
      completedActions: [...s.completedActions, actionId],
      journeyStage: Math.max(s.journeyStage, 2),
    }));
    await communityApi.completeAction(actionId);
  },

  loadResources: async (territoryId) => {
    set({ loading: true });
    try {
      const res = await communityApi.getResources(territoryId);
      set({ resources: res.data.data || MOCK_RESOURCES.filter(r => r.territory_id === territoryId), loading: false });
    } catch {
      set({ resources: MOCK_RESOURCES.filter(r => r.territory_id === territoryId), loading: false });
    }
  },

  loadFutures: async () => {
    set({ loading: true });
    try {
      const res = await communityApi.getFutures();
      set({ futures: res.data.data || MOCK_FUTURES, loading: false });
    } catch {
      set({ futures: MOCK_FUTURES, loading: false });
    }
  },

  submitFuture: async (future) => {
    try {
      await communityApi.submitFuture(future);
    } catch { /* no-op */ }
    const newFuture: PossibleWorldsFuture = {
      id: Math.random().toString(36).slice(2),
      author_id: 'user-local',
      title: future.title || 'Unnamed Future',
      description: future.description || '',
      territory_id: future.territory_id || '',
      stakes: [],
      currency_value: 10,
      shares: [],
      options: [],
      arrow_failure_flag: false,
      status: 'open',
      ...future,
    } as PossibleWorldsFuture;
    set((s) => ({ futures: [newFuture, ...s.futures] }));
  },

  addStake: async (futureId, whatTheyRisk) => {
    const stake = { user_id: 'user-local', what_they_risk: whatTheyRisk, magnitude: 50 };
    try {
      await communityApi.addStake(futureId, stake);
    } catch { /* optimistic update always runs */ }
    set((s) => ({
      futures: s.futures.map((f) =>
        f.id === futureId
          ? { ...f, stakes: [...f.stakes, stake], currency_value: f.currency_value + 50 }
          : f,
      ),
    }));
  },

  loadPosts: async (territoryId) => {
    set({ loading: true });
    try {
      const res = await communityApi.getPosts(territoryId);
      set({ posts: res.data.data ?? [], loading: false });
    } catch {
      set({ posts: [], loading: false });
    }
  },

  submitPost: async (territoryId, bolt, content) => {
    const optimistic: ForumPost = {
      id: 'local-' + Math.random().toString(36).slice(2),
      territory_id: territoryId,
      author: 'You',
      bolt_claim: bolt,
      content,
      created_at: new Date().toISOString(),
      reply_count: 0,
      replies: [],
    };
    set((s) => ({ posts: [optimistic, ...s.posts] }));
    try {
      const res = await communityApi.submitPost(territoryId, { bolt_claim: bolt, content, author: 'Anonymous' });
      const saved = res.data.data as ForumPost;
      set((s) => ({ posts: s.posts.map((p) => (p.id === optimistic.id ? { ...saved, replies: [], reply_count: 0 } : p)) }));
    } catch { /* optimistic post stays */ }
  },

  submitReply: async (postId, content) => {
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId
          ? { ...p, reply_count: p.reply_count + 1, replies: [...p.replies, { id: 'local-' + Math.random().toString(36).slice(2), post_id: postId, author: 'You', content, created_at: new Date().toISOString() }] }
          : p,
      ),
    }));
    try {
      await communityApi.submitReply(postId, { content, author: 'Anonymous' });
    } catch { /* optimistic reply stays */ }
  },

  setEntryText: (text) => set({ entryText: text }),
}));
