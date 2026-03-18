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

export type SharesByPlatform = {
  whatsapp: number;
  facebook: number;
  twitter: number;
  linkedin: number;
  email: number;
  copy: number;
  sms: number;
};

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

// ─── Stats ────────────────────────────────────────────────────────────────────

export type ApiMilestone = {
  referrals_required: number;
  reward_type: string;
  reward_value: number;
  badge_name: string;
  badge_icon: string;
};

export type ReferralStats = {
  referral_code: string;
  total_clicks: number;
  total_shares: number;
  total_signups: number;
  total_credits_earned: number;
  total_points_earned: number;
  conversion_rate: string;
  recent_clicks: number;
  clicks_by_day: { date: string; count: number }[];
  shares_by_platform: SharesByPlatform;
  clicks_by_platform: ClicksByPlatform;
  milestones_achieved: string[];
  next_milestone: ApiMilestone | null;
  referrals: Referral[];
};

// ─── Share Messages ───────────────────────────────────────────────────────────

export type ShareMessagesMap = {
  whatsapp?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  email_subject?: string;
  email_body?: string;
  sms?: string;
};

export type ShareMessagesResponse = {
  messages: ShareMessagesMap;
  referral_link: string;
  referral_code: string;
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export type HeroBanner = {
  title: string;
  subtitle: string;
  background_color: string;
  text_color: string;
  show_stats: boolean;
};

export type ReferralSettings = {
  _id: string;
  is_enabled: boolean;
  referrer_credits: number;
  referee_credits: number;
  referrer_points: number;
  referee_points: number;
  reward_on_signup: boolean;
  reward_on_first_appointment: boolean;
  share_messages: ShareMessagesMap;
  hero_banner: HeroBanner;
  milestones: ApiMilestone[];
  created_at: string;
  updated_at: string;
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

  getShareMessages: async (): Promise<ShareMessagesResponse> => {
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
