import api, { unwrapResponse } from './api';

export const vitalsService = {
  async list() {
    const res = await api.get('/vitals');
    return unwrapResponse(res);
  },

  async getRecent() {
    const res = await api.get('/vitals/recent');
    return unwrapResponse(res);
  },

  async getChartData(params: { vitalToSelect: string; duration: string }) {
    const res = await api.get('/vitals/chart', { params });
    return unwrapResponse(res);
  },

  async create(data: any) {
    const res = await api.post('/vitals', data);
    return unwrapResponse(res);
  },

  async update(id: string, data: any) {
    const res = await api.patch(`/vitals/${id}`, data);
    return unwrapResponse(res);
  },

  async remove(id: string) {
    const res = await api.delete(`/vitals/${id}`);
    return unwrapResponse(res);
  },
};
