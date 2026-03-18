import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SharePlatform =
  | 'whatsapp'
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'email'
  | 'sms'
  | 'copy';

export type SharesByPlatform = Record<SharePlatform, number>;

export type ClicksByPlatform = {
  whatsapp: number;
  facebook: number;
  twitter: number;
  linkedin: number;
  email: number;
  direct: number;
  other: number;
};

export type Referral = {
  _id: string;
  referredUserId?: string;
  status: string;
  created_at: string;
};

export type ReferralData = {
  _id: string;
  referrer: string;
  referral_code: string;
  total_clicks: number;
  total_shares: number;
  total_signups: number;
  total_credits_earned: number;
  total_points_earned: number;
  milestones_achieved: string[];
  referrals: Referral[];
  shares_by_platform: SharesByPlatform;
  clicks_by_platform: ClicksByPlatform;
  last_shared_at?: string;
  created_at: string;
  updated_at: string;
};

export type ReferralStats = {
  total_clicks: number;
  total_shares: number;
  total_signups: number;
  conversion_rate: number;
  total_credits_earned: number;
  total_points_earned: number;
};

export type ShareMessages = Partial<Record<SharePlatform, string>>;

export type ReferralSettings = {
  is_enabled: boolean;
  referrer_credits: number;
  referee_credits: number;
  referrer_points: number;
  referee_points: number;
  reward_on_signup: boolean;
  reward_on_first_appointment: boolean;
  share_messages?: ShareMessages;
};

export type Milestone = {
  id: string;
  name: string;
  description: string;
  required_referrals: number;
  bonus_credits: number;
  icon?: string;
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const referralsService = {
  getMyReferral: async (): Promise<ReferralData> => {
    const res = await api.get('/referrals/me');
    return res.data.data;
  },

  getStats: async (): Promise<ReferralStats> => {
    const res = await api.get('/referrals/stats');
    return res.data.data;
  },

  getShareMessages: async (): Promise<ShareMessages> => {
    const res = await api.get('/referrals/share-messages');
    return res.data.data;
  },

  getSettings: async (): Promise<ReferralSettings> => {
    const res = await api.get('/referrals/settings');
    return res.data.data;
  },

  trackShare: async (platform: SharePlatform): Promise<void> => {
    await api.post('/referrals/track-share', { platform });
  },
};
