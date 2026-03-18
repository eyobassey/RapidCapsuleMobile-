import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  ShareMessagesResponse,
  SharePlatform,
  referralsService,
} from '../../services/referrals.service';

// ─── Query key factory ────────────────────────────────────────────────────────

export const referralKeys = {
  all: ['referrals'] as const,
  me: () => [...referralKeys.all, 'me'] as const,
  stats: () => [...referralKeys.all, 'stats'] as const,
  shareMessages: () => [...referralKeys.all, 'shareMessages'] as const,
  settings: () => [...referralKeys.all, 'settings'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useMyReferralQuery() {
  return useQuery({
    queryKey: referralKeys.me(),
    queryFn: referralsService.getMyReferral,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useReferralStatsQuery() {
  return useQuery({
    queryKey: referralKeys.stats(),
    queryFn: referralsService.getStats,
    staleTime: 60_000,
    retry: 2,
  });
}

/** Returns the full response so consumers can access messages, referral_link, and referral_code */
export function useShareMessagesQuery() {
  return useQuery<ShareMessagesResponse>({
    queryKey: referralKeys.shareMessages(),
    queryFn: referralsService.getShareMessages,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useReferralSettingsQuery() {
  return useQuery({
    queryKey: referralKeys.settings(),
    queryFn: referralsService.getSettings,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useTrackShareMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (platform: SharePlatform) => referralsService.trackShare(platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.me() });
      queryClient.invalidateQueries({ queryKey: referralKeys.stats() });
    },
  });
}
