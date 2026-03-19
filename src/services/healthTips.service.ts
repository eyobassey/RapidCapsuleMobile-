import api from './api';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TipCategory =
  | 'nutrition'
  | 'exercise'
  | 'sleep'
  | 'mental_health'
  | 'preventive'
  | 'hydration'
  | 'medication';

export type TipPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface HealthTip {
  _id: string;
  title: string;
  content: string;
  category: TipCategory;
  priority: TipPriority;
  source?: string;
  created_at: string;
  is_dismissed?: boolean;
  is_acted?: boolean;
}

export interface HealthTipsParams {
  page?: number;
  limit?: number;
  category?: TipCategory;
  priority?: TipPriority;
}

export interface HealthTipsSummary {
  total: number;
  dismissed: number;
  acted: number;
  by_category?: Record<string, number>;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const healthTipsService = {
  async getFeatured(limit = 3): Promise<HealthTip[]> {
    const res = await api.get('/health-tips/featured', { params: { limit } });
    const data = res.data.data || res.data.result || res.data;
    return data?.tips || (Array.isArray(data) ? data : []);
  },

  async getAll(params?: HealthTipsParams): Promise<{ tips: HealthTip[]; total?: number }> {
    const res = await api.get('/health-tips', { params });
    const data = res.data.data || res.data.result || res.data;
    if (Array.isArray(data)) return { tips: data };
    return { tips: data?.tips || [], total: data?.total };
  },

  async generate(): Promise<HealthTip[]> {
    const res = await api.post('/health-tips/generate');
    const data = res.data.data || res.data.result || res.data;
    return data?.tips || (Array.isArray(data) ? data : []);
  },

  async dismiss(id: string): Promise<void> {
    await api.post(`/health-tips/${id}/dismiss`);
  },

  async markActed(id: string): Promise<void> {
    await api.post(`/health-tips/${id}/acted`);
  },

  async markViewed(id: string): Promise<void> {
    await api.post(`/health-tips/${id}/viewed`);
  },

  async getSummary(): Promise<HealthTipsSummary> {
    const res = await api.get('/health-tips/summary');
    return res.data.data || res.data.result || res.data;
  },
};
