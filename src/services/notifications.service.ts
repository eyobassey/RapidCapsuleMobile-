import api from './api';

export const notificationsService = {
  async list(params?: { page?: number; limit?: number }) {
    const res = await api.get('/notifications', { params });
    return res.data.data || res.data.result;
  },

  async getUnreadCount() {
    const res = await api.get('/notifications/unread-count');
    return res.data.data || res.data.result;
  },

  async markAsRead(id: string) {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data.data || res.data.result;
  },

  async markAllRead() {
    const res = await api.patch('/notifications/read-all');
    return res.data.data || res.data.result;
  },

  async remove(id: string) {
    const res = await api.delete(`/notifications/${id}`);
    return res.data.data || res.data.result;
  },
};
