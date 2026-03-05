import {create} from 'zustand';
import {recoveryService} from '../services/recovery.service';
import type {
  RecoveryProfile,
  DashboardData,
  SobrietyStats,
  Milestone,
  ScreeningResult,
} from '../types/recovery.types';

interface RecoveryState {
  profile: RecoveryProfile | null;
  dashboard: DashboardData | null;
  stats: SobrietyStats | null;
  milestones: Milestone[];
  screeningHistory: ScreeningResult[];
  isLoading: boolean;
  isEnrolled: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchMilestones: () => Promise<void>;
  fetchScreeningHistory: () => Promise<void>;
  reset: () => void;
}

export const useRecoveryStore = create<RecoveryState>((set) => ({
  profile: null,
  dashboard: null,
  stats: null,
  milestones: [],
  screeningHistory: [],
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
      // 404 means not enrolled
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

  reset: () => {
    set({
      profile: null,
      dashboard: null,
      stats: null,
      milestones: [],
      screeningHistory: [],
      isLoading: false,
      isEnrolled: false,
      error: null,
    });
  },
}));
