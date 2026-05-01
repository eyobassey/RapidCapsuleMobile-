import api, { unwrapResponse } from './api';

export const creditsService = {
  async getCredits() {
    const res = await api.get('/claude-summary/credits');
    return unwrapResponse(res);
  },

  async getPlans() {
    const res = await api.get('/claude-summary/plans');
    return unwrapResponse(res);
  },

  async purchasePlan(planId: string) {
    const res = await api.post('/claude-summary/purchase', { plan_id: planId });
    return unwrapResponse(res);
  },

  async getTransactions(params?: { page?: number; limit?: number }) {
    const res = await api.get('/claude-summary/transactions', { params });
    return unwrapResponse(res);
  },

  async canGenerate() {
    const res = await api.get('/claude-summary/can-generate');
    return unwrapResponse(res);
  },

  async getSharingSettings() {
    const res = await api.get('/claude-summary/sharing/settings');
    return unwrapResponse(res);
  },

  async searchPatients(query: string) {
    const res = await api.get('/claude-summary/sharing/search', { params: { query } });
    return unwrapResponse(res);
  },

  async transferCredits(recipient_id: string, credits: number) {
    const res = await api.post('/claude-summary/sharing/transfer', { recipient_id, credits });
    return unwrapResponse(res);
  },
};
