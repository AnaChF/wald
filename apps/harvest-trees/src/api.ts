import axios from 'axios';
import type { HarvestTree } from './types';

const api = axios.create({ baseURL: '/api' });

export const treeApi = {
  create: (domain: string, title: string) =>
    api.post<{ data: HarvestTree }>('/tree/create', { domain, title }),
  getTree: (id: string) =>
    api.get<{ data: HarvestTree }>(`/tree/${id}`),
  updateLayer: (id: string, layer: string, nodes: unknown[]) =>
    api.put<{ data: HarvestTree }>(`/tree/${id}/layer/${layer}`, { nodes }),
  getUserTrees: (userId: string) =>
    api.get<{ data: HarvestTree[] }>(`/user/${userId}/trees`),
  getReport: (id: string) =>
    api.get<{ data: HarvestTree }>(`/tree/${id}/report`),
};
