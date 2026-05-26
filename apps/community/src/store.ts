import { create } from 'zustand';
import type { Territory, EpistemicCard, TotemicCharacter, PossibleWorldsFuture, TrainStationResource } from './types';
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

  setEntryText: (text) => set({ entryText: text }),
}));
