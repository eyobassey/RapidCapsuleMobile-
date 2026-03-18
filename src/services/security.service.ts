import api from './api';

// ─── Session ──────────────────────────────────────────────────────────────────

export type Session = {
  _id: string;
  userId: string;
  tokenId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | string;
  browser: string;
  os: string;
  ipAddress: string;
  city: string;
  country: string;
  location: string;
  lastActiveAt: string;
  isRevoked: boolean;
  isCurrent: boolean;
  created_at: string;
  updated_at: string;
};

// ─── User Settings ────────────────────────────────────────────────────────────

export type TwoFactorMedium = 'EMAIL' | 'SMS' | 'TOTP';

export type UserSettingsDefaults = {
  twoFA_auth?: boolean;
  twoFA_medium?: TwoFactorMedium;
  whatsapp_notifications?: boolean;
};

export type UserSettings = {
  defaults: UserSettingsDefaults;
};

// ─── Password ─────────────────────────────────────────────────────────────────

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

// ─── 2FA / Biometrics ────────────────────────────────────────────────────────

export type Generate2FAResponse = {
  secret: string;
  qrCodeUrl: string;
};

export type BiometricCredential = {
  credentialId: string;
  deviceName: string;
  createdAt: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function unwrap<T>(res: { data: any }): T {
  return res.data.data ?? res.data.result ?? res.data;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const securityService = {
  // Sessions
  async getSessions(): Promise<Session[]> {
    const res = await api.get('/auth/sessions');
    const data = unwrap<any>(res);
    return Array.isArray(data) ? data : data?.sessions ?? [];
  },

  async revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/auth/sessions/${sessionId}`);
  },

  async revokeAllOtherSessions(): Promise<void> {
    await api.post('/auth/sessions/revoke-all-other');
  },

  // User settings (2FA + WhatsApp toggle)
  async getUserSettings(): Promise<UserSettings> {
    const res = await api.get('/user-settings');
    return unwrap<UserSettings>(res);
  },

  async updateUserSettings(patch: {
    defaults: Partial<UserSettingsDefaults>;
  }): Promise<UserSettings> {
    const res = await api.patch('/user-settings', patch);
    return unwrap<UserSettings>(res);
  },

  // Password
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await api.patch('/auth/change-password', payload);
  },

  // 2FA (TOTP secret generation)
  async generate2FASecret(): Promise<Generate2FAResponse> {
    const res = await api.post('/auth/2fa/generate');
    return unwrap<Generate2FAResponse>(res);
  },

  async enable2FA(twoFactorCode: string): Promise<void> {
    await api.post('/auth/2fa/turn-on', { twoFactorCode });
  },

  // Biometrics
  async getBiometricCredentials(): Promise<BiometricCredential[]> {
    const res = await api.get('/auth/biometric/credentials');
    const data = unwrap<any>(res);
    return Array.isArray(data) ? data : data?.credentials ?? [];
  },

  async deleteBiometricCredential(credentialId: string): Promise<void> {
    await api.post('/auth/biometric/delete', { credentialId });
  },
};
