import api from './api';

export const healthIntegrationsService = {
  async getIntegrations() {
    const res = await api.get('/health-integrations');
    return res.data.data || res.data.result || [];
  },

  async getProviders() {
    const res = await api.get('/health-integrations/providers');
    return res.data.data || res.data.result || [];
  },

  async getStatus(provider: string) {
    const res = await api.get(`/health-integrations/status/${provider}`);
    return res.data.data || res.data.result;
  },

  async connect(payload: {provider: string; dataTypes?: string[]; autoSync?: boolean}) {
    const res = await api.post('/health-integrations/connect', payload);
    return res.data.data || res.data.result;
  },

  async handleCallback(provider: string, payload: {code?: string; data?: any}) {
    const res = await api.post(`/health-integrations/callback/${provider}`, payload);
    return res.data.data || res.data.result;
  },

  async pushAppleHealthData(data: any) {
    const res = await api.post('/health-integrations/apple-health/callback', data);
    return res.data.data || res.data.result;
  },

  async sync(provider: string, params?: {startDate?: string; endDate?: string}) {
    const res = await api.post(`/health-integrations/sync/${provider}`, params || {});
    return res.data.data || res.data.result;
  },

  async disconnect(provider: string) {
    const res = await api.delete(`/health-integrations/${provider}`);
    return res.data.data || res.data.result;
  },

  async updateSettings(provider: string, settings: {autoSync?: boolean; syncDirection?: string; dataTypes?: string[]}) {
    const res = await api.patch(`/health-integrations/${provider}/settings`, settings);
    return res.data.data || res.data.result;
  },

  async getSyncLogs() {
    const res = await api.get('/health-integrations/sync-logs');
    return res.data.data || res.data.result || [];
  },

  async getData(params?: {provider?: string; dataType?: string; startDate?: string; endDate?: string}) {
    const res = await api.get('/health-integrations/data', {params});
    return res.data.data || res.data.result || [];
  },
};
