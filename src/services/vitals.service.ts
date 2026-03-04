import api from './api';

export const vitalsService = {
  async list() {
    const res = await api.get('/vitals');
    return res.data.data || res.data.result;
  },

  async getRecent() {
    const res = await api.get('/vitals/recent');
    return res.data.data || res.data.result;
  },

  async getChartData(params: { vitalToSelect: string; duration: string }) {
    const res = await api.get('/vitals/chart', { params });
    return res.data.data || res.data.result;
  },

  async create(data: any) {
    const res = await api.post('/vitals', data);
    return res.data.data || res.data.result;
  },

  async update(id: string, data: any) {
    const res = await api.patch(`/vitals/${id}`, data);
    return res.data.data || res.data.result;
  },

  async remove(id: string) {
    const res = await api.delete(`/vitals/${id}`);
    return res.data.data || res.data.result;
  },
};
