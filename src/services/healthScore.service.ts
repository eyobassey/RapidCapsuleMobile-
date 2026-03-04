import api from './api';

export const healthScoreService = {
  async getBasicScore() {
    const res = await api.get('/basic-health-score');
    return res.data.data || res.data.result;
  },

  async getHistory() {
    const res = await api.get('/basic-health-score/history');
    return res.data.data || res.data.result;
  },
};
