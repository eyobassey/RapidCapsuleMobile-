import api, { unwrapResponse } from './api';

export const healthIntegrationsService = {
  async getIntegrations() {
    const res = await api.get('/health-integrations');
    return unwrapResponse(res) ?? [];
  },

  async getProviders() {
    const res = await api.get('/health-integrations/providers');
    return unwrapResponse(res) ?? [];
  },

  async getStatus(provider: string) {
    const res = await api.get(`/health-integrations/status/${provider}`);
    return unwrapResponse(res);
  },

  async connect(payload: {
    provider: string;
    dataTypes?: string[];
    autoSync?: boolean;
    syncDirection?: 'push' | 'pull' | 'bidirectional';
  }) {
    const res = await api.post('/health-integrations/connect', payload);
    return unwrapResponse(res);
  },

  async handleCallback(provider: string, payload: { code?: string; data?: any }) {
    const res = await api.post(`/health-integrations/callback/${provider}`, payload);
    return unwrapResponse(res);
  },

  async pushAppleHealthData(data: any) {
    const res = await api.post('/health-integrations/apple-health/callback', data);
    return unwrapResponse(res);
  },

  async sync(provider: string, params?: { startDate?: string; endDate?: string }) {
    const res = await api.post(`/health-integrations/sync/${provider}`, params || {});
    return unwrapResponse(res);
  },

  async disconnect(provider: string) {
    const res = await api.delete(`/health-integrations/${provider}`);
    return unwrapResponse(res);
  },

  async updateSettings(
    provider: string,
    settings: { autoSync?: boolean; syncDirection?: string; dataTypes?: string[] }
  ) {
    const res = await api.patch(`/health-integrations/${provider}/settings`, settings);
    return unwrapResponse(res);
  },

  async getSyncLogs() {
    const res = await api.get('/health-integrations/sync-logs');
    return unwrapResponse(res) ?? [];
  },

  async getData(params?: {
    provider?: string;
    dataType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const res = await api.get('/health-integrations/data', { params });
    return unwrapResponse(res) ?? [];
  },
};
