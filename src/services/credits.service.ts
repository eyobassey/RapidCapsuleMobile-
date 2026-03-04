import api from './api';

export const creditsService = {
  async getCredits() {
    const res = await api.get('/claude-summary/credits');
    return res.data.data || res.data.result || res.data;
  },

  async getPlans() {
    const res = await api.get('/claude-summary/plans');
    return res.data.data || res.data.result || res.data;
  },

  async purchasePlan(planId: string) {
    const res = await api.post('/claude-summary/purchase', {plan_id: planId});
    return res.data.data || res.data.result || res.data;
  },

  async getTransactions(params?: {page?: number; limit?: number}) {
    const res = await api.get('/claude-summary/transactions', {params});
    return res.data.data || res.data.result || res.data;
  },

  async canGenerate() {
    const res = await api.get('/claude-summary/can-generate');
    return res.data.data || res.data.result || res.data;
  },

  async getSharingSettings() {
    const res = await api.get('/claude-summary/sharing/settings');
    return res.data.data || res.data.result || res.data;
  },

  async searchPatients(query: string) {
    const res = await api.get('/claude-summary/sharing/search', {params: {query}});
    return res.data.data || res.data.result || res.data;
  },

  async transferCredits(recipient_id: string, credits: number) {
    const res = await api.post('/claude-summary/sharing/transfer', {recipient_id, credits});
    return res.data.data || res.data.result || res.data;
  },
};
