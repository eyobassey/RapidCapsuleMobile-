import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { HealthTipsParams, healthTipsService } from '../../services/healthTips.service';

// ─── Query key factory ────────────────────────────────────────────────────────

export const healthTipKeys = {
  all: ['healthTips'] as const,
  featured: () => [...healthTipKeys.all, 'featured'] as const,
  list: (params?: HealthTipsParams) => [...healthTipKeys.all, 'list', params] as const,
  summary: () => [...healthTipKeys.all, 'summary'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useHealthTipsFeaturedQuery() {
  return useQuery({
    queryKey: healthTipKeys.featured(),
    queryFn: () => healthTipsService.getFeatured(3),
    staleTime: 5 * 60 * 1000,
  });
}

export function useHealthTipsQuery(params?: HealthTipsParams) {
  return useQuery({
    queryKey: healthTipKeys.list(params),
    queryFn: () => healthTipsService.getAll(params),
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useGenerateTipsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => healthTipsService.generate(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: healthTipKeys.all });
    },
  });
}

export function useDismissTipMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => healthTipsService.dismiss(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: healthTipKeys.all });
    },
  });
}

export function useMarkActedMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => healthTipsService.markActed(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: healthTipKeys.all });
    },
  });
}
