import api from './api';

export const walletService = {
  async getBalance() {
    const res = await api.get('/wallets/balance');
    return res.data.data || res.data.result;
  },

  async getTransactions(params?: { page?: number; limit?: number; type?: string }) {
    const res = await api.get('/wallets/transactions', { params });
    return res.data.data || res.data.result;
  },

  async fund(payload: any) {
    const res = await api.post('/wallets/fund', payload);
    return res.data.data || res.data.result;
  },

  async verifyFunding(reference: string) {
    const res = await api.post('/wallets/fund/verify', { reference });
    return res.data.data || res.data.result;
  },
};
