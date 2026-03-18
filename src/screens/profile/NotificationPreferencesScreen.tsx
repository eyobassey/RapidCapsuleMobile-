import { useNavigation } from '@react-navigation/native';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  CreditCard,
  Mail,
  MessageCircle,
  Pill,
  Smartphone,
  Tag,
  Zap,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../../components/ui/Text';
import {
  NotificationPreferences,
  notificationsService,
} from '../../services/notifications.service';
import { colors } from '../../theme/colors';

// ─── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_PREFS: NotificationPreferences = {
  email: true,
  push: true,
  sms: false,
  in_app: true,
  appointment_reminders: true,
  prescription_updates: true,
  payment_alerts: true,
  promotional: false,
};

type ChannelItem = {
  key: keyof Pick<NotificationPreferences, 'in_app' | 'email' | 'sms' | 'push'>;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
};

type CategoryItem = {
  key: keyof Pick<
    NotificationPreferences,
    'appointment_reminders' | 'prescription_updates' | 'payment_alerts' | 'promotional'
  >;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
};

const CHANNELS: ChannelItem[] = [
  {
    key: 'in_app',
    label: 'In-App Notifications',
    subtitle: 'Alerts inside the app',
    icon: <Smartphone size={20} color={colors.primary} />,
  },
  {
    key: 'push',
    label: 'Push Notifications',
    subtitle: 'Alerts on your device lock screen',
    icon: <Bell size={20} color={colors.secondary} />,
  },
  {
    key: 'email',
    label: 'Email Notifications',
    subtitle: 'Updates sent to your email',
    icon: <Mail size={20} color={colors.accent} />,
  },
  {
    key: 'sms',
    label: 'SMS Notifications',
    subtitle: 'Text messages to your phone',
    icon: <MessageCircle size={20} color={colors.success} />,
  },
];

const CATEGORIES: CategoryItem[] = [
  {
    key: 'appointment_reminders',
    label: 'Appointment Reminders',
    subtitle: 'Reminders before your scheduled appointments',
    icon: <Calendar size={20} color={colors.primary} />,
  },
  {
    key: 'prescription_updates',
    label: 'Prescription Updates',
    subtitle: 'New prescriptions and pharmacy orders',
    icon: <Pill size={20} color={colors.secondary} />,
  },
  {
    key: 'payment_alerts',
    label: 'Payment Alerts',
    subtitle: 'Payment confirmations and receipts',
    icon: <CreditCard size={20} color={colors.success} />,
  },
  {
    key: 'promotional',
    label: 'Promotions & Offers',
    subtitle: 'Health tips, offers, and insights',
    icon: <Tag size={20} color={colors.mutedForeground} />,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-xs text-muted-foreground uppercase tracking-wider px-5 pt-6 pb-2 font-semibold">
      {title}
    </Text>
  );
}

function PreferenceRow({
  icon,
  label,
  subtitle,
  value,
  onToggle,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center p-4 bg-card ${!isLast ? 'border-b border-border' : ''}`}
    >
      <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">{icon}</View>
      <View className="flex-1 mr-3">
        <Text className="text-foreground font-medium">{label}</Text>
        <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.muted, true: `${colors.primary}60` }}
        thumbColor={value ? colors.primary : colors.mutedForeground}
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationPreferencesScreen() {
  const navigation = useNavigation<any>();

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPrefs = useRef<NotificationPreferences>(DEFAULT_PREFS);

  const fetchPrefs = useCallback(async () => {
    try {
      const data = await notificationsService.getPreferences();
      if (data) {
        const merged: NotificationPreferences = { ...DEFAULT_PREFS, ...data };
        setPrefs(merged);
        pendingPrefs.current = merged;
      }
    } catch {
      // Keep defaults on network error — silent fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPrefs();
  }, [fetchPrefs]);

  // Debounced auto-save: fires 800 ms after the last toggle so we don't hammer the API
  const scheduleSave = useCallback((updated: NotificationPreferences) => {
    pendingPrefs.current = updated;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await notificationsService.updatePreferences(pendingPrefs.current);
      } catch {
        Alert.alert('Could not save', 'Your preferences could not be saved. Please try again.', [
          { text: 'OK' },
        ]);
      } finally {
        setSaving(false);
      }
    }, 800);
  }, []);

  const toggle = useCallback(
    (key: keyof NotificationPreferences) => {
      setPrefs((prev) => {
        const updated = { ...prev, [key]: !prev[key] };
        scheduleSave(updated);
        return updated;
      });
    },
    [scheduleSave]
  );

  const enableAll = useCallback(() => {
    const all = Object.fromEntries(
      Object.keys(DEFAULT_PREFS).map((k) => [k, true])
    ) as NotificationPreferences;
    setPrefs(all);
    scheduleSave(all);
  }, [scheduleSave]);

  const disableAll = useCallback(() => {
    const none = Object.fromEntries(
      Object.keys(DEFAULT_PREFS).map((k) => [k, false])
    ) as NotificationPreferences;
    setPrefs(none);
    scheduleSave(none);
  }, [scheduleSave]);

  const activeCount = Object.values(prefs).filter(Boolean).length;
  const totalCount = Object.keys(DEFAULT_PREFS).length;

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="h-14 bg-card border-b border-border flex-row items-center px-4 gap-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-9 h-9 rounded-xl bg-background border border-border items-center justify-center"
          >
            <ArrowLeft size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="flex-1 text-base font-bold text-foreground">
            Notification Preferences
          </Text>
        </View>
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm text-muted-foreground">Loading your preferences…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="h-14 bg-card border-b border-border flex-row items-center px-4 gap-3">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-9 h-9 rounded-xl bg-background border border-border items-center justify-center"
        >
          <ArrowLeft size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="flex-1 text-base font-bold text-foreground">Notification Preferences</Text>
        {saving && (
          <View className="flex-row items-center gap-1.5">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-xs text-muted-foreground">Saving…</Text>
          </View>
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-16"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Summary card ── */}
        <View className="mx-5 mt-5 bg-card border border-border rounded-2xl overflow-hidden">
          <View className="p-4 flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center">
              <Bell size={24} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold text-base">
                {activeCount} of {totalCount} enabled
              </Text>
              <Text className="text-muted-foreground text-sm mt-0.5">
                Manage how RapidCapsule reaches you
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View className="px-4 pb-4">
            <View className="h-1.5 bg-muted rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${(activeCount / totalCount) * 100}%` }}
              />
            </View>
          </View>

          {/* Enable / Disable All */}
          <View className="flex-row border-t border-border">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={enableAll}
              accessibilityRole="button"
              accessibilityLabel="Enable all notifications"
              className="flex-1 flex-row items-center justify-center gap-2 py-3 border-r border-border"
            >
              <Zap size={15} color={colors.primary} />
              <Text className="text-sm font-semibold text-primary">Enable All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(
                  'Disable All Notifications',
                  'This will turn off all notifications. Critical security and payment alerts will still be delivered.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Disable All', style: 'destructive', onPress: disableAll },
                  ]
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Disable all notifications"
              className="flex-1 flex-row items-center justify-center gap-2 py-3"
            >
              <BellOff size={15} color={colors.destructive} />
              <Text className="text-sm font-semibold text-destructive">Disable All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Delivery Channels ── */}
        <SectionHeader title="Delivery Channels" />
        <View className="mx-5 bg-card border border-border rounded-2xl overflow-hidden">
          {CHANNELS.map((ch, i) => (
            <PreferenceRow
              key={ch.key}
              icon={ch.icon}
              label={ch.label}
              subtitle={ch.subtitle}
              value={prefs[ch.key]}
              onToggle={() => toggle(ch.key)}
              isLast={i === CHANNELS.length - 1}
            />
          ))}
        </View>

        {/* ── Notification Types ── */}
        <SectionHeader title="Notification Types" />
        <View className="mx-5 bg-card border border-border rounded-2xl overflow-hidden">
          {CATEGORIES.map((cat, i) => (
            <PreferenceRow
              key={cat.key}
              icon={cat.icon}
              label={cat.label}
              subtitle={cat.subtitle}
              value={prefs[cat.key]}
              onToggle={() => toggle(cat.key)}
              isLast={i === CATEGORIES.length - 1}
            />
          ))}
        </View>

        {/* ── Critical alerts disclaimer ── */}
        <View className="mx-5 mt-4 flex-row items-start gap-2.5 bg-muted/50 border border-border rounded-2xl p-4">
          <AlertCircle size={15} color={colors.mutedForeground} style={{ marginTop: 1 }} />
          <Text className="flex-1 text-xs text-muted-foreground leading-5">
            Critical notifications — including security alerts and payment confirmations — are
            always delivered regardless of your preferences.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
