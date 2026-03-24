import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vitalsService } from '../../services/vitals.service';

// ── Query key factory ──────────────────────────────────────
export const vitalKeys = {
  all: ['vitals'] as const,
  list: () => [...vitalKeys.all, 'list'] as const,
  recent: () => [...vitalKeys.all, 'recent'] as const,
  chart: (type: string, period: string) => [...vitalKeys.all, 'chart', type, period] as const,
};

// ── Queries ────────────────────────────────────────────────

export function useVitalsQuery() {
  return useQuery({
    queryKey: vitalKeys.list(),
    queryFn: async () => {
      const data = await vitalsService.list();
      return data && typeof data === 'object' ? data : {};
    },
  });
}

export function useRecentVitalsQuery() {
  return useQuery({
    queryKey: vitalKeys.recent(),
    queryFn: async () => {
      const data = await vitalsService.getRecent();
      return data && typeof data === 'object' ? data : {};
    },
  });
}

export function useVitalChartQuery(type: string, period: string) {
  return useQuery({
    queryKey: vitalKeys.chart(type, period),
    queryFn: () => vitalsService.getChartData({ vitalToSelect: type, duration: period }),
    enabled: !!type && !!period,
  });
}

// ── Mutations ──────────────────────────────────────────────

export function useLogVitalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => vitalsService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vitalKeys.all });
    },
  });
}
