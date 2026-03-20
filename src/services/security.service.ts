import type {
  PasskeyCreateRequest,
  PasskeyCreateResult,
  PasskeyGetRequest,
  PasskeyGetResult,
} from 'react-native-passkey';

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
  qrCode: string;
};

export type BiometricCredential = {
  credentialId: string;
  deviceName: string;
  createdAt: string;
};

export type PasskeyLoginResult = {
  token: string;
  refreshToken?: string;
};

// Re-export passkey request/result types so callers only need one import path.
export type { PasskeyCreateRequest, PasskeyCreateResult, PasskeyGetRequest, PasskeyGetResult };

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

  async enable2FA(code: string): Promise<void> {
    await api.post('/auth/2fa/turn-on', { code });
  },

  // Biometrics — credential management
  async getBiometricCredentials(): Promise<BiometricCredential[]> {
    const res = await api.get('/auth/biometric/credentials');
    const data = unwrap<any>(res);
    return Array.isArray(data) ? data : data?.credentials ?? [];
  },

  async deleteBiometricCredential(credentialId: string): Promise<void> {
    await api.post('/auth/biometric/delete', { credentialId });
  },

  // Passkey registration ceremony (requires active JWT)
  async getPasskeyRegistrationOptions(): Promise<PasskeyCreateRequest> {
    const res = await api.post('/auth/biometric/register/options');
    return unwrap<PasskeyCreateRequest>(res);
  },

  async verifyPasskeyRegistration(
    credential: PasskeyCreateResult,
    deviceName?: string
  ): Promise<void> {
    await api.post('/auth/biometric/register/verify', { credential, deviceName });
  },

  // Passkey authentication ceremony (discoverable credentials — no email required)
  async getPasskeyLoginOptions(): Promise<PasskeyGetRequest> {
    const res = await api.post('/auth/biometric/passkey/options');
    return unwrap<PasskeyGetRequest>(res);
  },

  async verifyPasskeyLogin(credential: PasskeyGetResult): Promise<PasskeyLoginResult> {
    const res = await api.post('/auth/biometric/passkey/verify', credential);
    const data = unwrap<any>(res);
    // Normalise field names — backend may return token/refresh_token or token/refreshToken.
    return {
      token: data.token,
      refreshToken: data.refreshToken ?? data.refresh_token,
    };
  },
};
