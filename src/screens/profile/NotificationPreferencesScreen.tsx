import { useNavigation } from '@react-navigation/native';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Eye,
  Heart,
  Mail,
  MessageCircle,
  MessageSquare,
  Moon,
  Pill,
  Settings,
  Smartphone,
  Tag,
  TrendingUp,
  Volume2,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
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
  NotificationStats,
  notificationsService,
} from '../../services/notifications.service';
import { colors } from '../../theme/colors';

// ─── API-aligned defaults ─────────────────────────────────────────────────────

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

// ─── Channel definitions (5 as shown in screenshots) ─────────────────────────
// WhatsApp is displayed in the UI but maps to the sms key as the closest API
// equivalent; the remaining 4 map directly to API fields.

type ChannelDef = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  prefKey: keyof NotificationPreferences | null; // null = UI-only / coming soon
};

const CHANNELS: ChannelDef[] = [
  {
    id: 'in_app',
    label: 'In-App',
    shortLabel: 'In-App',
    description: 'Notifications in the app',
    icon: <Smartphone size={16} color={colors.white} />,
    color: colors.mutedForeground,
    prefKey: 'in_app',
  },
  {
    id: 'email',
    label: 'Email',
    shortLabel: 'Email',
    description: 'Email notifications',
    icon: <Mail size={16} color={colors.white} />,
    color: '#3b82f6',
    prefKey: 'email',
  },
  {
    id: 'sms',
    label: 'SMS',
    shortLabel: 'SMS',
    description: 'Text messages',
    icon: <MessageCircle size={16} color={colors.white} />,
    color: colors.success,
    prefKey: 'sms',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    shortLabel: 'WA',
    description: 'WhatsApp messages',
    icon: <MessageSquare size={16} color={colors.white} />,
    color: '#25D366',
    prefKey: null, // shown as inactive — no dedicated API field
  },
  {
    id: 'push',
    label: 'Push',
    shortLabel: 'Push',
    description: 'Mobile push notifications',
    icon: <Bell size={16} color={colors.white} />,
    color: '#eab308',
    prefKey: 'push',
  },
];

// Per-channel icon buttons shown on every preference row
const ROW_CHANNEL_ICONS: Array<{
  id: string;
  icon: React.ReactNode;
  prefKey: keyof NotificationPreferences | null;
}> = [
  { id: 'in_app', icon: <Smartphone size={13} color={colors.white} />, prefKey: 'in_app' },
  { id: 'email', icon: <Mail size={13} color={colors.white} />, prefKey: 'email' },
  { id: 'sms', icon: <MessageCircle size={13} color={colors.white} />, prefKey: 'sms' },
  { id: 'whatsapp', icon: <MessageSquare size={13} color={colors.white} />, prefKey: null },
  { id: 'push', icon: <Bell size={13} color={colors.white} />, prefKey: 'push' },
];

// ─── Notification preference categories (8 rows as in screenshots) ────────────
// The API has 4 category keys. The remaining 4 are displayed in the web UI but
// not yet in the API — they render as coming-soon (dimmed, non-interactive).

type CategoryDef = {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  prefKey: keyof NotificationPreferences | null;
};

const CATEGORIES: CategoryDef[] = [
  {
    id: 'appointment_reminders',
    label: 'Appointment Reminders',
    subtitle: 'Reminders before your scheduled appointments',
    icon: <Bell size={18} color={colors.mutedForeground} />,
    prefKey: 'appointment_reminders',
  },
  {
    id: 'appointment_updates',
    label: 'Appointment Updates',
    subtitle: 'Updates when appointments are booked, confirmed, or cancelled',
    icon: <ClipboardList size={18} color={colors.mutedForeground} />,
    prefKey: null,
  },
  {
    id: 'prescription_updates',
    label: 'Prescription Updates',
    subtitle: 'New prescriptions and pharmacy order updates',
    icon: <Pill size={18} color={colors.mutedForeground} />,
    prefKey: 'prescription_updates',
  },
  {
    id: 'payment_alerts',
    label: 'Payment Updates',
    subtitle: 'Payment confirmations and transaction receipts',
    icon: <CreditCard size={18} color={colors.mutedForeground} />,
    prefKey: 'payment_alerts',
  },
  {
    id: 'health_reminders',
    label: 'Health Reminders',
    subtitle: 'Medication and health checkup reminders',
    icon: <Heart size={18} color={colors.mutedForeground} />,
    prefKey: null,
  },
  {
    id: 'vitals_alerts',
    label: 'Vitals Alerts',
    subtitle: 'Alerts when your vitals need attention',
    icon: <TrendingUp size={18} color={colors.mutedForeground} />,
    prefKey: null,
  },
  {
    id: 'message_notifications',
    label: 'Message Notifications',
    subtitle: 'Email notifications for unread messages',
    icon: <MessageCircle size={18} color={colors.mutedForeground} />,
    prefKey: null,
  },
  {
    id: 'promotional',
    label: 'Promotional',
    subtitle: 'Special offers, tips, and health insights',
    icon: <Tag size={18} color={colors.mutedForeground} />,
    prefKey: 'promotional',
  },
];

const EMAIL_DELAY_OPTIONS = ['5 minutes', '10 minutes', '20 minutes', '30 minutes', '1 hour'];
const EMAIL_REPEAT_OPTIONS = ['1 hour', '2 hours', '3 hours', '6 hours', '12 hours', 'Never'];

// ─── Channel chip (horizontal row) ───────────────────────────────────────────

function ChannelChip({
  channel,
  active,
  onPress,
}: {
  channel: ChannelDef;
  active: boolean;
  onPress: () => void;
}) {
  const disabled = channel.prefKey === null;
  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.75}
      onPress={disabled ? undefined : onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={`${channel.label} channel`}
      accessibilityState={{ checked: active, disabled }}
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 4,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: active && !disabled ? channel.color : colors.muted,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 5,
        }}
      >
        {channel.icon}
      </View>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '600',
          color: active && !disabled ? colors.foreground : colors.mutedForeground,
          textAlign: 'center',
        }}
      >
        {channel.label}
      </Text>
      <Text
        style={{ fontSize: 9, color: colors.mutedForeground, textAlign: 'center', marginTop: 1 }}
        numberOfLines={2}
      >
        {channel.description}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Per-category row with 5 channel icon buttons ────────────────────────────

function CategoryRow({
  category,
  prefs,
  onToggleChannel,
  isLast,
}: {
  category: CategoryDef;
  prefs: NotificationPreferences;
  onToggleChannel: (key: keyof NotificationPreferences) => void;
  isLast: boolean;
}) {
  const categoryActive = category.prefKey ? (prefs[category.prefKey] as boolean) : false;
  const disabled = category.prefKey === null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingLeft: 14,
        paddingRight: 10,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          backgroundColor: colors.muted,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        {category.icon}
      </View>

      {/* Label */}
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: categoryActive ? colors.foreground : colors.mutedForeground,
          }}
          numberOfLines={1}
        >
          {category.label}
        </Text>
        <Text
          style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}
          numberOfLines={1}
        >
          {category.subtitle}
        </Text>
      </View>

      {/* 5 channel icon buttons */}
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {ROW_CHANNEL_ICONS.map((ch) => {
          const chActive =
            ch.prefKey !== null && categoryActive ? (prefs[ch.prefKey] as boolean) : false;
          const chDisabled = ch.prefKey === null || disabled;
          return (
            <TouchableOpacity
              key={ch.id}
              activeOpacity={chDisabled ? 1 : 0.7}
              onPress={() => {
                if (chDisabled || ch.prefKey === null) return;
                onToggleChannel(ch.prefKey);
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: chActive, disabled: chDisabled }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                backgroundColor: chActive ? colors.primary : colors.muted,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: chDisabled ? 0.5 : 1,
              }}
            >
              {ch.icon}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Bottom sheet picker ──────────────────────────────────────────────────────

function PickerSheet({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }}
            />
          </View>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: colors.foreground,
              paddingHorizontal: 20,
              paddingVertical: 12,
            }}
          >
            {title}
          </Text>
          {options.map((opt) => {
            const sel = opt === selected;
            return (
              <TouchableOpacity
                key={opt}
                activeOpacity={0.7}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  backgroundColor: sel ? `${colors.primary}14` : 'transparent',
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: sel ? '600' : '400',
                    color: sel ? colors.primary : colors.foreground,
                  }}
                >
                  {opt}
                </Text>
                {sel && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.primary,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ title, badge }: { title: string; badge?: string }) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-6 pb-2">
      <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </Text>
      {badge ? <Text className="text-xs font-semibold text-primary">{badge}</Text> : null}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotificationPreferencesScreen() {
  const navigation = useNavigation<any>();

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [quietHours, setQuietHours] = useState(false);
  const [emailDelay, setEmailDelay] = useState('20 minutes');
  const [emailRepeat, setEmailRepeat] = useState('3 hours');
  const [showDelayPicker, setShowDelayPicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPrefs = useRef<NotificationPreferences>(DEFAULT_PREFS);

  // Hero bell pulse animation
  const bellPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bellPulse, { toValue: 1.12, duration: 1600, useNativeDriver: true }),
        Animated.timing(bellPulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [bellPulse]);

  // Load prefs + stats in parallel
  const fetchAll = useCallback(async () => {
    try {
      const [prefsData, statsData] = await Promise.allSettled([
        notificationsService.getPreferences(),
        notificationsService.getStats(),
      ]);
      if (prefsData.status === 'fulfilled' && prefsData.value) {
        const merged: NotificationPreferences = { ...DEFAULT_PREFS, ...prefsData.value };
        setPrefs(merged);
        pendingPrefs.current = merged;
      }
      if (statsData.status === 'fulfilled' && statsData.value) {
        setStats(statsData.value);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  const scheduleSave = useCallback((updated: NotificationPreferences) => {
    pendingPrefs.current = updated;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await notificationsService.updatePreferences(pendingPrefs.current);
      } catch {
        Alert.alert('Could not save', 'Your preferences could not be saved. Please try again.');
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

  // Stats derived from live API data when available, else from prefs
  const activeChannelCount = CHANNELS.filter(
    (c) => c.prefKey !== null && (prefs[c.prefKey!] as boolean)
  ).length;
  const totalCategories = CATEGORIES.length;
  const activeNotifCount = stats?.unread ?? 0;

  // ── Loading ─────────────────────────────────────────────────────────────────
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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* ── Header ── */}
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
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Hero banner ── */}
        <View
          style={{
            margin: 16,
            borderRadius: 20,
            backgroundColor: '#1a3356',
            overflow: 'hidden',
          }}
        >
          {/* Animated concentric rings behind bell */}
          <Animated.View
            style={{
              position: 'absolute',
              right: 18,
              top: '50%',
              width: 130,
              height: 130,
              borderRadius: 65,
              backgroundColor: 'rgba(14,165,233,0.12)',
              transform: [{ translateY: -65 }, { scale: bellPulse }],
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              right: 38,
              top: '50%',
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: 'rgba(14,165,233,0.18)',
              transform: [{ translateY: -45 }, { scale: bellPulse }],
            }}
          />

          {/* Bell circle */}
          <View
            style={{
              position: 'absolute',
              right: 28,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: 'rgba(14,165,233,0.25)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={30} color={colors.white} />
            </View>
          </View>

          {/* Text content */}
          <View style={{ padding: 20, paddingRight: 115 }}>
            {/* Stay Informed badge */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: 'rgba(14,165,233,0.2)',
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 4,
                alignSelf: 'flex-start',
                marginBottom: 10,
              }}
            >
              <View
                style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }}
              />
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.white }}>
                Stay Informed
              </Text>
            </View>

            <Text style={{ fontSize: 26, fontWeight: '900', color: colors.white, lineHeight: 30 }}>
              Notification
            </Text>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '900',
                color: colors.primary,
                lineHeight: 32,
                marginBottom: 8,
              }}
            >
              Settings
            </Text>
            <Text
              style={{ fontSize: 12, color: '#94b4cc', lineHeight: 17, marginBottom: 18 }}
              numberOfLines={3}
            >
              Customise how and when you receive notifications for appointments, prescriptions, and
              health updates.
            </Text>

            {/* Live stats row */}
            <View style={{ flexDirection: 'row', gap: 24 }}>
              {[
                { value: String(CHANNELS.length), label: 'CHANNELS' },
                { value: String(totalCategories), label: 'CATEGORIES' },
                { value: String(activeNotifCount), label: 'ACTIVE' },
              ].map((s) => (
                <View key={s.label}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: '800',
                      color: s.label === 'ACTIVE' ? colors.primary : colors.white,
                    }}
                  >
                    {s.value}
                  </Text>
                  <Text
                    style={{ fontSize: 9, fontWeight: '700', color: '#94b4cc', letterSpacing: 0.8 }}
                  >
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <SectionLabel title="Quick Actions" />
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(
              [
                {
                  icon: <Eye size={22} color={colors.foreground} />,
                  label: 'View\nNotifications',
                  onPress: () => {},
                  style: { bg: colors.card, border: colors.border, text: colors.foreground },
                },
                {
                  icon: <Bell size={22} color={colors.white} />,
                  label: 'Enable All',
                  onPress: enableAll,
                  style: { bg: colors.primary, border: colors.primary, text: colors.white },
                },
                {
                  icon: <BellOff size={22} color={colors.white} />,
                  label: 'Disable All',
                  onPress: () =>
                    Alert.alert(
                      'Disable All Notifications',
                      'This will turn off all notifications. Critical alerts will still be delivered.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Disable All', style: 'destructive', onPress: disableAll },
                      ]
                    ),
                  style: {
                    bg: `${colors.destructive}18`,
                    border: `${colors.destructive}45`,
                    text: colors.destructive,
                  },
                },
                {
                  icon: <Settings size={22} color={colors.foreground} />,
                  label: 'Account\nSettings',
                  onPress: () => {},
                  style: { bg: colors.card, border: colors.border, text: colors.foreground },
                },
              ] as const
            ).map((action) => (
              <TouchableOpacity
                key={action.label}
                activeOpacity={0.75}
                onPress={action.onPress}
                accessibilityRole="button"
                accessibilityLabel={action.label.replace('\n', ' ')}
                style={{
                  flex: 1,
                  backgroundColor: action.style.bg,
                  borderWidth: 1,
                  borderColor: action.style.border,
                  borderRadius: 14,
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 4,
                  gap: 7,
                }}
              >
                {action.icon}
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    color: action.style.text,
                    textAlign: 'center',
                    lineHeight: 14,
                  }}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Notification Channels ── */}
        <SectionLabel title="Notification Channels" badge={`${activeChannelCount} available`} />
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
          }}
        >
          {CHANNELS.map((ch, idx) => {
            const active = ch.prefKey !== null ? (prefs[ch.prefKey!] as boolean) : false;
            const isLast = idx === CHANNELS.length - 1;
            return (
              <View
                key={ch.id}
                style={{
                  flex: 1,
                  borderRightWidth: isLast ? 0 : 1,
                  borderRightColor: colors.border,
                }}
              >
                <ChannelChip
                  channel={ch}
                  active={active}
                  onPress={() => ch.prefKey && toggle(ch.prefKey)}
                />
              </View>
            );
          })}
        </View>

        {/* ── Notification Preferences (8 category rows) ── */}
        <SectionLabel title="Notification Preferences" />
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          }}
        >
          {CATEGORIES.map((cat, idx) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              prefs={prefs}
              onToggleChannel={toggle}
              isLast={idx === CATEGORIES.length - 1}
            />
          ))}
        </View>

        {/* ── Critical alerts note ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
            marginHorizontal: 16,
            marginTop: 12,
            marginBottom: 4,
          }}
        >
          <AlertCircle size={13} color={colors.mutedForeground} style={{ marginTop: 2 }} />
          <Text style={{ flex: 1, fontSize: 11, color: colors.mutedForeground, lineHeight: 16 }}>
            Critical notifications (security alerts, payment confirmations) will always be sent
            regardless of preferences.
          </Text>
        </View>

        {/* ── Message Email Timing + Quiet Hours (side-by-side) ── */}
        <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 16 }}>
          {/* Message Email Timing */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <Mail size={15} color={colors.foreground} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }}>
                Message Email Timing
              </Text>
            </View>
            <Text
              style={{
                fontSize: 11,
                color: colors.mutedForeground,
                lineHeight: 15,
                marginBottom: 12,
              }}
            >
              Control how quickly and how often you receive email notifications about unread
              messages.
            </Text>

            <Text
              style={{
                fontSize: 9,
                fontWeight: '700',
                color: colors.mutedForeground,
                marginBottom: 5,
                letterSpacing: 0.3,
              }}
            >
              EMAIL ME AFTER MESSAGES ARE UNREAD FOR
            </Text>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setShowDelayPicker(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.background,
                borderRadius: 9,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 10,
                paddingVertical: 8,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.foreground }}>{emailDelay}</Text>
              <ChevronDown size={13} color={colors.mutedForeground} />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 9,
                fontWeight: '700',
                color: colors.mutedForeground,
                marginBottom: 5,
                letterSpacing: 0.3,
              }}
            >
              DON'T REPEAT MORE OFTEN THAN EVERY
            </Text>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setShowRepeatPicker(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.background,
                borderRadius: 9,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.foreground }}>{emailRepeat}</Text>
              <ChevronDown size={13} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Quiet Hours */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Moon size={15} color={colors.foreground} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }}>
                  Quiet Hours
                </Text>
              </View>
              <Switch
                value={quietHours}
                onValueChange={setQuietHours}
                trackColor={{ false: colors.muted, true: `${colors.primary}60` }}
                thumbColor={quietHours ? colors.primary : colors.mutedForeground}
                accessibilityLabel="Toggle quiet hours"
              />
            </View>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, lineHeight: 16 }}>
              Pause non-urgent notifications during specific times. Critical alerts will still come
              through.
            </Text>
          </View>
        </View>

        {/* ── Notification Sound ── */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 10,
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: `${colors.secondary}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Volume2 size={20} color={colors.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }}>
              Notification Sound
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
              Customise your notification alert sound
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: `${colors.secondary}18`,
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: `${colors.secondary}35`,
            }}
          >
            <AlertCircle size={11} color={colors.secondary} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.secondary }}>
              Coming Soon
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Pickers ── */}
      <PickerSheet
        visible={showDelayPicker}
        title="Email me after messages are unread for"
        options={EMAIL_DELAY_OPTIONS}
        selected={emailDelay}
        onSelect={setEmailDelay}
        onClose={() => setShowDelayPicker(false)}
      />
      <PickerSheet
        visible={showRepeatPicker}
        title="Don't repeat more often than every"
        options={EMAIL_REPEAT_OPTIONS}
        selected={emailRepeat}
        onSelect={setEmailRepeat}
        onClose={() => setShowRepeatPicker(false)}
      />
    </SafeAreaView>
  );
}
