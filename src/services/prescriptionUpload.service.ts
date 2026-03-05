import api from './api';

export const prescriptionUploadService = {
  async upload(formData: FormData) {
    const res = await api.post('/pharmacy/prescriptions/upload', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
      timeout: 60000,
    });
    return res.data.data || res.data.result;
  },

  async getMyUploads(params?: {status?: string; page?: number; limit?: number}) {
    const res = await api.get('/pharmacy/prescriptions/my-uploads', {params});
    return res.data.data || res.data.result;
  },

  async getUploadById(id: string) {
    const res = await api.get(`/pharmacy/prescriptions/${id}`);
    return res.data.data || res.data.result;
  },

  async getVerification(id: string) {
    const res = await api.get(`/pharmacy/prescriptions/${id}/verification`);
    return res.data.data || res.data.result;
  },

  async retryVerification(id: string) {
    const res = await api.post(`/pharmacy/prescriptions/${id}/retry-verification`);
    return res.data.data || res.data.result;
  },

  async deleteUpload(id: string) {
    const res = await api.delete(`/pharmacy/prescriptions/${id}`);
    return res.data.data || res.data.result;
  },

  async getClarification(id: string) {
    const res = await api.get(`/pharmacy/prescriptions/${id}/clarification`);
    return res.data.data || res.data.result;
  },

  async submitClarification(id: string, formData: FormData) {
    const res = await api.post(
      `/pharmacy/prescriptions/${id}/clarification/respond`,
      formData,
      {
        headers: {'Content-Type': 'multipart/form-data'},
        timeout: 60000,
      },
    );
    return res.data.data || res.data.result;
  },
};
