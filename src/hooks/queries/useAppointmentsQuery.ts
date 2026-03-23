import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsService } from '../../services/appointments.service';

// ── Query key factory ──────────────────────────────────────
export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (status: string) => [...appointmentKeys.lists(), status] as const,
  detail: (id: string) => [...appointmentKeys.all, 'detail', id] as const,
  specialists: () => [...appointmentKeys.all, 'specialists'] as const,
  specialistSearch: (params: Record<string, any>) =>
    [...appointmentKeys.specialists(), params] as const,
  availableTimes: (specialistId: string, date: string) =>
    [...appointmentKeys.all, 'availableTimes', specialistId, date] as const,
  categories: () => [...appointmentKeys.all, 'categories'] as const,
};

// ── Status mapping (mirrors the store logic) ───────────────
const STATUS_MAP: Record<string, string> = {
  upcoming: 'OPEN',
  past: 'COMPLETED',
  missed: 'MISSED',
  cancelled: 'CANCELLED',
};

// ── Queries ────────────────────────────────────────────────

export function useAppointmentsQuery(
  filter: 'upcoming' | 'past' | 'missed' | 'cancelled' = 'upcoming'
) {
  const status = STATUS_MAP[filter] || filter;
  return useQuery({
    queryKey: appointmentKeys.list(status),
    queryFn: async () => {
      const data = await appointmentsService.list({ status });
      const list = Array.isArray(data) ? data : data?.data || data?.result || [];
      return Array.isArray(list) ? list : [];
    },
  });
}

export function useSpecialistsQuery(params: Record<string, any>) {
  return useQuery({
    queryKey: appointmentKeys.specialistSearch(params),
    queryFn: () => appointmentsService.getAvailableSpecialists(params),
    enabled:
      !!params.category ||
      !!params.specialization ||
      !!params.specialist_category ||
      !!params.professional_category,
  });
}

export function useAvailableTimesQuery(specialistId: string, date: string) {
  return useQuery({
    queryKey: appointmentKeys.availableTimes(specialistId, date),
    queryFn: () =>
      appointmentsService.getAvailableTimes({
        specialistId,
        preferredDates: [{ date }],
      }),
    enabled: !!specialistId && !!date,
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: appointmentKeys.categories(),
    queryFn: async () => {
      const data = await appointmentsService.getSpecialistCategories();
      const cats = Array.isArray(data) ? data : data?.all || data?.popular || [];
      return Array.isArray(cats) ? cats : [];
    },
    staleTime: 30 * 60 * 1000, // categories rarely change
  });
}

// ── Mutations ──────────────────────────────────────────────

export function useBookAppointmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => appointmentsService.book(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

export function useRescheduleAppointmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => appointmentsService.reschedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}

export function useCancelAppointmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}
