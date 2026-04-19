import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const communityApi = {
  getTerritories: () => api.get('/territories'),
  getCards: (territoryId: string) => api.get(`/territory/${territoryId}/cards`),
  completeAction: (actionId: string) => api.post(`/action/${actionId}/complete`),
  getTotem: (userId: string) => api.get(`/totem/${userId}`),
  getResources: (territoryId: string) => api.get(`/station/${territoryId}`),
  submitFuture: (future: object) => api.post('/pwtc/future', future),
  addStake: (futureId: string, stake: object) => api.post(`/pwtc/${futureId}/stake`, stake),
  getFutures: () => api.get('/pwtc/futures'),
  getJourney: (userId: string) => api.get(`/user/${userId}/journey`),
};
