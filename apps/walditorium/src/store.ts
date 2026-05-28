import { create } from 'zustand';
import type { AuditSession, RegenerativePlan } from './types';
import { auditApi } from './api';
import { MOCK_SESSION, MOCK_PLAN } from './mockData';

const LS_KEY = 'wald_session_ids';

function savedIds(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as string[]; } catch { return []; }
}

function saveId(id: string) {
  const ids = savedIds();
  if (!ids.includes(id)) {
    ids.unshift(id);
    localStorage.setItem(LS_KEY, JSON.stringify(ids.slice(0, 50)));
  }
}

interface AuditStore {
  currentSession: AuditSession | null;
  sessions: AuditSession[];
  regenerativePlan: RegenerativePlan | null;
  loading: boolean;
  error: string | null;
  stage: 'idle' | 'extracting' | 'anatomy' | 'running' | 'complete';
  useMock: boolean;

  submitAudit: (input: { type: string; content: string }, agentContext?: unknown) => Promise<string>;
  runAudit: (sessionId: string) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  loadMyStamps: () => Promise<void>;
  generatePlan: (sessionId: string) => Promise<void>;
  setStage: (stage: AuditStore['stage']) => void;
}

export const useAuditStore = create<AuditStore>((set, get) => ({
  currentSession: null,
  sessions: [],
  regenerativePlan: null,
  loading: false,
  error: null,
  stage: 'idle',
  useMock: true,

  submitAudit: async (input, agentContext) => {
    set({ loading: true, error: null, stage: 'extracting' });
    try {
      const res = await auditApi.submit(input, agentContext);
      const session = res.data.data;
      saveId(session.id);
      set((s) => ({
        currentSession: session,
        sessions: [session, ...s.sessions.filter((x) => x.id !== session.id)],
        loading: false,
        stage: 'anatomy',
        useMock: false,
      }));
      return session.id;
    } catch {
      const mockSession: AuditSession = {
        ...MOCK_SESSION,
        id: 'mock-' + Date.now(),
        input: { ...MOCK_SESSION.input, content: input.content, type: input.type as 'text' | 'pdf' | 'url' },
      };
      set({ currentSession: mockSession, loading: false, stage: 'anatomy', useMock: true });
      return mockSession.id;
    }
  },

  runAudit: async (sessionId) => {
    set({ loading: true, stage: 'running' });
    try {
      const res = await auditApi.runAudit(sessionId);
      const session = res.data.data;
      set((s) => ({
        currentSession: session,
        sessions: s.sessions.map((x) => (x.id === sessionId ? session : x)),
        loading: false,
        stage: 'complete',
        useMock: false,
      }));
    } catch {
      const session = get().currentSession;
      if (session) {
        const updated = { ...session, audit_result: MOCK_SESSION.audit_result };
        set((s) => ({
          currentSession: updated,
          sessions: s.sessions.map((x) => (x.id === sessionId ? updated : x)),
          loading: false,
          stage: 'complete',
        }));
      }
    }
  },

  loadSession: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const res = await auditApi.getSession(sessionId);
      const session = res.data.data;
      set((s) => ({
        currentSession: session,
        sessions: s.sessions.some((x) => x.id === sessionId)
          ? s.sessions.map((x) => (x.id === sessionId ? session : x))
          : [session, ...s.sessions],
        loading: false,
      }));
    } catch {
      set({ currentSession: MOCK_SESSION, loading: false, error: 'Failed to load session' });
    }
  },

  loadMyStamps: async () => {
    const ids = savedIds();
    if (ids.length === 0) return;
    const results = await Promise.allSettled(ids.map((id) => auditApi.getSession(id)));
    const sessions: AuditSession[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') sessions.push(r.value.data.data);
    }
    set({ sessions });
  },

  generatePlan: async (sessionId) => {
    set({ loading: true, error: null });
    try {
      const res = await auditApi.getPlan(sessionId);
      set({ regenerativePlan: res.data.data, loading: false });
    } catch {
      set({ regenerativePlan: MOCK_PLAN, loading: false });
    }
  },

  setStage: (stage) => set({ stage }),
}));
