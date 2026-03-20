import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { drEkaService } from '../../services/drEka.service';

// ─── Query key factory ────────────────────────────────────────────────────────

export const drEkaKeys = {
  all: ['drEka'] as const,
  dailyDigest: () => [...drEkaKeys.all, 'daily'] as const,
  digestHistory: (page: number) => [...drEkaKeys.all, 'dailyHistory', page] as const,
  weeklyReport: () => [...drEkaKeys.all, 'weekly'] as const,
  weeklyReports: (page: number) => [...drEkaKeys.all, 'weeklyHistory', page] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useTodaysDigestQuery() {
  return useQuery({
    queryKey: drEkaKeys.dailyDigest(),
    queryFn: () => drEkaService.getTodaysDigest(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDigestHistoryQuery(page = 1) {
  return useQuery({
    queryKey: drEkaKeys.digestHistory(page),
    queryFn: () => drEkaService.getDigestHistory(page),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLatestWeeklyReportQuery() {
  return useQuery({
    queryKey: drEkaKeys.weeklyReport(),
    queryFn: () => drEkaService.getLatestWeeklyReport(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWeeklyReportsQuery(page = 1) {
  return useQuery({
    queryKey: drEkaKeys.weeklyReports(page),
    queryFn: () => drEkaService.getWeeklyReports(page),
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useGenerateDigestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => drEkaService.generateDigest(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: drEkaKeys.all });
    },
  });
}

export function useGenerateWeeklyReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => drEkaService.generateWeeklyReport(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: drEkaKeys.all });
    },
  });
}
