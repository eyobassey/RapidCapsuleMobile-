import api from './api';

// Shape returned by GET /notifications/preferences and accepted by PATCH /notifications/preferences
export type NotificationPreferences = {
  email: boolean;
  push: boolean;
  sms: boolean;
  in_app: boolean;
  appointment_reminders: boolean;
  prescription_updates: boolean;
  payment_alerts: boolean;
  promotional: boolean;
};

// Shape returned by GET /notifications/stats
export type NotificationStats = {
  total: number;
  unread: number;
  by_type: Record<string, number>;
};

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

  async getStats(): Promise<NotificationStats> {
    const res = await api.get('/notifications/stats');
    return res.data.data || res.data.result;
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const res = await api.get('/notifications/preferences');
    return res.data.data || res.data.result;
  },

  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<void> {
    await api.patch('/notifications/preferences', prefs);
  },
};
