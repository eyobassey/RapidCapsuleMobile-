import React, {useState, useEffect} from 'react';
import {View, Text, Switch, Alert} from 'react-native';
import {Smartphone, Activity, Moon} from 'lucide-react-native';
import SectionScreenLayout from '../../components/onboarding/SectionScreenLayout';
import {colors} from '../../theme/colors';
import {useAuthStore} from '../../store/auth';
import {useOnboardingStore} from '../../store/onboarding';
import {usersService} from '../../services/users.service';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {OnboardingStackParamList} from '../../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'DeviceIntegration'>;

const HEALTH_APPS = [
  {id: 'apple_health', name: 'Apple Health', icon: Activity},
  {id: 'google_fit', name: 'Google Fit', icon: Activity},
  {id: 'fitbit', name: 'Fitbit', icon: Activity},
  {id: 'samsung_health', name: 'Samsung Health', icon: Smartphone},
];

export default function DeviceIntegrationScreen({navigation}: Props) {
  const user = useAuthStore(s => s.user);
  const fetchUser = useAuthStore(s => s.fetchUser);
  const clearDraft = useOnboardingStore(s => s.clearDraft);

  const [connectedApps, setConnectedApps] = useState<Set<string>>(new Set());
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const di = user?.device_integration;
    if (di) {
      setConnectedApps(new Set(di.health_apps_connected || []));
      if (di.data_sharing_consents) {
        setConsents(prev => ({...prev, ...di.data_sharing_consents}));
      }
      if (di.notification_preferences) {
        setNotifications(prev => ({...prev, ...di.notification_preferences}));
      }
    }
  }, [user]);

  const toggleApp = (appId: string) => {
    setConnectedApps(prev => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await usersService.updateProfile({
        device_integration: {
          health_apps_connected: Array.from(connectedApps),
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
      setLoading(false);
    }
  };

  return (
    <SectionScreenLayout
      title="Devices & Health Apps"
      description="Connect your health apps and configure data sharing preferences."
      onBack={() => navigation.goBack()}
      onSave={handleSave}
      loading={loading}>
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

      <View style={{gap: 8, marginBottom: 24}}>
        {HEALTH_APPS.map(app => {
          const isConnected = connectedApps.has(app.id);
          const Icon = app.icon;
          return (
            <View
              key={app.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: isConnected ? colors.primary : colors.border,
                borderRadius: 16,
                padding: 16,
                gap: 12,
              }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isConnected ? `${colors.primary}15` : colors.muted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon size={18} color={isConnected ? colors.primary : colors.mutedForeground} />
              </View>
              <Text style={{flex: 1, fontSize: 14, fontWeight: '500', color: colors.foreground}}>
                {app.name}
              </Text>
              <Switch
                value={isConnected}
                onValueChange={() => toggleApp(app.id)}
                trackColor={{false: colors.border, true: colors.primary}}
                thumbColor={colors.white}
                style={{transform: [{scaleX: 0.85}, {scaleY: 0.85}]}}
              />
            </View>
          );
        })}
      </View>

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
