import api, { unwrapResponse } from './api';

export const healthScoreService = {
  async getBasicScore() {
    const res = await api.get('/basic-health-score');
    return unwrapResponse(res);
  },

  async getHistory() {
    const res = await api.get('/basic-health-score/history');
    return unwrapResponse(res);
  },
};
