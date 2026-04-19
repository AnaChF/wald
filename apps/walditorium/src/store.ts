import { create } from 'zustand';
import type { AuditSession, RegenerativePlan } from './types';
import { auditApi } from './api';
import { MOCK_SESSION, MOCK_PLAN } from './mockData';

interface AuditStore {
  currentSession: AuditSession | null;
  regenerativePlan: RegenerativePlan | null;
  loading: boolean;
  error: string | null;
  stage: 'idle' | 'extracting' | 'anatomy' | 'running' | 'complete';
  useMock: boolean;

  submitAudit: (input: { type: string; content: string }, agentContext?: unknown) => Promise<string>;
  runAudit: (sessionId: string) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  generatePlan: (sessionId: string) => Promise<void>;
  setStage: (stage: AuditStore['stage']) => void;
}

export const useAuditStore = create<AuditStore>((set, get) => ({
  currentSession: null,
  regenerativePlan: null,
  loading: false,
  error: null,
  stage: 'idle',
  useMock: true,

  submitAudit: async (input, agentContext) => {
    set({ loading: true, error: null, stage: 'extracting' });
    try {
      const res = await auditApi.submit(input, agentContext);
      set({ currentSession: res.data.data, loading: false, stage: 'anatomy' });
      return res.data.data.id;
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
      set({ currentSession: res.data.data, loading: false, stage: 'complete' });
    } catch {
      const session = get().currentSession;
      if (session) {
        set({
          currentSession: { ...session, audit_result: MOCK_SESSION.audit_result },
          loading: false,
          stage: 'complete',
        });
      }
    }
  },

  loadSession: async (sessionId) => {
    set({ loading: true });
    try {
      const res = await auditApi.getSession(sessionId);
      set({ currentSession: res.data.data, loading: false });
    } catch {
      set({ currentSession: MOCK_SESSION, loading: false });
    }
  },

  generatePlan: async (sessionId) => {
    set({ loading: true });
    try {
      const res = await auditApi.getPlan(sessionId);
      set({ regenerativePlan: res.data.data, loading: false });
    } catch {
      set({ regenerativePlan: MOCK_PLAN, loading: false });
    }
  },

  setStage: (stage) => set({ stage }),
}));
