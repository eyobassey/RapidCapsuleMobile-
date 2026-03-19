import api from './api';

// ─── Channel flags shared by every category ───────────────────────────────────

export type ChannelFlags = {
  in_app: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
};

// ─── Per-category preference (each category has one ChannelFlags object) ──────

export type CategoryPrefs = {
  appointment_reminders: ChannelFlags;
  appointment_updates: ChannelFlags;
  prescription_updates: ChannelFlags;
  payment_updates: ChannelFlags;
  health_reminders: ChannelFlags;
  vitals_alerts: ChannelFlags;
  message_notifications: ChannelFlags;
  promotional: ChannelFlags;
};

export type CategoryKey = keyof CategoryPrefs;
export type ChannelKey = keyof ChannelFlags;

// ─── Quiet hours ──────────────────────────────────────────────────────────────

export type QuietHours = {
  enabled: boolean;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  timezone: string;
};

// ─── Message email timing ─────────────────────────────────────────────────────

export type MessagingTiming = {
  unread_threshold_minutes: number;
  cooldown_hours: number;
};

// ─── Full preferences payload ─────────────────────────────────────────────────

export type NotificationPreferences = CategoryPrefs & {
  quiet_hours: QuietHours;
  messaging_timing: MessagingTiming;
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export type NotificationStats = {
  total: number;
  unread: number;
  by_type: Record<string, number>;
};

// ─── Default channel flags (all off — server fills real state on GET) ─────────

export const DEFAULT_CHANNEL_FLAGS: ChannelFlags = {
  in_app: false,
  email: false,
  sms: false,
  whatsapp: false,
  push: false,
};

export const DEFAULT_PREFS: NotificationPreferences = {
  appointment_reminders: { ...DEFAULT_CHANNEL_FLAGS },
  appointment_updates: { ...DEFAULT_CHANNEL_FLAGS },
  prescription_updates: { ...DEFAULT_CHANNEL_FLAGS },
  payment_updates: { ...DEFAULT_CHANNEL_FLAGS },
  health_reminders: { ...DEFAULT_CHANNEL_FLAGS },
  vitals_alerts: { ...DEFAULT_CHANNEL_FLAGS },
  message_notifications: { ...DEFAULT_CHANNEL_FLAGS },
  promotional: { ...DEFAULT_CHANNEL_FLAGS },
  quiet_hours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  },
  messaging_timing: {
    unread_threshold_minutes: 20,
    cooldown_hours: 3,
  },
};

// ─── Service ──────────────────────────────────────────────────────────────────

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

  async getStats(): Promise<NotificationStats> {
    const res = await api.get('/notifications/stats');
    return res.data.data || res.data.result;
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const res = await api.get('/notifications/preferences');
    return res.data.data || res.data.result;
  },

  // Patch any subset: a single channel on one category, quiet_hours, messaging_timing, etc.
  async updatePreferences(patch: Partial<NotificationPreferences>): Promise<void> {
    await api.patch('/notifications/preferences', patch);
  },
};
