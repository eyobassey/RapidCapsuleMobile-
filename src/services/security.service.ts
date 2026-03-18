import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TwoFactorMethod = 'email' | 'sms' | 'totp';

export type TwoFactorStatus = {
  enabled: boolean;
  method: TwoFactorMethod | null;
};

export type BiometricCredential = {
  credentialId: string;
  deviceName: string;
  createdAt: string;
};

export type Session = {
  id: string;
  deviceType: string;
  browser: string;
  os: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type Generate2FAResponse = {
  secret: string;
  qrCodeUrl: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function unwrap<T>(res: { data: any }): T {
  return res.data.data ?? res.data.result ?? res.data;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const securityService = {
  // Password
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await api.patch('/auth/change-password', payload);
  },

  // 2FA
  async generate2FASecret(): Promise<Generate2FAResponse> {
    const res = await api.post('/auth/2fa/generate');
    return unwrap<Generate2FAResponse>(res);
  },

  async enable2FA(twoFactorCode: string): Promise<void> {
    await api.post('/auth/2fa/turn-on', { twoFactorCode });
  },

  async verify2FACode(twoFactorCode: string): Promise<void> {
    await api.post('/auth/2fa/verify', { twoFactorCode });
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

  // Sessions
  async getSessions(): Promise<Session[]> {
    const res = await api.get('/auth/sessions');
    const data = unwrap<any>(res);
    return Array.isArray(data) ? data : data?.sessions ?? [];
  },

  async getSessionCount(): Promise<number> {
    const res = await api.get('/auth/sessions/count');
    const data = unwrap<any>(res);
    return typeof data === 'number' ? data : data?.count ?? 0;
  },

  async revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/auth/sessions/${sessionId}`);
  },

  async revokeAllOtherSessions(): Promise<void> {
    await api.post('/auth/sessions/revoke-all-other');
  },
};
