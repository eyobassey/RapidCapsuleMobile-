import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  CategoryKey,
  DEFAULT_PREFS,
  NotificationPreferences,
  notificationsService,
} from '../../services/notifications.service';

// ─── Query key factory ────────────────────────────────────────────────────────

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
  stats: () => [...notificationKeys.all, 'stats'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

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
      return typeof data === 'number' ? data : 0;
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Fetches notification preferences and deep-merges the server response over
 * DEFAULT_PREFS so that quiet_hours and messaging_timing (which the current
 * API does not return) always have safe fallback values.
 */
export function useNotificationPreferencesQuery() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => notificationsService.getPreferences(),
    staleTime: 2 * 60 * 1000,
    select: (data): NotificationPreferences => ({
      ...DEFAULT_PREFS,
      ...data,
    }),
  });
}

export function useNotificationStatsQuery() {
  return useQuery({
    queryKey: notificationKeys.stats(),
    queryFn: () => notificationsService.getStats(),
    staleTime: 60 * 1000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useMarkReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Patches a subset of notification preferences with an optimistic update.
 *
 * The patch is applied to the cache immediately so the UI reflects the change
 * at the same frame as the toggle. If the server call fails the cache is
 * rolled back to the previous snapshot.
 *
 * Note: we do NOT invalidate after success — the optimistic data is already
 * correct and a background refetch would cause a visible flicker for rapid
 * toggling. The query goes stale after 2 min and will refetch naturally.
 */
export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<NotificationPreferences>) =>
      notificationsService.updatePreferences(patch),

    onMutate: async (patch) => {
      // Cancel any in-flight refetch so it doesn't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: notificationKeys.preferences() });

      const previous = queryClient.getQueryData<NotificationPreferences>(
        notificationKeys.preferences()
      );

      // Deep-merge patch into current cache. CategoryKey patches are one level
      // deep (ChannelFlags), so a shallow spread per key is enough.
      queryClient.setQueryData<NotificationPreferences>(notificationKeys.preferences(), (old) => {
        if (!old) return old;
        const next = { ...old };
        for (const k of Object.keys(patch) as Array<keyof NotificationPreferences>) {
          const patchVal = patch[k];
          const oldVal = old[k];
          if (
            patchVal !== null &&
            typeof patchVal === 'object' &&
            !Array.isArray(patchVal) &&
            oldVal !== null &&
            typeof oldVal === 'object'
          ) {
            // Merge nested objects (CategoryKey channels, quiet_hours, messaging_timing)
            (next as any)[k] = { ...(oldVal as object), ...(patchVal as object) };
          } else {
            (next as any)[k] = patchVal;
          }
        }
        return next;
      });

      return { previous };
    },

    onError: (_err, _patch, context) => {
      // Roll back cache to the pre-mutation snapshot
      if (context?.previous !== undefined) {
        queryClient.setQueryData(notificationKeys.preferences(), context.previous);
      }
      // Re-sync with server state after a failed mutation
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}

/**
 * Convenience wrapper that toggles a single channel flag within a category.
 * Builds the minimal patch ({ category: { channel: newValue } }) so the
 * server only receives exactly what changed.
 */
export function useToggleChannelMutation() {
  const updateMutation = useUpdateNotificationPreferencesMutation();
  const queryClient = useQueryClient();

  const toggle = (category: CategoryKey, channel: keyof NotificationPreferences[CategoryKey]) => {
    const current = queryClient.getQueryData<NotificationPreferences>(
      notificationKeys.preferences()
    );
    if (!current) return;

    const currentValue = current[category][channel];
    updateMutation.mutate({
      [category]: { ...current[category], [channel]: !currentValue },
    } as Partial<NotificationPreferences>);
  };

  return { toggle, isPending: updateMutation.isPending };
}
