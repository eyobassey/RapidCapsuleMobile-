import api, { unwrapResponse } from './api';

export interface Evidence {
  id: string;
  choice_id: 'present' | 'absent' | 'unknown';
  source?: 'initial' | 'interview';
}

export const healthCheckupService = {
  async beginCheckup(data: { health_check_for: string; checkup_owner_id: string }) {
    const res = await api.post('/health-checkup', data);
    return unwrapResponse(res);
  },

  async getRiskFactors(age: number, interviewToken?: string) {
    const res = await api.post('/health-checkup/risk-factors', {
      age,
      interview_token: interviewToken,
    });
    return unwrapResponse(res);
  },

  async searchSymptoms(params: {
    phrase: string;
    age: number;
    sex?: string;
    max_results?: number;
  }) {
    const res = await api.get('/health-checkup/search', { params });
    return unwrapResponse(res);
  },

  async getSuggestedSymptoms(data: {
    sex: string;
    age: number;
    evidence: Evidence[];
    interview_token?: string;
  }) {
    const res = await api.post('/health-checkup/symptoms', data);
    return unwrapResponse(res);
  },

  async diagnosis(data: {
    sex?: string;
    age: { value: number };
    evidence: Evidence[];
    should_stop?: boolean;
    interview_token?: string;
    extras?: Record<string, any>;
  }) {
    const res = await api.post('/health-checkup/diagnosis', data);
    return unwrapResponse(res);
  },

  async getHistory(params?: { page?: number; limit?: number }) {
    const res = await api.get('/health-checkup/history', { params });
    return unwrapResponse(res);
  },

  async getById(checkupId: string) {
    const res = await api.get(`/health-checkup/${checkupId}`);
    return unwrapResponse(res);
  },

  async getClaudeSummaryStatus() {
    const res = await api.get('/health-checkup/claude-summary/status');
    return unwrapResponse(res);
  },

  async getClaudeSummary(checkupId: string) {
    const res = await api.get(`/health-checkup/${checkupId}/claude-summary`);
    return unwrapResponse(res);
  },

  async generateClaudeSummary(checkupId: string) {
    const res = await api.post(`/health-checkup/${checkupId}/generate-claude-summary`);
    return unwrapResponse(res);
  },
};
