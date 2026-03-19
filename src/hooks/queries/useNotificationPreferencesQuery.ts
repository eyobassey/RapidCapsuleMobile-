import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Channel,
  NotificationPreferences,
  PreferenceCategory,
  notificationPreferencesService,
} from '../../services/notification-preferences.service';

// ── Query key factory ──────────────────────────────────────
export const notificationPreferencesKeys = {
  all: ['notificationPreferences'] as const,
  detail: () => [...notificationPreferencesKeys.all, 'detail'] as const,
};

// ── Queries ────────────────────────────────────────────────

export function useNotificationPreferencesQuery() {
  return useQuery({
    queryKey: notificationPreferencesKeys.detail(),
    queryFn: () => notificationPreferencesService.getPreferences(),
  });
}

// ── Mutations ──────────────────────────────────────────────

export function useUpdatePreferenceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      category,
      channel,
      value,
    }: {
      category: PreferenceCategory;
      channel: Channel;
      value: boolean;
    }) => notificationPreferencesService.updatePreference(category, channel, value),

    // Optimistic update
    onMutate: async ({ category, channel, value }) => {
      await queryClient.cancelQueries({ queryKey: notificationPreferencesKeys.detail() });

      const previous = queryClient.getQueryData<NotificationPreferences>(
        notificationPreferencesKeys.detail()
      );

      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(notificationPreferencesKeys.detail(), {
          ...previous,
          [category]: {
            ...previous[category],
            [channel]: value,
          },
        });
      }

      return { previous };
    },

    onError: (_err, _vars, context) => {
      // Roll back on error
      if (context?.previous) {
        queryClient.setQueryData(notificationPreferencesKeys.detail(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationPreferencesKeys.all });
    },
  });
}
