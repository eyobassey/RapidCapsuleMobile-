import api from './api';

export const notificationsService = {
  async list(params?: { page?: number; limit?: number }) {
    const res = await api.get('/notifications', { params });
    const data = res.data.data || res.data.result;
    // Backend may return { notifications, pagination } or a flat array
    return Array.isArray(data) ? data : data?.notifications || [];
  },

  async getUnreadCount() {
    const res = await api.get('/notifications/unread-count');
    const data = res.data.data || res.data.result;
    return data?.unread_count ?? (typeof data === 'number' ? data : 0);
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
