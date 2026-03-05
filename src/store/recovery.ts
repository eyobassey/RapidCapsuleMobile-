import {create} from 'zustand';
import {recoveryService} from '../services/recovery.service';
import type {
  RecoveryProfile,
  DashboardData,
  SobrietyStats,
  Milestone,
  ScreeningResult,
  RecoveryPlan,
  ExerciseStats,
  RiskReport,
  GroupSession,
  PeerAssignment,
  MATCompliance,
  CompanionSessionSummary,
} from '../types/recovery.types';

interface RecoveryState {
  profile: RecoveryProfile | null;
  dashboard: DashboardData | null;
  stats: SobrietyStats | null;
  milestones: Milestone[];
  screeningHistory: ScreeningResult[];
  activePlan: RecoveryPlan | null;
  exerciseStats: ExerciseStats | null;
  riskHistory: RiskReport[];
  groupSessions: GroupSession[];
  peerAssignment: PeerAssignment | null;
  matCompliance: MATCompliance | null;
  recentConversations: CompanionSessionSummary[];
  chartData: Array<{date: string; value: number}>;
  isLoading: boolean;
  isEnrolled: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchMilestones: () => Promise<void>;
  fetchScreeningHistory: () => Promise<void>;
  fetchActivePlan: () => Promise<void>;
  fetchExerciseStats: () => Promise<void>;
  fetchRiskHistory: (period?: string) => Promise<void>;
  fetchGroupSessions: () => Promise<void>;
  fetchPeerAssignment: () => Promise<void>;
  fetchMATCompliance: () => Promise<void>;
  fetchRecentConversations: () => Promise<void>;
  fetchChartData: (metric?: string, days?: number) => Promise<void>;
  reset: () => void;
}

export const useRecoveryStore = create<RecoveryState>((set) => ({
  profile: null,
  dashboard: null,
  stats: null,
  milestones: [],
  screeningHistory: [],
  activePlan: null,
  exerciseStats: null,
  riskHistory: [],
  groupSessions: [],
  peerAssignment: null,
  matCompliance: null,
  recentConversations: [],
  chartData: [],
  isLoading: false,
  isEnrolled: false,
  error: null,

  fetchProfile: async () => {
    set({isLoading: true, error: null});
    try {
      const profile = await recoveryService.getProfile();
      set({
        profile,
        isEnrolled: !!profile && profile.status !== 'archived',
        isLoading: false,
      });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        set({profile: null, isEnrolled: false, isLoading: false});
      } else {
        set({
          error: err?.response?.data?.message || 'Failed to load recovery profile',
          isLoading: false,
        });
      }
    }
  },

  fetchDashboard: async () => {
    try {
      const dashboard = await recoveryService.getDashboard();
      set({dashboard});
    } catch {
      // silently fail
    }
  },

  fetchStats: async () => {
    try {
      const stats = await recoveryService.getStats();
      set({stats});
    } catch {
      // silently fail
    }
  },

  fetchMilestones: async () => {
    try {
      const milestones = await recoveryService.getMilestones();
      set({milestones: Array.isArray(milestones) ? milestones : []});
    } catch {
      // silently fail
    }
  },

  fetchScreeningHistory: async () => {
    try {
      const history = await recoveryService.getScreeningHistory({limit: 20});
      set({screeningHistory: history});
    } catch {
      // silently fail
    }
  },

  fetchActivePlan: async () => {
    try {
      const plan = await recoveryService.getActivePlan();
      set({activePlan: plan || null});
    } catch {
      set({activePlan: null});
    }
  },

  fetchExerciseStats: async () => {
    try {
      const stats = await recoveryService.getExerciseStats();
      set({exerciseStats: stats || null});
    } catch {
      set({exerciseStats: null});
    }
  },

  fetchRiskHistory: async (period?: string) => {
    try {
      const history = await recoveryService.getRiskHistory(period);
      set({riskHistory: Array.isArray(history) ? history : []});
    } catch {
      // silently fail
    }
  },

  fetchGroupSessions: async () => {
    try {
      const sessions = await recoveryService.getMyGroupSessions();
      set({groupSessions: Array.isArray(sessions) ? sessions : []});
    } catch {
      // silently fail
    }
  },

  fetchPeerAssignment: async () => {
    try {
      const assignments = await recoveryService.getPeerAssignments();
      const active = Array.isArray(assignments)
        ? assignments.find(a => a.status === 'active') || null
        : null;
      set({peerAssignment: active});
    } catch {
      set({peerAssignment: null});
    }
  },

  fetchMATCompliance: async () => {
    try {
      const compliance = await recoveryService.getMATCompliance();
      set({matCompliance: compliance || null});
    } catch {
      set({matCompliance: null});
    }
  },

  fetchRecentConversations: async () => {
    try {
      const sessions = await recoveryService.getRecentSessions();
      set({recentConversations: Array.isArray(sessions) ? sessions : []});
    } catch {
      // silently fail
    }
  },

  fetchChartData: async (metric = 'mood_score', days = 14) => {
    try {
      const data = await recoveryService.getChartData(metric, days);
      set({chartData: Array.isArray(data) ? data : []});
    } catch {
      set({chartData: []});
    }
  },

  reset: () => {
    set({
      profile: null,
      dashboard: null,
      stats: null,
      milestones: [],
      screeningHistory: [],
      activePlan: null,
      exerciseStats: null,
      riskHistory: [],
      groupSessions: [],
      peerAssignment: null,
      matCompliance: null,
      recentConversations: [],
      chartData: [],
      isLoading: false,
      isEnrolled: false,
      error: null,
    });
  },
}));
