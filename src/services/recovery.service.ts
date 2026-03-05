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
  CompanionSessionSummary,
  SubstanceHistory,
  RecoveryConsent,
  CareLevel,
  RecoveryPlan,
  ExerciseRecord,
  ExerciseStats,
  RiskReport,
  GroupSession,
  PeerAssignment,
  MATMedication,
  MATCompliance,
  HarmReductionSubstance,
  SubstanceGuidance,
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
    const raw = unwrap(await api.get('/recovery/profile/dashboard'));
    // API returns nested structure — transform to flat DashboardData
    const p = raw.profile || raw;
    const today = raw.today || {};
    const screenings = raw.screenings || {};
    const milestones = raw.milestones || {};
    const latestLog = raw.recent_logs?.[0];
    return {
      sobriety_days: p.sobriety_days ?? 0,
      sobriety_streak: p.sobriety_days ?? 0,
      longest_streak: Math.max(p.longest_sobriety_days ?? 0, p.sobriety_days ?? 0),
      risk_level: p.risk_level ?? 'low',
      risk_score: p.risk_score ?? 0,
      days_in_program: p.days_in_program ?? 0,
      recent_screening: screenings.latest
        ? {
            score: screenings.latest.total_score,
            risk_level: screenings.latest.risk_level,
            instrument: screenings.latest.instrument,
            date: screenings.latest.created_at,
          }
        : undefined,
      upcoming_milestones: milestones.recent || [],
      milestones_total: milestones.total ?? 0,
      next_milestone: milestones.next || undefined,
      daily_log_summary: {
        logged_today: today.logged ?? false,
        mood_score: latestLog?.mood_score ?? 0,
        craving_intensity: latestLog?.craving_intensity ?? 0,
        sober_today: latestLog?.sober_today ?? true,
      },
      mood_trend: (raw.mood_trend || []).map((m: any) => ({
        date: m.log_date,
        mood_score: m.mood_score,
        craving_intensity: m.craving_intensity,
      })),
    };
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
    return Array.isArray(res) ? res : res?.docs || res?.data || [];
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

  async getHarmReductionSubstances(): Promise<HarmReductionSubstance[]> {
    const res = unwrap(await api.get('/recovery/harm-reduction/substances'));
    return Array.isArray(res) ? res : res?.data || [];
  },

  async getSubstanceGuidance(substance: string): Promise<SubstanceGuidance> {
    return unwrap(await api.get(`/recovery/harm-reduction/guidance/${substance}`));
  },

  async getOverdoseResponse(substance: string): Promise<any> {
    return unwrap(await api.get(`/recovery/harm-reduction/overdose-response/${substance}`));
  },

  // ─── Recovery Plans ────────────────────────────
  async getActivePlan(): Promise<RecoveryPlan> {
    const raw = unwrap(await api.get('/recovery/plans/active'));
    if (!raw) return raw;
    // Map API structure to RecoveryPlan type
    return {
      _id: raw._id,
      patient: raw.user,
      specialist: raw.created_by?._id,
      title: raw.plan_name,
      status: raw.status,
      stages: (raw.stages || []).map((s: any) => ({
        _id: s.stage_id || s._id,
        name: s.stage_name || s.name,
        description: s.goals?.map((g: any) => g.measurable_target).filter(Boolean).join('; ') || '',
        status: s.status,
        estimated_weeks: s.estimated_duration_weeks || s.duration_weeks,
        goals: (s.goals || []).map((g: any) => ({
          _id: g.goal_id || g._id,
          description: g.description || g.title,
          status: g.status,
          completed_at: g.achieved_at,
        })),
      })),
      progress_percentage: raw.progress?.goal_completion_rate ?? 0,
      review_date: raw.next_review_date,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    };
  },

  async getPlanHistory(params?: {page?: number; limit?: number}): Promise<RecoveryPlan[]> {
    const res = unwrap(await api.get('/recovery/plans/history', {params}));
    return Array.isArray(res) ? res : res?.data || [];
  },

  async updateStageStatus(stageId: string, status: string): Promise<any> {
    return unwrap(await api.patch(`/recovery/plans/stages/${stageId}/status`, {status}));
  },

  async updateGoalStatus(stageId: string, goalId: string, status: string): Promise<any> {
    return unwrap(await api.patch(`/recovery/plans/stages/${stageId}/goals/${goalId}`, {status}));
  },

  // ─── Exercises ─────────────────────────────────
  async getExerciseHistory(params?: {category?: string; page?: number; limit?: number}): Promise<ExerciseRecord[]> {
    const res = unwrap(await api.get('/recovery/exercises/history', {params}));
    return Array.isArray(res) ? res : res?.data || [];
  },

  async getExerciseStats(): Promise<ExerciseStats> {
    return unwrap(await api.get('/recovery/exercises/stats'));
  },

  // ─── Risk Assessment ──────────────────────────
  async getCurrentRisk(): Promise<RiskReport> {
    return unwrap(await api.get('/recovery/risk/current'));
  },

  async getRiskHistory(period?: string): Promise<RiskReport[]> {
    const res = unwrap(await api.get('/recovery/risk/history', {params: {period}}));
    return Array.isArray(res) ? res : res?.data || [];
  },

  async getRiskAssessmentReports(params?: {page?: number; limit?: number}): Promise<RiskReport[]> {
    const res = unwrap(await api.get('/recovery/profile/risk-assessments', {params}));
    return Array.isArray(res) ? res : res?.data || [];
  },

  // ─── Group Sessions ───────────────────────────
  async getGroupSessions(params?: {status?: string; category?: string; page?: number; limit?: number}): Promise<GroupSession[]> {
    const res = unwrap(await api.get('/recovery/group-sessions', {params}));
    return Array.isArray(res) ? res : res?.data || [];
  },

  async getMyGroupSessions(): Promise<GroupSession[]> {
    const res = unwrap(await api.get('/recovery/group-sessions/my-sessions'));
    return Array.isArray(res) ? res : res?.data || [];
  },

  async joinGroupSession(id: string): Promise<any> {
    return unwrap(await api.post(`/recovery/group-sessions/${id}/join`));
  },

  async leaveGroupSession(id: string): Promise<any> {
    return unwrap(await api.post(`/recovery/group-sessions/${id}/leave`));
  },

  // ─── Peer Support ─────────────────────────────
  async getPeerAssignments(params?: {page?: number; limit?: number}): Promise<PeerAssignment[]> {
    const res = unwrap(await api.get('/recovery/peer-support', {params}));
    return Array.isArray(res) ? res : res?.data || [];
  },

  async consentPeerAssignment(id: string): Promise<PeerAssignment> {
    return unwrap(await api.post(`/recovery/peer-support/${id}/consent`));
  },

  async logPeerCheckIn(id: string, data: {mood?: number; notes?: string}): Promise<any> {
    return unwrap(await api.post(`/recovery/peer-support/${id}/check-in`, data));
  },

  async endPeerAssignment(id: string): Promise<any> {
    return unwrap(await api.post(`/recovery/peer-support/${id}/end`));
  },

  // ─── MAT (Medication-Assisted Treatment) ──────
  async getMATMedications(): Promise<MATMedication[]> {
    const res = unwrap(await api.get('/recovery/mat/medications'));
    return Array.isArray(res) ? res : res?.data || [];
  },

  async getMATCompliance(): Promise<MATCompliance> {
    return unwrap(await api.get('/recovery/mat/compliance'));
  },

  // ─── Companion (additional) ───────────────────
  async getRecentSessions(): Promise<CompanionSessionSummary[]> {
    const res = unwrap(await api.get('/recovery/companion'));
    return Array.isArray(res) ? res : res?.data || [];
  },
};
