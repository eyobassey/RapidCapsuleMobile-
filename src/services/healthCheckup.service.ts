import api from './api';

export interface Evidence {
  id: string;
  choice_id: 'present' | 'absent' | 'unknown';
  source?: 'initial' | 'interview';
}

export const healthCheckupService = {
  async beginCheckup(data: {health_check_for: string; checkup_owner_id: string}) {
    const res = await api.post('/health-checkup', data);
    return res.data.data || res.data.result;
  },

  async getRiskFactors(age: number, interviewToken?: string) {
    const res = await api.post('/health-checkup/risk-factors', {
      age,
      interview_token: interviewToken,
    });
    return res.data.data || res.data.result;
  },

  async searchSymptoms(params: {phrase: string; age: number; sex?: string; max_results?: number}) {
    const res = await api.get('/health-checkup/search', {params});
    return res.data.data || res.data.result;
  },

  async getSuggestedSymptoms(data: {
    sex: string;
    age: number;
    evidence: Evidence[];
    interview_token?: string;
  }) {
    const res = await api.post('/health-checkup/symptoms', data);
    return res.data.data || res.data.result;
  },

  async diagnosis(data: {
    sex?: string;
    age: {value: number};
    evidence: Evidence[];
    should_stop?: boolean;
    interview_token?: string;
    extras?: Record<string, any>;
  }) {
    const res = await api.post('/health-checkup/diagnosis', data);
    return res.data.data || res.data.result;
  },

  async getHistory(params?: {page?: number; limit?: number}) {
    const res = await api.get('/health-checkup/history', {params});
    return res.data.data || res.data.result;
  },

  async getById(checkupId: string) {
    const res = await api.get(`/health-checkup/${checkupId}`);
    return res.data.data || res.data.result;
  },
};
