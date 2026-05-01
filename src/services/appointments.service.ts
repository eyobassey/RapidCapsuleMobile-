import api, { unwrapResponse } from './api';

export const appointmentsService = {
  async list(params?: Record<string, any>) {
    const res = await api.get('/appointments/patient', { params });
    return unwrapResponse(res);
  },

  async getById(id: string) {
    const res = await api.get(`/appointments/${id}`);
    return unwrapResponse(res);
  },

  async getAvailableSpecialists(payload: any) {
    const res = await api.post('/appointments/available-specialists', payload);
    return unwrapResponse(res);
  },

  async getAvailableTimes(payload: any) {
    const res = await api.post('/appointments/available-times', payload);
    return unwrapResponse(res);
  },

  async book(payload: any) {
    const res = await api.post('/appointments', payload);
    return unwrapResponse(res);
  },

  async cancel(id: string) {
    const res = await api.patch(`/appointments/${id}/cancel`);
    return unwrapResponse(res);
  },

  async reschedule(payload: any) {
    const res = await api.patch('/appointments/reschedule', payload);
    return unwrapResponse(res);
  },

  async rate(id: string, payload: any) {
    const res = await api.post(`/appointments/${id}/rate`, payload);
    return unwrapResponse(res);
  },

  async verifyPayment(reference: string) {
    const res = await api.post('/appointments/transactions/verify', { reference });
    return unwrapResponse(res);
  },

  async getSpecialistCategories() {
    const res = await api.get('/specialist-categories');
    return unwrapResponse(res);
  },

  async getConsultationServices() {
    const res = await api.get('/consultation-services');
    return unwrapResponse(res);
  },
};
