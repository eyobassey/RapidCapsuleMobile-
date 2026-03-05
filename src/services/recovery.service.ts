import api from './api';
import type {
  RecoveryProfile,
  DashboardData,
  SobrietyLog,
  SobrietyStats,
  ScreeningResult,
  ScreeningQuestion,
  ScreeningInstrument,
  Milestone,
  CompanionSession,
  CompanionMessage,
  SubstanceHistory,
  RecoveryConsent,
  CareLevel,
} from '../types/recovery.types';

const unwrap = (res: any) => res.data.data ?? res.data.result ?? res.data;

export const recoveryService = {
  // ─── Profile ────────────────────────────────────
  async getProfile(): Promise<RecoveryProfile> {
    return unwrap(await api.get('/recovery/profile'));
  },

  async createProfile(data: {
    substance_use_history: SubstanceHistory[];
    sobriety_start_date?: string;
    care_level?: CareLevel;
    consent?: RecoveryConsent;
  }): Promise<RecoveryProfile> {
    return unwrap(await api.post('/recovery/profile', data));
  },

  async getDashboard(): Promise<DashboardData> {
    return unwrap(await api.get('/recovery/profile/dashboard'));
  },

  async updateStatus(status: string, reason?: string): Promise<RecoveryProfile> {
    return unwrap(await api.patch('/recovery/profile/status', {status, reason}));
  },

  // ─── Sobriety ───────────────────────────────────
  async logDaily(data: Partial<SobrietyLog>): Promise<{log: SobrietyLog; milestones_awarded: Milestone[]; is_update: boolean}> {
    return unwrap(await api.post('/recovery/sobriety/log', data));
  },

  async getLogs(params?: {start_date?: string; end_date?: string; limit?: number}): Promise<SobrietyLog[]> {
    return unwrap(await api.get('/recovery/sobriety/logs', {params}));
  },

  async getStats(): Promise<SobrietyStats> {
    return unwrap(await api.get('/recovery/sobriety/stats'));
  },

  async getChartData(metric?: string, days?: number): Promise<Array<{date: string; value: number}>> {
    return unwrap(await api.get('/recovery/sobriety/chart', {params: {metric, days}}));
  },

  async getMilestones(): Promise<Milestone[]> {
    return unwrap(await api.get('/recovery/sobriety/milestones'));
  },

  async celebrateMilestone(id: string): Promise<Milestone> {
    return unwrap(await api.patch(`/recovery/sobriety/milestones/${id}/celebrate`));
  },

  // ─── Screening ──────────────────────────────────
  async beginScreening(instrument: ScreeningInstrument): Promise<{
    instrument_id: string;
    instrument_name: string;
    short_name: string;
    description: string;
    estimated_minutes: number;
    total_questions: number;
    questions: ScreeningQuestion[];
    scoring: {min_score: number; max_score: number};
  }> {
    return unwrap(await api.post('/recovery/screening', {instrument}));
  },

  async submitScreening(instrument: string, answers: Record<string, number>, duration_ms?: number): Promise<ScreeningResult> {
    return unwrap(await api.post(`/recovery/screening/${instrument}/submit`, {answers, duration_ms}));
  },

  async getAIInterpretation(screeningId: string): Promise<ScreeningResult> {
    return unwrap(await api.post(`/recovery/screening/${screeningId}/ai-interpretation`));
  },

  async getRecommendedInstrument(): Promise<{instrument: string; reason: string}> {
    return unwrap(await api.get('/recovery/screening/recommended'));
  },

  async getScreeningHistory(params?: {instrument?: string; page?: number; limit?: number}): Promise<ScreeningResult[]> {
    const res = unwrap(await api.get('/recovery/screening/history', {params}));
    return Array.isArray(res) ? res : res?.data || [];
  },

  async getScreeningById(id: string): Promise<ScreeningResult> {
    return unwrap(await api.get(`/recovery/screening/${id}`));
  },

  // ─── Companion ──────────────────────────────────
  async startCompanion(context?: string): Promise<CompanionSession> {
    return unwrap(await api.post('/recovery/companion/start', {context}));
  },

  async sendCompanionMessage(sessionId: string, message: string): Promise<CompanionMessage> {
    return unwrap(await api.post(`/recovery/companion/${sessionId}/message`, {message}));
  },

  async endCompanion(sessionId: string): Promise<any> {
    return unwrap(await api.post(`/recovery/companion/${sessionId}/end`));
  },

  async getCheckInPrompt(): Promise<{prompt: string; context: any}> {
    return unwrap(await api.get('/recovery/companion/check-in-prompt'));
  },

  // ─── Crisis ─────────────────────────────────────
  async triggerEmergency(reason?: string): Promise<any> {
    return unwrap(await api.post('/recovery/crisis/emergency', {reason}));
  },

  async getCrisisHistory(params?: {page?: number; limit?: number}): Promise<any[]> {
    const res = unwrap(await api.get('/recovery/crisis/patient/history', {params}));
    return Array.isArray(res) ? res : res?.data || [];
  },

  // ─── Harm Reduction ─────────────────────────────
  async getEmergencyResources(): Promise<any> {
    return unwrap(await api.get('/recovery/harm-reduction/emergency-resources'));
  },
};
