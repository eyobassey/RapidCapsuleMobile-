import api from './api';

export type NotificationPreferences = {
  email: boolean;
  push: boolean;
  sms: boolean;
  in_app: boolean;
  whatsapp: boolean;
  appointment_reminders: boolean;
  appointment_updates: boolean;
  prescription_updates: boolean;
  payment_alerts: boolean;
  health_reminders: boolean;
  vitals_alerts: boolean;
  message_notifications: boolean;
  promotional: boolean;
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

  async getPreferences(): Promise<NotificationPreferences> {
    const res = await api.get('/notifications/preferences');
    return res.data.data || res.data.result;
  },

  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<void> {
    await api.patch('/notifications/preferences', prefs);
  },
};
