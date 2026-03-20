import api from './api';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DigestItemType =
  | 'observation'
  | 'recommendation'
  | 'medication'
  | 'follow_up'
  | 'onboarding'
  | 'drug_interaction'
  | 'recovery'
  | 'travel'
  | 'health_news'
  | 'motivation';

export type DigestPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface DigestItem {
  type: DigestItemType;
  title: string;
  content: string;
  action_text?: string;
  action_url?: string;
  priority: DigestPriority;
}

export interface DailyDigest {
  _id: string;
  items: DigestItem[];
  summary: string;
  health_joke?: string;
  created_at: string;
}

export interface WeeklyReport {
  _id: string;
  summary: string;
  health_score?: number;
  medications?: any[];
  recommendations?: any[];
  health_news?: any[];
  doctors_note?: string;
  created_at: string;
  week_start?: string;
  week_end?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const drEkaService = {
  async getTodaysDigest(): Promise<DailyDigest | null> {
    const res = await api.get('/dr-eka/daily');
    const data = res.data.data || res.data.result || res.data;
    return data || null;
  },

  async getDigestHistory(page = 1, limit = 10): Promise<{ digests: DailyDigest[]; total: number }> {
    const res = await api.get('/dr-eka/daily/history', {
      params: { page, limit },
    });
    const data = res.data.data || res.data.result || res.data;
    return {
      digests: data?.digests || data?.items || (Array.isArray(data) ? data : []),
      total: data?.total ?? 0,
    };
  },

  async generateDigest(): Promise<DailyDigest> {
    const res = await api.post('/dr-eka/daily/generate');
    return res.data.data || res.data.result || res.data;
  },

  async getLatestWeeklyReport(): Promise<WeeklyReport | null> {
    const res = await api.get('/dr-eka/weekly');
    const data = res.data.data || res.data.result || res.data;
    return data || null;
  },

  async getWeeklyReports(
    page = 1,
    limit = 10
  ): Promise<{ reports: WeeklyReport[]; total: number }> {
    const res = await api.get('/dr-eka/weekly/history', {
      params: { page, limit },
    });
    const data = res.data.data || res.data.result || res.data;
    return {
      reports: data?.reports || data?.items || (Array.isArray(data) ? data : []),
      total: data?.total ?? 0,
    };
  },

  async generateWeeklyReport(): Promise<WeeklyReport> {
    const res = await api.post('/dr-eka/weekly/generate');
    return res.data.data || res.data.result || res.data;
  },
};
