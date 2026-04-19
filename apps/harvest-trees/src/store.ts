import { create } from 'zustand';
import type { HarvestTree, LayerName } from './types';
import { treeApi } from './api';
import { MOCK_TREE } from './mockData';

interface HarvestTreeStore {
  currentTree: HarvestTree | null;
  userTrees: HarvestTree[];
  activeLayer: LayerName;
  activeLenses: string[];
  loading: boolean;
  error: string | null;

  setActiveLayer: (layer: LayerName) => void;
  toggleLens: (lens: string) => void;
  createTree: (domain: string, title: string) => Promise<HarvestTree>;
  loadTree: (id: string) => Promise<void>;
  updateLayer: (id: string, layer: LayerName, nodes: unknown[]) => Promise<void>;
  loadUserTrees: (userId: string) => Promise<void>;
  setCurrentTree: (tree: HarvestTree) => void;
}

let mockIdCounter = 100;

function generateMockId(prefix: string): string {
  return `${prefix}-${++mockIdCounter}`;
}

function buildMockTree(domain: string, title: string): HarvestTree {
  const now = new Date().toISOString();
  return {
    ...MOCK_TREE,
    id: generateMockId('tree'),
    domain: domain as HarvestTree['domain'],
    title,
    roots: [],
    trunk: [],
    branches: [],
    leaves: [],
    fruits: [],
    created_at: now,
    updated_at: now,
  };
}

export const useHarvestStore = create<HarvestTreeStore>((set, get) => ({
  currentTree: null,
  userTrees: [],
  activeLayer: 'roots',
  activeLenses: [],
  loading: false,
  error: null,

  setActiveLayer: (layer) => set({ activeLayer: layer }),

  toggleLens: (lens) => {
    const current = get().activeLenses;
    if (current.includes(lens)) {
      set({ activeLenses: current.filter((l) => l !== lens) });
    } else {
      set({ activeLenses: [...current, lens] });
    }
  },

  setCurrentTree: (tree) => set({ currentTree: tree }),

  createTree: async (domain, title) => {
    set({ loading: true, error: null });
    try {
      const res = await treeApi.create(domain, title);
      const tree = res.data.data;
      set((state) => ({
        currentTree: tree,
        userTrees: [...state.userTrees, tree],
        loading: false,
      }));
      return tree;
    } catch {
      const mockTree = buildMockTree(domain, title);
      set((state) => ({
        currentTree: mockTree,
        userTrees: [...state.userTrees, mockTree],
        loading: false,
      }));
      return mockTree;
    }
  },

  loadTree: async (id) => {
    set({ loading: true, error: null });
    if (id === MOCK_TREE.id || id === 'mock') {
      set({ currentTree: MOCK_TREE, loading: false });
      return;
    }
    try {
      const res = await treeApi.getTree(id);
      set({ currentTree: res.data.data, loading: false });
    } catch {
      // Fall back to mock if id matches or provide demo data
      const existing = get().userTrees.find((t) => t.id === id);
      if (existing) {
        set({ currentTree: existing, loading: false });
      } else {
        set({ currentTree: MOCK_TREE, loading: false });
      }
    }
  },

  updateLayer: async (id, layer, nodes) => {
    set({ loading: true, error: null });
    try {
      const res = await treeApi.updateLayer(id, layer, nodes);
      set({ currentTree: res.data.data, loading: false });
    } catch {
      // Update locally without backend
      const tree = get().currentTree;
      if (tree) {
        const updated: HarvestTree = {
          ...tree,
          [layer]: nodes,
          updated_at: new Date().toISOString(),
        };
        set({ currentTree: updated, loading: false });
        // Also update in userTrees
        set((state) => ({
          userTrees: state.userTrees.map((t) => (t.id === id ? updated : t)),
        }));
      } else {
        set({ loading: false });
      }
    }
  },

  loadUserTrees: async (userId) => {
    set({ loading: true, error: null });
    try {
      const res = await treeApi.getUserTrees(userId);
      set({ userTrees: res.data.data, loading: false });
    } catch {
      // Fall back to mock data with demo trees
      set({ userTrees: [MOCK_TREE], loading: false });
    }
  },
}));
