import api from './api';

export const appointmentsService = {
  async list(params?: Record<string, any>) {
    const res = await api.get('/appointments/patient', { params });
    return res.data.data || res.data.result;
  },

  async getById(id: string) {
    const res = await api.get(`/appointments/${id}`);
    return res.data.data || res.data.result;
  },

  async getAvailableSpecialists(payload: any) {
    const res = await api.post('/appointments/available-specialists', payload);
    return res.data.data || res.data.result;
  },

  async getAvailableTimes(payload: any) {
    const res = await api.post('/appointments/available-times', payload);
    return res.data.data || res.data.result;
  },

  async book(payload: any) {
    const res = await api.post('/appointments', payload);
    return res.data.data || res.data.result;
  },

  async cancel(id: string) {
    const res = await api.patch(`/appointments/${id}/cancel`);
    return res.data.data || res.data.result;
  },

  async reschedule(payload: any) {
    const res = await api.patch('/appointments/reschedule', payload);
    return res.data.data || res.data.result;
  },

  async rate(id: string, payload: any) {
    const res = await api.post(`/appointments/${id}/rate`, payload);
    return res.data.data || res.data.result;
  },

  async getSpecialistCategories() {
    const res = await api.get('/specialist-categories');
    return res.data.data || res.data.result;
  },
};
