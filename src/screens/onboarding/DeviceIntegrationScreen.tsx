import {
  Activity,
  CheckCircle,
  Clock,
  Heart,
  RefreshCw,
  Smartphone,
  X,
  XCircle,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Modal,
  Platform,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import SectionScreenLayout from '../../components/onboarding/SectionScreenLayout';
import { Text } from '../../components/ui';
import { parseApiError } from '../../services/api-error';
import { appleHealthService } from '../../services/appleHealth.service';
import { healthIntegrationsService } from '../../services/healthIntegrations.service';
import { usersService } from '../../services/users.service';
import { useAuthStore } from '../../store/auth';
import { useOnboardingStore } from '../../store/onboarding';
import { colors } from '../../theme/colors';

// Display-only metadata keyed by provider ID.
// The API (GET /health-integrations/providers) is the source of truth for which
// providers are actually supported — this map only controls how each one looks.
const PROVIDER_META: Record<
  string,
  {
    name: string;
    icon: any;
    color: string;
    description: string;
    platform: 'ios' | 'android' | 'all';
  }
> = {
  google_fit: {
    name: 'Google Fit',
    icon: Activity,
    color: '#4285F4',
    description: 'Steps, heart rate, activity, sleep',
    platform: 'android',
  },
  apple_health: {
    name: 'Apple Health',
    icon: Heart,
    color: '#FF2D55',
    description: 'Vitals, activity, sleep via HealthKit',
    platform: 'ios',
  },
  garmin: {
    name: 'Garmin',
    icon: Activity,
    color: '#00B0B9',
    description: 'Steps, heart rate, sleep, weight',
    platform: 'all',
  },
  samsung_health: {
    name: 'Samsung Health',
    icon: Smartphone,
    color: '#1428A0',
    description: 'Steps, heart rate, sleep, stress',
    platform: 'android',
  },
  polar: {
    name: 'Polar',
    icon: Activity,
    color: '#D9232D',
    description: 'Heart rate, training, recovery',
    platform: 'all',
  },
  suunto: {
    name: 'Suunto',
    icon: Activity,
    color: '#00A0E3',
    description: 'Heart rate, activity, outdoor sports',
    platform: 'all',
  },
  whoop: {
    name: 'WHOOP',
    icon: Activity,
    color: '#00FF87',
    description: 'Recovery, strain, sleep tracking',
    platform: 'all',
  },
};

type IntegrationStatus = 'connected' | 'pending' | 'error' | 'disconnected';

interface Integration {
  provider: string;
  status: IntegrationStatus;
  lastSyncAt?: string;
  syncSettings?: { autoSync?: boolean };
}

export default function DeviceIntegrationScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const clearDraft = useOnboardingStore((s) => s.clearDraft);

  const [providers, setProviders] = useState<string[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [oauthProvider, setOauthProvider] = useState<string | null>(null);
  const [healthKitSupported, setHealthKitSupported] = useState<boolean>(false);

  const [consents, setConsents] = useState({
    vitals_auto_sync: false,
    activity_tracking: false,
    sleep_tracking: false,
  });
  const [notifications, setNotifications] = useState({
    health_reminders: true,
    medication_reminders: true,
    wellness_tips: false,
  });
  const [saving, setSaving] = useState(false);

  // Apple Health sync progress sheet
  interface SyncSheetState {
    visible: boolean;
    percent: number;
    label: string;
    done: boolean;
    synced: number;
    failed: boolean;
  }
  const [syncSheet, setSyncSheet] = useState<SyncSheetState>({
    visible: false,
    percent: 0,
    label: '',
    done: false,
    synced: 0,
    failed: false,
  });
  const progressAnim = useRef(new Animated.Value(0)).current;
  // Tracks whether the component is still mounted — prevents state updates
  // from in-flight sync tasks after the user has navigated away.
  const mountedRef = useRef(true);
  // Guards against starting a second parallel sync while one is already in flight.
  // A plain ref (not state) so toggling it never triggers a re-render.
  const isSyncingAppleHealthRef = useRef(false);
  // Set to true when the user taps "Run in background" so the completion
  // handler knows it needs to surface a notification instead of updating the sheet.
  const syncDismissedRef = useRef(false);
  // Holds a completed sync result that arrived while the app was backgrounded,
  // so the AppState listener can surface it when the app returns to the foreground.
  const pendingSyncResultRef = useRef<{ synced: number; failed: boolean } | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Show a notification when the app comes back to the foreground after a sync
  // that completed while the app was suspended in the background.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && pendingSyncResultRef.current !== null) {
        const { synced, failed } = pendingSyncResultRef.current;
        pendingSyncResultRef.current = null;
        if (failed) {
          Alert.alert('Sync Failed', 'Apple Health sync encountered an error. Please try again.');
        } else {
          Alert.alert(
            'Apple Health Sync Complete',
            synced > 0
              ? `${synced} health reading${synced === 1 ? '' : 's'} synced to your profile.`
              : 'No new health data found.'
          );
        }
      }
    });
    return () => subscription.remove();
  }, []);

  // Smoothly animate the progress bar whenever percent changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: syncSheet.percent,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [syncSheet.percent, progressAnim]);

  // Load user prefs
  useEffect(() => {
    const di = user?.device_integration;
    if (di) {
      if (di.data_sharing_consents) {
        setConsents((prev) => ({ ...prev, ...di.data_sharing_consents }));
      }
      if (di.notification_preferences) {
        setNotifications((prev) => ({ ...prev, ...di.notification_preferences }));
      }
    }
  }, [user]);

  // Load supported providers + active integrations from backend
  const loadIntegrations = useCallback(async () => {
    try {
      const [providerData, integrationData] = await Promise.allSettled([
        healthIntegrationsService.getProviders(),
        healthIntegrationsService.getIntegrations(),
      ]);

      if (providerData.status === 'fulfilled' && Array.isArray(providerData.value)) {
        // Backend may return objects or plain strings — normalise to IDs
        setProviders(
          providerData.value
            .map((p: any) => (typeof p === 'string' ? p : p.id ?? p.provider ?? p.name))
            .filter(Boolean)
        );
      }

      if (integrationData.status === 'fulfilled') {
        setIntegrations(Array.isArray(integrationData.value) ? integrationData.value : []);
      }
    } catch {
      // Silently fail — page still usable with empty state
    } finally {
      setLoadingIntegrations(false);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supported = await appleHealthService.isSupported();
      if (mounted) setHealthKitSupported(supported);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const getIntegrationStatus = (appId: string): IntegrationStatus => {
    const integration = integrations.find((i: any) => i.provider === appId);
    return (integration?.status as IntegrationStatus) || 'disconnected';
  };

  const getLastSync = (appId: string): string | undefined => {
    const integration = integrations.find((i: any) => i.provider === appId);
    return (integration as any)?.lastSyncAt || (integration as any)?.updatedAt;
  };

  const openOAuthInSystemBrowser = useCallback(
    async (appId: string, authUrl: string) => {
      // Google OAuth (incl. Fit scopes) rejects embedded WebViews (`disallowed_useragent`).
      // Use system browser (ASWebAuthenticationSession / Chrome Custom Tabs).
      const redirectUrl = 'rapidcapsule://health-integrations/callback';

      try {
        // Lazy require to avoid Jest parsing ESM from node_modules.

        const InAppBrowser = require('react-native-inappbrowser-reborn').default;

        const available = await InAppBrowser.isAvailable();
        if (!available) {
          return { handled: false as const };
        }

        const result = await InAppBrowser.openAuth(authUrl, redirectUrl, {
          // Production-friendly defaults
          showTitle: true,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
          ephemeralWebSession: false,
        } as any);

        // Even if the browser is closed/cancelled, the user may have completed auth.
        // We always refresh integration status after returning to the app.
        await loadIntegrations();

        if ((result as any)?.type === 'success') {
          Alert.alert('Connected', `${appId} connected successfully.`);
        }

        return { handled: true as const };
      } catch (e: any) {
        console.warn('OAuth browser flow failed:', e?.message || e);
        return { handled: false as const };
      }
    },
    [loadIntegrations]
  );

  // Runs an Apple Health sync with real-time progress reporting.
  // Fires-and-forgets safely — the progress sheet handles all feedback.
  // The caller should NOT await this if they want background behaviour.
  const onSyncProgress = useCallback((percent: number, label: string) => {
    if (!mountedRef.current) return;
    setSyncSheet((prev) => ({ ...prev, percent, label }));
  }, []);

  const runAppleHealthSync = useCallback(async () => {
    if (!mountedRef.current || isSyncingAppleHealthRef.current) return;
    isSyncingAppleHealthRef.current = true;
    syncDismissedRef.current = false;
    setSyncSheet({
      visible: true,
      percent: 0,
      label: 'Preparing...',
      done: false,
      synced: 0,
      failed: false,
    });

    try {
      const result = await appleHealthService.fetchAndSync(onSyncProgress);
      const syncedAt = new Date().toISOString();

      if (mountedRef.current) {
        // Update sheet to done state
        setSyncSheet((prev) => ({
          ...prev,
          percent: 100,
          label: result.synced > 0 ? 'Sync complete' : 'No new data found',
          done: true,
          synced: result.synced,
          failed: false,
        }));

        // Optimistically stamp the last-sync date on the card so the user
        // sees it update immediately without waiting for loadIntegrations().
        if (result.synced > 0) {
          setIntegrations((prev) =>
            prev.map((i: any) =>
              i.provider === 'apple_health' ? { ...i, lastSyncAt: syncedAt } : i
            )
          );
        }
      }

      // Notify if the user is not watching the progress sheet
      if (syncDismissedRef.current || !mountedRef.current) {
        const message =
          result.synced > 0
            ? `${result.synced} health reading${
                result.synced === 1 ? '' : 's'
              } synced to your profile.`
            : 'No new health data found.';

        if (AppState.currentState === 'active') {
          // App is in the foreground on a different screen — show an alert immediately
          Alert.alert('Apple Health Sync Complete', message);
        } else {
          // App is backgrounded — queue to show when it returns to foreground
          pendingSyncResultRef.current = { synced: result.synced, failed: false };
        }
      }
    } catch {
      if (mountedRef.current) {
        setSyncSheet((prev) => ({
          ...prev,
          percent: 100,
          label: 'Sync failed',
          done: true,
          failed: true,
        }));
      }

      if (syncDismissedRef.current || !mountedRef.current) {
        if (AppState.currentState === 'active') {
          Alert.alert('Sync Failed', 'Apple Health sync encountered an error. Please try again.');
        } else {
          pendingSyncResultRef.current = { synced: 0, failed: true };
        }
      }
    } finally {
      isSyncingAppleHealthRef.current = false;
      // Always refresh integration card to pick up backend-confirmed state
      if (mountedRef.current) {
        await loadIntegrations();
      }
    }
  }, [onSyncProgress, loadIntegrations]);

  // Connect
  const handleConnect = async (appId: string) => {
    setConnecting(appId);
    try {
      if (appId === 'apple_health') {
        const permitted = await appleHealthService.requestPermissions();
        if (!permitted) {
          Alert.alert(
            'Permission Required',
            'Please enable HealthKit access in Settings > Privacy & Security > Health > RapidCapsule.'
          );
          return;
        }
      }

      const result = await healthIntegrationsService.connect({
        provider: appId,
        autoSync: true,
        // Apple Health is on-device only — the app pushes data to the backend,
        // the server can never pull from HealthKit directly.
        syncDirection: appId === 'apple_health' ? 'push' : 'bidirectional',
        // Declare every metric we actually collect from HealthKit so the backend
        // knows what data types this integration will provide.
        dataTypes:
          appId === 'apple_health'
            ? [
                'pulse_rate',
                'spo2',
                'body_temp',
                'body_weight',
                'blood_pressure',
                'blood_sugar_level',
                'steps',
                'sleep',
                'respiratory_rate',
                'calories_burned',
                'body_fat',
                'distance',
              ]
            : undefined,
      });

      if (appId === 'apple_health') {
        // Optimistically mark as connected so the UI updates immediately.
        // The backend may take a moment to reflect the status change.
        setIntegrations((prev: any[]) => {
          const existing = prev.find((i: any) => i.provider === appId);
          if (existing) {
            return prev.map((i: any) => (i.provider === appId ? { ...i, status: 'connected' } : i));
          }
          return [
            ...prev,
            { provider: appId, status: 'connected', lastSyncAt: new Date().toISOString() },
          ];
        });
        // Fire sync in background — the progress sheet gives the user full visibility
        // and lets them dismiss it while the data is still uploading.
        runAppleHealthSync();
      } else if (result?.requiresNativeApp) {
        Alert.alert('Not Available', 'This provider requires native SDK support.');
      } else if (result?.authUrl) {
        if (appId === 'google_fit') {
          const handled = await openOAuthInSystemBrowser(appId, result.authUrl);
          if (handled.handled) return;
        }

        // OAuth flow fallback — open in WebView (some providers still allow it)
        setOauthProvider(appId);
        setOauthUrl(result.authUrl);
      } else {
        // Backend connected the provider directly (no OAuth redirect needed).
        // Refresh UI and confirm to the user.
        await loadIntegrations();
        const meta = PROVIDER_META[appId];
        Alert.alert('Connected', `${meta?.name ?? appId} connected successfully.`);
      }
    } catch (err: any) {
      const msg = parseApiError(err).message;
      if (msg.includes('already connected')) {
        Alert.alert('Already Connected', `${appId} is already connected.`);
        await loadIntegrations();
      } else {
        Alert.alert('Connection Error', msg);
      }
    } finally {
      setConnecting(null);
    }
  };

  // Disconnect
  const handleDisconnect = (appId: string) => {
    const app = { id: appId, ...PROVIDER_META[appId] };
    Alert.alert(
      `Disconnect ${app?.name}?`,
      'This will stop syncing health data from this provider. Your existing data will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            setConnecting(appId);
            try {
              await healthIntegrationsService.disconnect(appId);
              await loadIntegrations();
            } catch (err: any) {
              Alert.alert('Error', parseApiError(err).message);
            } finally {
              setConnecting(null);
            }
          },
        },
      ]
    );
  };

  // Manual sync
  const handleSync = async (appId: string) => {
    setSyncing(appId);
    try {
      if (appId === 'apple_health' && appleHealthService.isAvailable()) {
        // Progress sheet owns all feedback for Apple Health syncs.
        // Fire without awaiting so the finally block clears the card spinner
        // immediately — the sheet shows the real progress independently.
        void runAppleHealthSync();
      } else {
        await healthIntegrationsService.sync(appId);
        Alert.alert('Sync Complete', 'Your health data has been synced.');
        await loadIntegrations();
      }
    } catch (err: any) {
      Alert.alert('Sync Error', parseApiError(err).message);
    } finally {
      setSyncing(null);
    }
  };

  // OAuth WebView navigation
  const handleOAuthNavigation = useCallback(
    (navState: { url: string }) => {
      const url = navState.url || '';
      // Detect callback redirect (backend handles OAuth and redirects)
      if (
        oauthUrl &&
        url !== oauthUrl &&
        (url.includes('api.rapidcapsule.com/api/health-integrations/callback') ||
          url.includes('/health-integrations/callback') ||
          // Detect success/error pages
          url.includes('integration-success') ||
          url.includes('integration-error'))
      ) {
        setOauthUrl(null);
        setOauthProvider(null);
        // Refresh integrations to see new connection
        loadIntegrations();
      }
    },
    [oauthUrl, loadIntegrations]
  );

  // Toggle connect/disconnect
  const handleToggle = (appId: string) => {
    if (appId === 'apple_health' && !healthKitSupported) {
      Alert.alert(
        'Apple Health Not Available',
        'Apple Health is only available on a physical iPhone with HealthKit enabled for this app.'
      );
      return;
    }
    const status = getIntegrationStatus(appId);
    if (status === 'connected') {
      handleDisconnect(appId);
    } else {
      handleConnect(appId);
    }
  };

  // Save preferences
  const handleSave = async () => {
    setSaving(true);
    try {
      const connectedApps = integrations
        .filter((i: any) => i.status === 'connected')
        .map((i: any) => i.provider);

      await usersService.updateProfile({
        device_integration: {
          health_apps_connected: connectedApps,
          devices_connected: [],
          data_sharing_consents: consents,
          notification_preferences: notifications,
        },
      });
      clearDraft('deviceIntegration');
      await fetchUser();
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const StatusIcon = ({ status }: { status: IntegrationStatus }) => {
    if (status === 'connected') return <CheckCircle size={16} color={colors.success} />;
    if (status === 'pending') return <Clock size={16} color={colors.secondary} />;
    if (status === 'error') return <XCircle size={16} color={colors.destructive} />;
    return null;
  };

  return (
    <SectionScreenLayout
      title="Devices & Health Apps"
      description="Connect your health apps to automatically sync vitals, activity, and sleep data."
      onBack={() => navigation.goBack()}
      onSave={handleSave}
      loading={saving}
    >
      {/* Health Apps */}
      <Text
        style={{
          fontSize: 14,
          fontWeight: '700',
          color: colors.foreground,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingBottom: 8,
          marginBottom: 16,
        }}
      >
        Health Apps
      </Text>

      {loadingIntegrations ? (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 8 }}>
            Loading integrations...
          </Text>
        </View>
      ) : providers.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, textAlign: 'center' }}>
            No health providers available. Check your connection and try again.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10, marginBottom: 24 }}>
          {providers
            .map((id) => ({ id, meta: PROVIDER_META[id] }))
            .filter(({ id, meta }) => {
              if (!meta) return false;
              const platformSupported = meta.platform === 'all' || meta.platform === Platform.OS;
              const isConnected = getIntegrationStatus(id) === 'connected';
              // Show if platform is supported, OR if already connected (so user can disconnect)
              return platformSupported || isConnected;
            })
            .map(({ id, meta }) => {
              const app = { id, ...meta! };
              const platformSupported = app.platform === 'all' || app.platform === Platform.OS;
              const status = getIntegrationStatus(app.id);
              const isConnected = status === 'connected';
              const isConnecting = connecting === app.id;
              const isSyncing = syncing === app.id;
              const lastSync = getLastSync(app.id);
              const Icon = app.icon;
              const isAppleHealth = app.id === 'apple_health';
              const healthKitDisabled =
                isAppleHealth && (!healthKitSupported || Platform.OS !== 'ios');
              // Toggle disabled for HealthKit-unavailable devices, or unsupported platforms
              const isToggleDisabled = healthKitDisabled || !platformSupported;

              // Platform mismatch message shown below the description
              const platformMessage = !platformSupported
                ? isConnected
                  ? `Connected on another platform. You can disconnect it here, but syncing isn't available on ${
                      Platform.OS === 'ios' ? 'iOS' : 'Android'
                    }.`
                  : `Not available on ${Platform.OS === 'ios' ? 'iOS' : 'Android'}.`
                : healthKitDisabled
                ? 'Requires a physical iPhone (HealthKit not available on simulator).'
                : null;

              return (
                <View
                  key={app.id}
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: isConnected ? app.color : colors.border,
                    borderRadius: 16,
                    padding: 16,
                    opacity: isToggleDisabled && !isConnected ? 0.6 : 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: isConnected ? `${app.color}15` : colors.muted,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={20} color={isConnected ? app.color : colors.mutedForeground} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                          {app.name}
                        </Text>
                        <StatusIcon status={status} />
                      </View>
                      <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
                        {app.description}
                      </Text>
                      {platformMessage && (
                        <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 4 }}>
                          {platformMessage}
                        </Text>
                      )}
                    </View>

                    {isConnecting ? (
                      <ActivityIndicator size="small" color={app.color} />
                    ) : !platformSupported && isConnected ? (
                      // Unsupported platform but connected — disconnect button only, no toggle
                      <TouchableOpacity
                        onPress={() => handleDisconnect(app.id)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Disconnect ${app.name}`}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 10,
                          backgroundColor: `${colors.destructive}15`,
                          borderWidth: 1,
                          borderColor: `${colors.destructive}30`,
                        }}
                      >
                        <Text
                          style={{ fontSize: 12, fontWeight: '600', color: colors.destructive }}
                        >
                          Disconnect
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Switch
                        value={isConnected}
                        onValueChange={() => handleToggle(app.id)}
                        disabled={isToggleDisabled}
                        accessibilityRole="switch"
                        accessibilityLabel={`Connect ${app.name}`}
                        accessibilityState={{ checked: isConnected }}
                        trackColor={{ false: colors.border, true: app.color }}
                        thumbColor={colors.white}
                        style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                      />
                    )}
                  </View>

                  {/* Connected actions — only shown when platform is supported */}
                  {isConnected && platformSupported && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 12,
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        gap: 12,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => handleSync(app.id)}
                        disabled={isSyncing}
                        accessibilityRole="button"
                        accessibilityLabel={`Sync ${app.name} data`}
                        activeOpacity={0.7}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      >
                        {isSyncing ? (
                          <ActivityIndicator size={14} color={colors.primary} />
                        ) : (
                          <RefreshCw size={14} color={colors.primary} />
                        )}
                        <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                          {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </Text>
                      </TouchableOpacity>

                      {lastSync && (
                        <Text
                          style={{
                            fontSize: 10,
                            color: colors.mutedForeground,
                            flex: 1,
                            textAlign: 'right',
                          }}
                        >
                          Last sync: {new Date(lastSync).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
        </View>
      )}

      {/* Data Sharing Consents */}
      <Text
        style={{
          fontSize: 14,
          fontWeight: '700',
          color: colors.foreground,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingBottom: 8,
          marginBottom: 16,
        }}
      >
        Data Sharing
      </Text>

      <View style={{ gap: 8, marginBottom: 24 }}>
        <ToggleRow
          label="Vitals Auto-Sync"
          description="Automatically sync vital signs from connected apps"
          value={consents.vitals_auto_sync}
          onToggle={(v) => setConsents((prev) => ({ ...prev, vitals_auto_sync: v }))}
        />
        <ToggleRow
          label="Activity Tracking"
          description="Share steps, exercise, and activity data"
          value={consents.activity_tracking}
          onToggle={(v) => setConsents((prev) => ({ ...prev, activity_tracking: v }))}
        />
        <ToggleRow
          label="Sleep Tracking"
          description="Share sleep duration and quality data"
          value={consents.sleep_tracking}
          onToggle={(v) => setConsents((prev) => ({ ...prev, sleep_tracking: v }))}
        />
      </View>

      {/* Notification Preferences */}
      <Text
        style={{
          fontSize: 14,
          fontWeight: '700',
          color: colors.foreground,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingBottom: 8,
          marginBottom: 16,
        }}
      >
        Notifications
      </Text>

      <View style={{ gap: 8 }}>
        <ToggleRow
          label="Health Reminders"
          description="Receive reminders about health checkups"
          value={notifications.health_reminders}
          onToggle={(v) => setNotifications((prev) => ({ ...prev, health_reminders: v }))}
        />
        <ToggleRow
          label="Medication Reminders"
          description="Get reminded to take your medications"
          value={notifications.medication_reminders}
          onToggle={(v) => setNotifications((prev) => ({ ...prev, medication_reminders: v }))}
        />
        <ToggleRow
          label="Wellness Tips"
          description="Receive personalized wellness tips"
          value={notifications.wellness_tips}
          onToggle={(v) => setNotifications((prev) => ({ ...prev, wellness_tips: v }))}
        />
      </View>

      {/* Apple Health Sync Progress Sheet */}
      <Modal
        visible={syncSheet.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setSyncSheet((prev) => ({ ...prev, visible: false }))}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 24,
              paddingTop: 12,
              paddingBottom: 40,
            }}
          >
            {/* Drag handle */}
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: 'center',
                marginBottom: 24,
              }}
            />

            {/* Icon + title */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#FF2D5520',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Heart size={28} color="#FF2D55" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground }}>
                {syncSheet.done
                  ? syncSheet.failed
                    ? 'Sync Failed'
                    : 'Sync Complete'
                  : 'Syncing Apple Health'}
              </Text>
            </View>

            {/* Progress bar */}
            <View
              style={{
                height: 8,
                backgroundColor: colors.border,
                borderRadius: 4,
                overflow: 'hidden',
                marginBottom: 10,
              }}
            >
              <Animated.View
                style={{
                  height: '100%',
                  borderRadius: 4,
                  backgroundColor: syncSheet.failed ? colors.destructive : '#FF2D55',
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                }}
              />
            </View>

            {/* Percent + label */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 28,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{syncSheet.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
                {Math.round(syncSheet.percent)}%
              </Text>
            </View>

            {/* Result summary (shown when done) */}
            {syncSheet.done && !syncSheet.failed && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginBottom: 24,
                }}
              >
                <CheckCircle size={16} color={colors.success} />
                <Text style={{ fontSize: 14, color: colors.success, fontWeight: '500' }}>
                  {syncSheet.synced > 0
                    ? `${syncSheet.synced} reading${syncSheet.synced === 1 ? '' : 's'} synced`
                    : 'No new health data found'}
                </Text>
              </View>
            )}

            {/* Actions */}
            {syncSheet.done ? (
              <TouchableOpacity
                onPress={() => setSyncSheet((prev) => ({ ...prev, visible: false }))}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#FF2D55',
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.white }}>Done</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  syncDismissedRef.current = true;
                  setSyncSheet((prev) => ({ ...prev, visible: false }));
                }}
                activeOpacity={0.8}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.mutedForeground }}>
                  Run in background
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* OAuth WebView Modal */}
      <Modal
        visible={!!oauthUrl}
        animationType="slide"
        onRequestClose={() => {
          setOauthUrl(null);
          setOauthProvider(null);
          loadIntegrations();
        }}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 60,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
              Connect {oauthProvider ? PROVIDER_META[oauthProvider]?.name ?? oauthProvider : ''}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setOauthUrl(null);
                setOauthProvider(null);
                loadIntegrations();
              }}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          {oauthUrl && (
            <WebView
              source={{ uri: oauthUrl }}
              onNavigationStateChange={handleOAuthNavigation}
              startInLoadingState
              renderLoading={() => (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </Modal>
    </SectionScreenLayout>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 16,
        gap: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>{label}</Text>
        <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.white}
        style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
      />
    </View>
  );
}
