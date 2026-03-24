import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { prescriptionsService } from '../../services/prescriptions.service';

// ── Query key factory ──────────────────────────────────────
export const prescriptionKeys = {
  all: ['prescriptions'] as const,
  list: () => [...prescriptionKeys.all, 'list'] as const,
  detail: (id: string) => [...prescriptionKeys.all, 'detail', id] as const,
};

// ── Queries ────────────────────────────────────────────────

export function usePrescriptionsQuery() {
  return useQuery({
    queryKey: prescriptionKeys.list(),
    queryFn: async () => {
      const data = await prescriptionsService.fetchAll();
      return Array.isArray(data) ? data : [];
    },
  });
}

export function usePrescriptionQuery(id: string) {
  return useQuery({
    queryKey: prescriptionKeys.detail(id),
    queryFn: () => prescriptionsService.getById(id),
    enabled: !!id,
  });
}

// ── Mutations ──────────────────────────────────────────────

export function useAcceptPrescriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prescriptionsService.accept(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: prescriptionKeys.all });
    },
  });
}

export function useDeclinePrescriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prescriptionsService.decline(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: prescriptionKeys.all });
    },
  });
}
