import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recoveryService } from '../../services/recovery.service';
import type { SobrietyLog } from '../../types/recovery.types';

// ── Query key factory ──────────────────────────────────────
export const recoveryKeys = {
  all: ['recovery'] as const,
  profile: () => [...recoveryKeys.all, 'profile'] as const,
  dashboard: () => [...recoveryKeys.all, 'dashboard'] as const,
  stats: () => [...recoveryKeys.all, 'stats'] as const,
  milestones: () => [...recoveryKeys.all, 'milestones'] as const,
  screeningHistory: () => [...recoveryKeys.all, 'screeningHistory'] as const,
  activePlan: () => [...recoveryKeys.all, 'activePlan'] as const,
  exerciseStats: () => [...recoveryKeys.all, 'exerciseStats'] as const,
  riskHistory: (period?: string) => [...recoveryKeys.all, 'riskHistory', period] as const,
  chartData: (metric: string, days: number) =>
    [...recoveryKeys.all, 'chart', metric, days] as const,
};

// ── Queries ────────────────────────────────────────────────

export function useRecoveryProfileQuery() {
  return useQuery({
    queryKey: recoveryKeys.profile(),
    queryFn: () => recoveryService.getProfile(),
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (not enrolled)
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useRecoveryDashboardQuery() {
  return useQuery({
    queryKey: recoveryKeys.dashboard(),
    queryFn: () => recoveryService.getDashboard(),
  });
}

export function useRecoveryStatsQuery() {
  return useQuery({
    queryKey: recoveryKeys.stats(),
    queryFn: () => recoveryService.getStats(),
  });
}

export function useRecoveryMilestonesQuery() {
  return useQuery({
    queryKey: recoveryKeys.milestones(),
    queryFn: async () => {
      const data = await recoveryService.getMilestones();
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useRecoveryEnrollmentsQuery() {
  return useQuery({
    queryKey: recoveryKeys.profile(),
    queryFn: () => recoveryService.getProfile(),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useRecoveryChartQuery(metric: string = 'mood_score', days: number = 14) {
  return useQuery({
    queryKey: recoveryKeys.chartData(metric, days),
    queryFn: async () => {
      const data = await recoveryService.getChartData(metric, days);
      return Array.isArray(data) ? data : [];
    },
  });
}

// ── Mutations ──────────────────────────────────────────────

export function useCheckInMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SobrietyLog>) => recoveryService.logDaily(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recoveryKeys.dashboard() });
      void queryClient.invalidateQueries({ queryKey: recoveryKeys.stats() });
      void queryClient.invalidateQueries({ queryKey: recoveryKeys.milestones() });
    },
  });
}

export function useCelebrateMilestoneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recoveryService.celebrateMilestone(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recoveryKeys.milestones() });
    },
  });
}
