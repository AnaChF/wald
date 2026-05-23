import axios from 'axios';
import type {
  CanopySession, Signal, ClassificationResult, Scenario,
  ScenarioAuditResult, Forecast, HarvestSeed,
} from './types';

const BASE = '/api';

function authHeader() {
  const token = localStorage.getItem('wald_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const api = axios.create({ baseURL: BASE });
api.interceptors.request.use((c) => {
  Object.assign(c.headers, authHeader());
  return c;
});

// Sessions
export const createSession = (body: Partial<CanopySession> & { time_horizon_years?: number }) =>
  api.post<{ data: CanopySession }>('/canopy/session/create', body).then((r) => r.data.data);

export const getSession = (id: string, shareToken?: string) => {
  const params = shareToken ? `?share_token=${shareToken}` : '';
  return api.get<{ data: CanopySession }>(`/canopy/session/${id}${params}`).then((r) => r.data.data);
};

export const updateSession = (id: string, body: Partial<CanopySession>) =>
  api.put<{ data: CanopySession }>(`/canopy/session/${id}`, body).then((r) => r.data.data);

export const getUserSessions = (userId: string) =>
  api.get<{ data: CanopySession[] }>(`/canopy/user/${userId}/sessions`).then((r) => r.data.data);

export const shareSession = (id: string) =>
  api.post<{ data: { share_token: string; share_url: string } }>(`/canopy/session/${id}/share`).then((r) => r.data.data);

// Signals
export const classifySignal = (body: { signal_text: string; agent_context: string; session_id: string }) =>
  api.post<{ data: ClassificationResult }>('/canopy/signals/classify', body).then((r) => r.data.data);

export const addSignal = (sessionId: string, body: { text: string; source?: string; canvas_x?: number; canvas_y?: number }) =>
  api.post<{ data: Signal }>(`/canopy/session/${sessionId}/signals`, body).then((r) => r.data.data);

export const updateSignalClassification = (signalId: string, body: Partial<Signal> & Record<string, unknown>) =>
  api.put<{ data: Signal }>(`/canopy/signal/${signalId}/classify`, body).then((r) => r.data.data);

export const getSignals = (sessionId: string) =>
  api.get<{ data: Signal[] }>(`/canopy/session/${sessionId}/signals`).then((r) => r.data.data);

// Triangle
export const saveTriangle = (sessionId: string, body: Record<string, unknown>) =>
  api.post(`/canopy/session/${sessionId}/triangle`, body).then((r) => r.data);

// CLA
export const saveCLA = (sessionId: string, body: Record<string, unknown>) =>
  api.post(`/canopy/session/${sessionId}/cla`, body).then((r) => r.data);

// Scenarios
export const createScenario = (sessionId: string, body: { title: string; narrative?: string; critical_uncertainties?: string[] }) =>
  api.post<{ data: Scenario }>(`/canopy/session/${sessionId}/scenario`, body).then((r) => r.data.data);

export const auditScenario = (body: { scenario_text: string; critical_uncertainties: string[]; agent_context: string }) =>
  api.post<{ data: ScenarioAuditResult }>('/canopy/scenarios/audit', body).then((r) => r.data.data);

export const runScenarioAudit = (scenarioId: string) =>
  api.post<{ data: { scenario: Scenario; audit: ScenarioAuditResult } }>(`/canopy/scenario/${scenarioId}/audit`).then((r) => r.data.data);

export const getScenarioCertification = (scenarioId: string) =>
  api.get(`/canopy/scenario/${scenarioId}/certification`).then((r) => r.data.data);

export const getScenarios = (sessionId: string) =>
  api.get<{ data: Scenario[] }>(`/canopy/session/${sessionId}/scenarios`).then((r) => r.data.data);

// Forecast
export const generateBackcast = (sessionId: string, body: { preferred_horizon_id: string; time_horizon_years: number }) =>
  api.post<{ data: Forecast }>(`/canopy/session/${sessionId}/backcast`, body).then((r) => r.data.data);

export const getForecast = (sessionId: string) =>
  api.get<{ data: Forecast }>(`/canopy/session/${sessionId}/forecast`).then((r) => r.data.data);

export const getIndicators = (sessionId: string) =>
  api.get(`/canopy/session/${sessionId}/indicators`).then((r) => r.data.data);

export const logDrift = (sessionId: string, body: Record<string, unknown>) =>
  api.post(`/canopy/session/${sessionId}/drift`, body).then((r) => r.data.data);

export const getRevisions = (sessionId: string) =>
  api.get(`/canopy/session/${sessionId}/revisions`).then((r) => r.data.data);

export const submitPWTC = (sessionId: string, scenarioId: string) =>
  api.post(`/canopy/session/${sessionId}/pwtc`, { scenario_id: scenarioId }).then((r) => r.data.data);

export const exportHarvest = (sessionId: string) =>
  api.post<{ data: { harvest_tree_seeds: HarvestSeed[]; export_ready: boolean } }>(
    `/canopy/session/${sessionId}/harvest`,
  ).then((r) => r.data.data);

// Harvest Trees cross-app: create a tree and populate its layers
export const createHarvestTree = (title: string, domain: string) =>
  api.post<{ data: Record<string, unknown> }>('/tree/create', { title, domain }).then((r) => r.data.data);

export const updateHarvestTreeLayer = (treeId: string, layer: string, nodes: unknown[]) =>
  api.put<{ data: Record<string, unknown> }>(`/tree/${treeId}/layer/${layer}`, nodes).then((r) => r.data.data);

// Cross-app read: user's existing Walditorium stamps and Harvest Trees
export const getWalditoriumSessions = (userId: string) =>
  api.get<{ data: Record<string, unknown>[] }>(`/user/${userId}/stamps`).then((r) => r.data.data);

export const getHarvestTrees = (userId: string) =>
  api.get<{ data: Record<string, unknown>[] }>(`/user/${userId}/trees`).then((r) => r.data.data);

// Report download URL (returns PDF)
export const getReportUrl = (sessionId: string) => `/api/canopy/session/${sessionId}/report`;
