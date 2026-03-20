import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Passkey } from 'react-native-passkey';

import {
  ChangePasswordPayload,
  Session,
  UserSettingsDefaults,
  securityService,
} from '../../services/security.service';

// ─── Query key factory ────────────────────────────────────────────────────────

export const securityKeys = {
  all: ['security'] as const,
  sessions: () => [...securityKeys.all, 'sessions'] as const,
  userSettings: () => [...securityKeys.all, 'userSettings'] as const,
  biometrics: () => [...securityKeys.all, 'biometrics'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetches all active sessions. Stale after 30 s to keep the list fresh. */
export function useSessionsQuery() {
  return useQuery({
    queryKey: securityKeys.sessions(),
    queryFn: () => securityService.getSessions(),
    staleTime: 30 * 1000,
    select: (sessions) => ({
      all: sessions,
      current: sessions.find((s) => s.isCurrent) ?? null,
      others: sessions.filter((s) => !s.isCurrent),
    }),
  });
}

/** Fetches the user settings (2FA state, WhatsApp toggle, etc.). */
export function useUserSettingsQuery() {
  return useQuery({
    queryKey: securityKeys.userSettings(),
    queryFn: () => securityService.getUserSettings(),
    staleTime: 5 * 60 * 1000,
    select: (settings) => settings?.defaults ?? {},
  });
}

/** Fetches registered biometric credentials for this user. */
export function useBiometricCredentialsQuery() {
  return useQuery({
    queryKey: securityKeys.biometrics(),
    queryFn: () => securityService.getBiometricCredentials(),
    staleTime: 5 * 60 * 1000,
    select: (creds) => ({
      credentials: creds,
      isEnabled: creds.length > 0,
    }),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Revokes a single session by ID.
 * Uses optimistic update: removes the session from cache immediately,
 * then invalidates to sync with server if something goes wrong.
 */
export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => securityService.revokeSession(sessionId),

    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: securityKeys.sessions() });
      const previous = queryClient.getQueryData<Session[]>(securityKeys.sessions());

      queryClient.setQueryData<Session[]>(securityKeys.sessions(), (old) =>
        old ? old.filter((s) => s._id !== sessionId) : []
      );

      return { previous };
    },

    onError: (_err, _sessionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(securityKeys.sessions(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.sessions() });
    },
  });
}

/**
 * Revokes all sessions except the current one.
 * Optimistically removes all non-current sessions from cache.
 */
export function useRevokeAllSessionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => securityService.revokeAllOtherSessions(),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: securityKeys.sessions() });
      const previous = queryClient.getQueryData<Session[]>(securityKeys.sessions());

      queryClient.setQueryData<Session[]>(securityKeys.sessions(), (old) =>
        old ? old.filter((s) => s.isCurrent) : []
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(securityKeys.sessions(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.sessions() });
    },
  });
}

/**
 * Updates user settings (2FA enable/disable, method, WhatsApp toggle).
 * Optimistically patches the cache so the UI responds instantly.
 */
export function useUpdateUserSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<UserSettingsDefaults>) =>
      securityService.updateUserSettings({ defaults: patch }),

    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: securityKeys.userSettings() });
      const previous = queryClient.getQueryData(securityKeys.userSettings());

      queryClient.setQueryData(securityKeys.userSettings(), (old: any) => ({
        ...(old ?? {}),
        ...patch,
      }));

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(securityKeys.userSettings(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.userSettings() });
    },
  });
}

/** Changes the account password. No cache interaction needed. */
export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => securityService.changePassword(payload),
  });
}

/** Removes a biometric credential. Invalidates biometrics cache on success. */
export function useDeleteBiometricMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentialId: string) => securityService.deleteBiometricCredential(credentialId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.biometrics() });
    },
  });
}

/**
 * Runs the full WebAuthn passkey registration ceremony:
 * 1. Fetch options from the server.
 * 2. Invoke the platform authenticator (Face ID / fingerprint prompt).
 * 3. Send the credential back to the server for verification.
 *
 * Invalidates the biometrics cache on success so the UI updates immediately.
 */
export function useRegisterPasskeyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceName?: string) => {
      const options = await securityService.getPasskeyRegistrationOptions();
      console.log('[Passkey] registration options rpId:', options.rp?.id);
      const credential = await Passkey.create(options);
      await securityService.verifyPasskeyRegistration(credential, deviceName);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityKeys.biometrics() });
    },
  });
}
