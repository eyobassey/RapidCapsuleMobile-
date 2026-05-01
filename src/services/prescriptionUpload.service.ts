import api, { unwrapResponse } from './api';

export const prescriptionUploadService = {
  async upload(formData: FormData) {
    const res = await api.post('/pharmacy/prescriptions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return unwrapResponse(res);
  },

  async getMyUploads(params?: { status?: string; page?: number; limit?: number }) {
    const res = await api.get('/pharmacy/prescriptions/my-uploads', { params });
    return unwrapResponse(res);
  },

  async getUploadById(id: string) {
    const res = await api.get(`/pharmacy/prescriptions/${id}`);
    return unwrapResponse(res);
  },

  async getVerification(id: string) {
    const res = await api.get(`/pharmacy/prescriptions/${id}/verification`);
    return unwrapResponse(res);
  },

  async retryVerification(id: string) {
    const res = await api.post(`/pharmacy/prescriptions/${id}/retry-verification`);
    return unwrapResponse(res);
  },

  async deleteUpload(id: string) {
    const res = await api.delete(`/pharmacy/prescriptions/${id}`);
    return unwrapResponse(res);
  },

  async getClarification(id: string) {
    const res = await api.get(`/pharmacy/prescriptions/${id}/clarification`);
    return unwrapResponse(res);
  },

  async submitClarification(id: string, formData: FormData) {
    const res = await api.post(`/pharmacy/prescriptions/${id}/clarification/respond`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return unwrapResponse(res);
  },
};
