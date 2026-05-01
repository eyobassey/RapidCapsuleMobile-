import api, { unwrapResponse } from './api';

export const walletService = {
  async getBalance() {
    const res = await api.get('/wallets/balance');
    return unwrapResponse(res);
  },

  async getTransactions(params?: { page?: number; limit?: number; type?: string }) {
    const res = await api.get('/wallets', { params });
    return unwrapResponse(res);
  },

  async fund(payload: any) {
    const res = await api.post('/wallets/fund', payload);
    return unwrapResponse(res);
  },

  async verifyFunding(reference: string) {
    const res = await api.post('/wallets/fund/verify', { reference });
    return unwrapResponse(res);
  },
};
