import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  Switch,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {
  Smartphone,
  Activity,
  Heart,
  X,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Unlink,
} from 'lucide-react-native';
import SectionScreenLayout from '../../components/onboarding/SectionScreenLayout';
import {colors} from '../../theme/colors';
import {useAuthStore} from '../../store/auth';
import {useOnboardingStore} from '../../store/onboarding';
import {usersService} from '../../services/users.service';
import {healthIntegrationsService} from '../../services/healthIntegrations.service';

const HEALTH_APPS = [
  {
    id: 'google_fit',
    name: 'Google Fit',
    icon: Activity,
    color: '#4285F4',
    description: 'Steps, heart rate, activity, sleep',
    platform: 'all',
  },
  {
    id: 'apple_health',
    name: 'Apple Health',
    icon: Heart,
    color: '#FF2D55',
    description: 'Vitals, activity, sleep via HealthKit',
    platform: 'ios',
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    icon: Activity,
    color: '#00B0B9',
    description: 'Steps, heart rate, sleep, weight',
    platform: 'all',
  },
  {
    id: 'samsung_health',
    name: 'Samsung Health',
    icon: Smartphone,
    color: '#1428A0',
    description: 'Steps, heart rate, sleep, stress',
    platform: 'android',
  },
];

type IntegrationStatus = 'connected' | 'pending' | 'error' | 'disconnected';

interface Integration {
  provider: string;
  status: IntegrationStatus;
  lastSyncAt?: string;
  syncSettings?: {autoSync?: boolean};
}

export default function DeviceIntegrationScreen({navigation}: any) {
  const user = useAuthStore(s => s.user);
  const fetchUser = useAuthStore(s => s.fetchUser);
  const clearDraft = useOnboardingStore(s => s.clearDraft);

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [oauthProvider, setOauthProvider] = useState<string | null>(null);

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

  // Load user prefs
  useEffect(() => {
    const di = user?.device_integration;
    if (di) {
      if (di.data_sharing_consents) {
        setConsents(prev => ({...prev, ...di.data_sharing_consents}));
      }
      if (di.notification_preferences) {
        setNotifications(prev => ({...prev, ...di.notification_preferences}));
      }
    }
  }, [user]);

  // Load integrations from backend
  const loadIntegrations = useCallback(async () => {
    try {
      const data = await healthIntegrationsService.getIntegrations();
      setIntegrations(Array.isArray(data) ? data : []);
    } catch {
      // Silently fail — page still usable
    } finally {
      setLoadingIntegrations(false);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const getIntegrationStatus = (appId: string): IntegrationStatus => {
    const integration = integrations.find(
      (i: any) => i.provider === appId,
    );
    return (integration?.status as IntegrationStatus) || 'disconnected';
  };

  const getLastSync = (appId: string): string | undefined => {
    const integration = integrations.find(
      (i: any) => i.provider === appId,
    );
    return (integration as any)?.lastSyncAt || (integration as any)?.updatedAt;
  };

  // Connect
  const handleConnect = async (appId: string) => {
    setConnecting(appId);
    try {
      const result = await healthIntegrationsService.connect({
        provider: appId,
        autoSync: true,
      });

      if (result.requiresNativeApp) {
        // Apple Health — needs native HealthKit (not yet implemented natively)
        Alert.alert(
          'Apple Health',
          'Apple Health integration requires native HealthKit access. This will be available in a future update with direct HealthKit syncing.',
        );
      } else if (result.authUrl) {
        // OAuth flow — open in WebView
        setOauthProvider(appId);
        setOauthUrl(result.authUrl);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to connect.';
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
    const app = HEALTH_APPS.find(a => a.id === appId);
    Alert.alert(
      `Disconnect ${app?.name}?`,
      'This will stop syncing health data from this provider. Your existing data will be preserved.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            setConnecting(appId);
            try {
              await healthIntegrationsService.disconnect(appId);
              await loadIntegrations();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to disconnect.');
            } finally {
              setConnecting(null);
            }
          },
        },
      ],
    );
  };

  // Manual sync
  const handleSync = async (appId: string) => {
    setSyncing(appId);
    try {
      await healthIntegrationsService.sync(appId);
      Alert.alert('Sync Complete', 'Your health data has been synced.');
      await loadIntegrations();
    } catch (err: any) {
      Alert.alert('Sync Error', err?.response?.data?.message || 'Failed to sync health data.');
    } finally {
      setSyncing(null);
    }
  };

  // OAuth WebView navigation
  const handleOAuthNavigation = useCallback(
    (navState: {url: string}) => {
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
    [oauthUrl, loadIntegrations],
  );

  // Toggle connect/disconnect
  const handleToggle = (appId: string) => {
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
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const StatusIcon = ({status}: {status: IntegrationStatus}) => {
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
      loading={saving}>
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
        }}>
        Health Apps
      </Text>

      {loadingIntegrations ? (
        <View style={{alignItems: 'center', paddingVertical: 20}}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={{fontSize: 12, color: colors.mutedForeground, marginTop: 8}}>
            Loading integrations...
          </Text>
        </View>
      ) : (
        <View style={{gap: 10, marginBottom: 24}}>
          {HEALTH_APPS.map(app => {
            const status = getIntegrationStatus(app.id);
            const isConnected = status === 'connected';
            const isConnecting = connecting === app.id;
            const isSyncing = syncing === app.id;
            const lastSync = getLastSync(app.id);
            const Icon = app.icon;

            return (
              <View
                key={app.id}
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: isConnected ? app.color : colors.border,
                  borderRadius: 16,
                  padding: 16,
                }}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isConnected ? `${app.color}15` : colors.muted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Icon size={20} color={isConnected ? app.color : colors.mutedForeground} />
                  </View>
                  <View style={{flex: 1}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                      <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}>
                        {app.name}
                      </Text>
                      <StatusIcon status={status} />
                    </View>
                    <Text style={{fontSize: 11, color: colors.mutedForeground, marginTop: 2}}>
                      {app.description}
                    </Text>
                  </View>

                  {isConnecting ? (
                    <ActivityIndicator size="small" color={app.color} />
                  ) : (
                    <Switch
                      value={isConnected}
                      onValueChange={() => handleToggle(app.id)}
                      trackColor={{false: colors.border, true: app.color}}
                      thumbColor={colors.white}
                      style={{transform: [{scaleX: 0.85}, {scaleY: 0.85}]}}
                    />
                  )}
                </View>

                {/* Connected actions */}
                {isConnected && (
                  <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 12}}>
                    <TouchableOpacity
                      onPress={() => handleSync(app.id)}
                      disabled={isSyncing}
                      activeOpacity={0.7}
                      style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                      {isSyncing ? (
                        <ActivityIndicator size={14} color={colors.primary} />
                      ) : (
                        <RefreshCw size={14} color={colors.primary} />
                      )}
                      <Text style={{fontSize: 12, color: colors.primary, fontWeight: '600'}}>
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                      </Text>
                    </TouchableOpacity>

                    {lastSync && (
                      <Text style={{fontSize: 10, color: colors.mutedForeground, flex: 1, textAlign: 'right'}}>
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
        }}>
        Data Sharing
      </Text>

      <View style={{gap: 8, marginBottom: 24}}>
        <ToggleRow
          label="Vitals Auto-Sync"
          description="Automatically sync vital signs from connected apps"
          value={consents.vitals_auto_sync}
          onToggle={v => setConsents(prev => ({...prev, vitals_auto_sync: v}))}
        />
        <ToggleRow
          label="Activity Tracking"
          description="Share steps, exercise, and activity data"
          value={consents.activity_tracking}
          onToggle={v => setConsents(prev => ({...prev, activity_tracking: v}))}
        />
        <ToggleRow
          label="Sleep Tracking"
          description="Share sleep duration and quality data"
          value={consents.sleep_tracking}
          onToggle={v => setConsents(prev => ({...prev, sleep_tracking: v}))}
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
        }}>
        Notifications
      </Text>

      <View style={{gap: 8}}>
        <ToggleRow
          label="Health Reminders"
          description="Receive reminders about health checkups"
          value={notifications.health_reminders}
          onToggle={v => setNotifications(prev => ({...prev, health_reminders: v}))}
        />
        <ToggleRow
          label="Medication Reminders"
          description="Get reminded to take your medications"
          value={notifications.medication_reminders}
          onToggle={v => setNotifications(prev => ({...prev, medication_reminders: v}))}
        />
        <ToggleRow
          label="Wellness Tips"
          description="Receive personalized wellness tips"
          value={notifications.wellness_tips}
          onToggle={v => setNotifications(prev => ({...prev, wellness_tips: v}))}
        />
      </View>

      {/* OAuth WebView Modal */}
      <Modal
        visible={!!oauthUrl}
        animationType="slide"
        onRequestClose={() => {
          setOauthUrl(null);
          setOauthProvider(null);
          loadIntegrations();
        }}>
        <View style={{flex: 1, backgroundColor: colors.background}}>
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
            }}>
            <Text style={{fontSize: 16, fontWeight: '700', color: colors.foreground}}>
              Connect {HEALTH_APPS.find(a => a.id === oauthProvider)?.name}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setOauthUrl(null);
                setOauthProvider(null);
                loadIntegrations();
              }}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <X size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          {oauthUrl && (
            <WebView
              source={{uri: oauthUrl}}
              onNavigationStateChange={handleOAuthNavigation}
              startInLoadingState
              renderLoading={() => (
                <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center'}}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
              style={{flex: 1}}
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
      }}>
      <View style={{flex: 1}}>
        <Text style={{fontSize: 14, fontWeight: '500', color: colors.foreground}}>
          {label}
        </Text>
        <Text style={{fontSize: 11, color: colors.mutedForeground, marginTop: 2}}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{false: colors.border, true: colors.primary}}
        thumbColor={colors.white}
        style={{transform: [{scaleX: 0.85}, {scaleY: 0.85}]}}
      />
    </View>
  );
}
