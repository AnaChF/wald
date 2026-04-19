import axios from 'axios';
import type { AuditSession, RegenerativePlan } from './types';

const api = axios.create({ baseURL: '/api' });

export const auditApi = {
  submit: (input: { type: string; content: string }, agentContext?: unknown) =>
    api.post<{ data: AuditSession }>('/audit/submit', { input, agent_context: agentContext }),

  getSession: (id: string) =>
    api.get<{ data: AuditSession }>(`/audit/${id}`),

  runAudit: (id: string) =>
    api.post<{ data: AuditSession }>(`/audit/${id}/run`),

  getStamp: (id: string) =>
    api.get<{ data: AuditSession }>(`/audit/${id}/stamp`),

  getPlan: (id: string) =>
    api.post<{ data: RegenerativePlan }>(`/audit/${id}/plan`),

  getUserStamps: (userId: string) =>
    api.get<{ data: AuditSession[] }>(`/user/${userId}/stamps`),
};
