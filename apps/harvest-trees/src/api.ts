import axios from 'axios';
import type { HarvestTree } from './types';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((c) => {
  const token = localStorage.getItem('wald_token');
  if (token) Object.assign(c.headers, { Authorization: `Bearer ${token}` });
  return c;
});

export const treeApi = {
  create: (domain: string, title: string) =>
    api.post<{ data: HarvestTree }>('/tree/create', { domain, title }),
  getTree: (id: string) =>
    api.get<{ data: HarvestTree }>(`/tree/${id}`),
  updateLayer: (id: string, layer: string, nodes: unknown[]) =>
    api.put<{ data: HarvestTree }>(`/tree/${id}/layer/${layer}`, nodes),
  updateTitle: (id: string, title: string) =>
    api.patch<{ data: HarvestTree }>(`/tree/${id}/title`, { title }),
  auditTree: (id: string) =>
    api.post<{ data: { session_id: string; tree_id: string } }>(`/tree/${id}/audit`),
  getUserTrees: (userId: string) =>
    api.get<{ data: HarvestTree[] }>(`/user/${userId}/trees`),
  getReport: (id: string) =>
    api.get<{ data: HarvestTree }>(`/tree/${id}/report`),
};
