import api from './api';

export const prescriptionsService = {
  async list(params?: Record<string, any>) {
    const res = await api.get('/patient/prescriptions', { params });
    return res.data.data || res.data.result;
  },

  async getById(id: string) {
    const res = await api.get(`/patient/prescriptions/${id}`);
    return res.data.data || res.data.result;
  },

  async accept(id: string) {
    const res = await api.post(`/patient/prescriptions/${id}/accept`);
    return res.data.data || res.data.result;
  },

  async decline(id: string) {
    const res = await api.post(`/patient/prescriptions/${id}/decline`);
    return res.data.data || res.data.result;
  },

  async requestRefill(id: string) {
    const res = await api.post(`/patient/prescriptions/${id}/refill`);
    return res.data.data || res.data.result;
  },

  async initializeCardPayment(id: string) {
    const res = await api.post(`/patient/prescriptions/${id}/pay/card/initialize`);
    return res.data.data || res.data.result;
  },

  async verifyCardPayment(id: string, reference: string) {
    const res = await api.post(`/patient/prescriptions/${id}/pay/card/verify`, {reference});
    return res.data.data || res.data.result;
  },

  async payWithWallet(id: string) {
    const res = await api.post(`/patient/prescriptions/${id}/pay/wallet`);
    return res.data.data || res.data.result;
  },
};
