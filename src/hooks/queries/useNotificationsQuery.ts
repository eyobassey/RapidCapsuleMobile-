import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {notificationsService} from '../../services/notifications.service';

// ── Query key factory ──────────────────────────────────────
export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
};

// ── Queries ────────────────────────────────────────────────

export function useNotificationsQuery() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: async () => {
      const data = await notificationsService.list();
      return data || [];
    },
  });
}

export function useUnreadCountQuery() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const data = await notificationsService.getUnreadCount();
      return typeof data === 'number' ? data : data?.count || 0;
    },
    staleTime: 60 * 1000, // refresh unread count more frequently
  });
}

// ── Mutations ──────────────────────────────────────────────

export function useMarkReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: notificationKeys.all});
    },
  });
}

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: notificationKeys.all});
    },
  });
}
