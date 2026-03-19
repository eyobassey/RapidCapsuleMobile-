import api from './api';

export interface ChannelPreferences {
  in_app: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
}

export interface NotificationPreferences {
  appointment_reminders: ChannelPreferences;
  appointment_updates: ChannelPreferences;
  payment_updates: ChannelPreferences;
  health_reminders: ChannelPreferences;
  vitals_alerts: ChannelPreferences;
  prescription_updates: ChannelPreferences;
  recovery_updates: ChannelPreferences;
  message_notifications: ChannelPreferences;
  promotional: ChannelPreferences;
}

export type PreferenceCategory = keyof NotificationPreferences;
export type Channel = keyof ChannelPreferences;

export const notificationPreferencesService = {
  async getPreferences(): Promise<NotificationPreferences> {
    const res = await api.get('/notifications/preferences');
    return res.data.data;
  },

  async updatePreference(
    category: PreferenceCategory,
    channel: Channel,
    value: boolean
  ): Promise<NotificationPreferences> {
    const res = await api.patch('/notifications/preferences', {
      [category]: { [channel]: value },
    });
    return res.data.data;
  },
};
