import api from './api';

export const ekaService = {
  async getConversations() {
    const res = await api.get('/eka/conversations');
    return res.data.data || res.data.result;
  },

  async getConversation(id: string) {
    const res = await api.get(`/eka/conversations/${id}`);
    return res.data.data || res.data.result;
  },

  async sendMessage(payload: any) {
    const res = await api.post('/eka/chat', payload);
    return res.data.data || res.data.result;
  },

  async deleteConversation(id: string) {
    const res = await api.delete(`/eka/conversations/${id}`);
    return res.data.data || res.data.result;
  },
};
