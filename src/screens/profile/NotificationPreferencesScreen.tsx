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
  notificationsService,
} from '../../services/notifications.service';
import { colors } from '../../theme/colors';

// ─── Types ───────────────────────────────────────────────────────────────────

type Channel = {
  key: keyof Pick<NotificationPreferences, 'in_app' | 'email' | 'sms' | 'whatsapp' | 'push'>;
  label: string;
  icon: React.ReactNode;
  color: string;
};

type PreferenceCategory = {
  key: keyof Omit<NotificationPreferences, 'in_app' | 'email' | 'sms' | 'whatsapp' | 'push'>;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const CHANNELS: Channel[] = [
  {
    key: 'in_app',
    label: 'In-App',
    icon: <Smartphone size={14} color={colors.white} />,
    color: colors.mutedForeground,
  },
  {
    key: 'email',
    label: 'Email',
    icon: <Mail size={14} color={colors.white} />,
    color: '#3b82f6',
  },
  {
    key: 'sms',
    label: 'SMS',
    icon: <MessageCircle size={14} color={colors.white} />,
    color: colors.success,
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: <MessageSquare size={14} color={colors.white} />,
    color: '#25D366',
  },
  {
    key: 'push',
    label: 'Push',
    icon: <Bell size={14} color={colors.white} />,
    color: '#eab308',
  },
];

const PREFERENCE_CATEGORIES: PreferenceCategory[] = [
  {
    key: 'appointment_reminders',
    label: 'Appointment Reminders',
    subtitle: 'Reminders before your scheduled appointments',
    icon: <Calendar size={18} color={colors.primary} />,
  },
  {
    key: 'appointment_updates',
    label: 'Appointment Updates',
    subtitle: 'Updates when appointments are booked, confirmed, or cancelled',
    icon: <ClipboardList size={18} color={colors.secondary} />,
  },
  {
    key: 'prescription_updates',
    label: 'Prescription Updates',
    subtitle: 'New prescriptions and pharmacy order updates',
    icon: <Pill size={18} color={colors.accent} />,
  },
  {
    key: 'payment_alerts',
    label: 'Payment Updates',
    subtitle: 'Payment confirmations and transaction receipts',
    icon: <CreditCard size={18} color={colors.success} />,
  },
  {
    key: 'health_reminders',
    label: 'Health Reminders',
    subtitle: 'Medication and health checkup reminders',
    icon: <Heart size={18} color={`${colors.destructive}`} />,
  },
  {
    key: 'vitals_alerts',
    label: 'Vitals Alerts',
    subtitle: 'Alerts when your vitals need attention',
    icon: <TrendingUp size={18} color={colors.secondary} />,
  },
  {
    key: 'message_notifications',
    label: 'Message Notifications',
    subtitle: 'Email notifications for unread messages',
    icon: <MessageCircle size={18} color={colors.primary} />,
  },
  {
    key: 'promotional',
    label: 'Promotional',
    subtitle: 'Special offers, tips, and health insights',
    icon: <Tag size={18} color={colors.mutedForeground} />,
  },
];

const DEFAULT_PREFS: NotificationPreferences = {
  email: true,
  push: true,
  sms: false,
  in_app: true,
  whatsapp: false,
  appointment_reminders: true,
  appointment_updates: true,
  prescription_updates: true,
  payment_alerts: true,
  health_reminders: true,
  vitals_alerts: true,
  message_notifications: true,
  promotional: false,
};

const EMAIL_DELAY_OPTIONS = ['5 minutes', '10 minutes', '20 minutes', '30 minutes', '1 hour'];
const EMAIL_REPEAT_OPTIONS = ['1 hour', '2 hours', '3 hours', '6 hours', '12 hours', 'Never'];

// ─── Channel Toggle Button ────────────────────────────────────────────────────

function ChannelToggleButton({
  channel,
  active,
  onPress,
}: {
  channel: Channel;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityLabel={`${channel.label} notifications ${active ? 'enabled' : 'disabled'}`}
      accessibilityState={{ checked: active }}
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: active ? colors.primary : colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {channel.icon}
    </TouchableOpacity>
  );
}

// ─── Preference Row ───────────────────────────────────────────────────────────

function PreferenceRow({
  category,
  prefs,
  onToggle,
}: {
  category: PreferenceCategory;
  prefs: NotificationPreferences;
  onToggle: (key: keyof NotificationPreferences) => void;
}) {
  // Per-category channel enablement: category key controls the category globally,
  // individual channel keys (email/push/sms/in_app/whatsapp) control per channel.
  // The web UI shows 5 channel buttons per row — toggling a channel button
  // updates that channel's master key (e.g. email → prefs.email).
  const categoryEnabled = prefs[category.key] as boolean;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {/* Icon + label */}
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: `${colors.muted}`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {category.icon}
      </View>

      <View style={{ flex: 1, marginRight: 8 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: categoryEnabled ? colors.foreground : colors.mutedForeground,
          }}
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

      {/* Channel buttons — mirror web layout: In-App, Email, SMS, WhatsApp, Push */}
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {CHANNELS.map((ch) => (
          <ChannelToggleButton
            key={ch.key}
            channel={ch}
            active={categoryEnabled && (prefs[ch.key] as boolean)}
            onPress={() => {
              // Toggling a channel button: if category is off, enable category first
              if (!categoryEnabled) {
                onToggle(category.key);
              }
              onToggle(ch.key);
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Picker Modal ─────────────────────────────────────────────────────────────

function PickerModal({
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
            paddingBottom: 36,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
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
              paddingBottom: 12,
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
                  paddingVertical: 13,
                  paddingHorizontal: 20,
                  backgroundColor: sel ? `${colors.primary}12` : 'transparent',
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationPreferencesScreen() {
  const navigation = useNavigation<any>();

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [quietHours, setQuietHours] = useState(false);
  const [emailDelay, setEmailDelay] = useState('20 minutes');
  const [emailRepeat, setEmailRepeat] = useState('3 hours');
  const [showDelayPicker, setShowDelayPicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);

  // Save-debounce ref: auto-save 800 ms after last toggle, avoid hammering API
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPrefs = useRef<NotificationPreferences>(prefs);

  // Hero shimmer pulse
  const heroPulse = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(heroPulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(heroPulse, { toValue: 0.6, duration: 1800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [heroPulse]);

  const fetchPrefs = useCallback(async () => {
    try {
      const data = await notificationsService.getPreferences();
      if (data) {
        // Merge API response with defaults to fill any fields the API omits
        const merged: NotificationPreferences = { ...DEFAULT_PREFS, ...data };
        setPrefs(merged);
        pendingPrefs.current = merged;
      }
    } catch {
      // Network error — keep defaults, silent fail
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

  const togglePref = useCallback(
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

  // Derived stats shown in hero
  const activeChannels = CHANNELS.filter((c) => prefs[c.key] as boolean).length;
  const activeCategories = PREFERENCE_CATEGORIES.filter((c) => prefs[c.key] as boolean).length;
  const activeTotal = activeChannels + activeCategories;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        {/* Header skeleton */}
        <View
          style={{
            height: 56,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
            Notification Preferences
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 13 }}>
            Loading your preferences…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* ── Header bar ──────────────────────────────── */}
      <View
        style={{
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <ArrowLeft size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: colors.foreground }}>
          Notification Preferences
        </Text>
        {/* Autosave indicator */}
        {saving && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Saving…</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
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
        {/* ── Hero Banner ──────────────────────────── */}
        <View
          style={{
            margin: 16,
            borderRadius: 20,
            overflow: 'hidden',
            backgroundColor: '#1e3a5f',
          }}
        >
          {/* Decorative orb */}
          <Animated.View
            style={{
              position: 'absolute',
              right: 20,
              top: '50%',
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: `${colors.primary}20`,
              transform: [{ translateY: -60 }],
              opacity: heroPulse,
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              right: 40,
              top: '50%',
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${colors.primary}30`,
              transform: [{ translateY: -40 }],
              opacity: heroPulse,
            }}
          />

          {/* Bell icon */}
          <View
            style={{
              position: 'absolute',
              right: 30,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: `${colors.primary}35`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={32} color={colors.white} />
            </View>
          </View>

          <View style={{ padding: 20, paddingRight: 120 }}>
            {/* Stay Informed badge */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: `${colors.primary}25`,
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

            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.white, lineHeight: 28 }}>
              Notification
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '900',
                color: colors.foreground,
                lineHeight: 30,
                marginBottom: 8,
              }}
            >
              Settings
            </Text>
            <Text
              style={{ fontSize: 12, color: '#94b4cc', lineHeight: 17, marginBottom: 16 }}
              numberOfLines={3}
            >
              Customise how and when you receive notifications for appointments, prescriptions, and
              health updates.
            </Text>

            {/* Stats row */}
            <View style={{ flexDirection: 'row', gap: 20 }}>
              {[
                { value: String(CHANNELS.length), label: 'CHANNELS' },
                { value: String(PREFERENCE_CATEGORIES.length), label: 'CATEGORIES' },
                { value: String(activeTotal), label: 'ACTIVE' },
              ].map((stat) => (
                <View key={stat.label}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '800',
                      color: stat.label === 'ACTIVE' ? colors.primary : colors.white,
                    }}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    style={{ fontSize: 9, fontWeight: '700', color: '#94b4cc', letterSpacing: 0.5 }}
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Quick Actions ────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 10,
            }}
          >
            Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              {
                icon: <Eye size={20} color={colors.foreground} />,
                label: 'View\nNotifications',
                onPress: () => {},
                highlight: false,
              },
              {
                icon: <Bell size={20} color={colors.white} />,
                label: 'Enable All',
                onPress: enableAll,
                highlight: true,
              },
              {
                icon: <BellOff size={20} color={colors.white} />,
                label: 'Disable All',
                onPress: () =>
                  Alert.alert(
                    'Disable All Notifications',
                    'This will turn off all non-critical notifications. Critical alerts will still come through.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Disable All', style: 'destructive', onPress: disableAll },
                    ]
                  ),
                highlight: false,
                danger: true,
              },
              {
                icon: <Settings size={20} color={colors.foreground} />,
                label: 'Account\nSettings',
                onPress: () => {},
                highlight: false,
              },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                activeOpacity={0.75}
                onPress={action.onPress}
                accessibilityRole="button"
                accessibilityLabel={action.label.replace('\n', ' ')}
                style={{
                  flex: 1,
                  backgroundColor: action.highlight
                    ? colors.primary
                    : action.danger
                    ? `${colors.destructive}15`
                    : colors.card,
                  borderWidth: 1,
                  borderColor: action.highlight
                    ? colors.primary
                    : action.danger
                    ? `${colors.destructive}40`
                    : colors.border,
                  borderRadius: 14,
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 6,
                  gap: 6,
                }}
              >
                {action.icon}
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    color: action.highlight
                      ? colors.white
                      : action.danger
                      ? colors.destructive
                      : colors.foreground,
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

        {/* ── Notification Channels ─────────────────── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.mutedForeground,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Notification Channels
            </Text>
            <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>
              {activeChannels} available
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
            }}
          >
            {CHANNELS.map((channel, idx) => {
              const active = prefs[channel.key] as boolean;
              const isLast = idx === CHANNELS.length - 1;
              return (
                <TouchableOpacity
                  key={channel.key}
                  activeOpacity={0.75}
                  onPress={() => togglePref(channel.key)}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`${channel.label} channel`}
                  accessibilityState={{ checked: active }}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 4,
                    borderRightWidth: isLast ? 0 : 1,
                    borderRightColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: active ? channel.color : colors.muted,
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
                      color: active ? colors.foreground : colors.mutedForeground,
                    }}
                  >
                    {channel.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 9,
                      color: colors.mutedForeground,
                      marginTop: 1,
                      textAlign: 'center',
                    }}
                    numberOfLines={2}
                  >
                    {channel.label === 'In-App'
                      ? 'In the app'
                      : channel.label === 'Email'
                      ? 'Email alerts'
                      : channel.label === 'SMS'
                      ? 'Text messages'
                      : channel.label === 'WhatsApp'
                      ? 'WhatsApp msgs'
                      : 'Mobile push'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Notification Preferences ──────────────── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 10,
            }}
          >
            Notification Preferences
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            {PREFERENCE_CATEGORIES.map((category, idx) => (
              <PreferenceRow
                key={category.key}
                category={category}
                prefs={prefs}
                onToggle={togglePref}
              />
            ))}

            {/* Remove bottom border from last row */}
            <View style={{ height: 0 }} />
          </View>
        </View>

        {/* ── Critical alerts disclaimer ────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
            paddingHorizontal: 20,
            paddingVertical: 12,
            marginHorizontal: 16,
            marginBottom: 16,
          }}
        >
          <AlertCircle size={14} color={colors.mutedForeground} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, fontSize: 11, color: colors.mutedForeground, lineHeight: 16 }}>
            Critical notifications (security alerts, payment confirmations) will always be sent
            regardless of preferences.
          </Text>
        </View>

        {/* ── Bottom cards row ─────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 16,
            marginBottom: 16,
          }}
        >
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Mail size={16} color={colors.foreground} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }}>
                Message Email Timing
              </Text>
            </View>
            <Text
              style={{
                fontSize: 11,
                color: colors.mutedForeground,
                marginBottom: 14,
                lineHeight: 16,
              }}
            >
              Control how quickly and how often you receive email notifications about unread
              messages.
            </Text>

            {/* Delay picker */}
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: colors.mutedForeground,
                marginBottom: 4,
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
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 12,
                paddingVertical: 9,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.foreground }}>{emailDelay}</Text>
              <ChevronDown size={14} color={colors.mutedForeground} />
            </TouchableOpacity>

            {/* Repeat picker */}
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: colors.mutedForeground,
                marginBottom: 4,
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
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 12,
                paddingVertical: 9,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.foreground }}>{emailRepeat}</Text>
              <ChevronDown size={14} color={colors.mutedForeground} />
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Moon size={16} color={colors.foreground} />
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

        {/* ── Notification Sound ───────────────────── */}
        <View
          style={{
            marginHorizontal: 16,
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
            <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}>
              Customise your notification alert sound
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: `${colors.secondary}15`,
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: `${colors.secondary}30`,
            }}
          >
            <AlertCircle size={11} color={colors.secondary} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.secondary }}>
              Coming Soon
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Picker modals ───────────────────────────── */}
      <PickerModal
        visible={showDelayPicker}
        title="Email me after messages are unread for"
        options={EMAIL_DELAY_OPTIONS}
        selected={emailDelay}
        onSelect={setEmailDelay}
        onClose={() => setShowDelayPicker(false)}
      />
      <PickerModal
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
