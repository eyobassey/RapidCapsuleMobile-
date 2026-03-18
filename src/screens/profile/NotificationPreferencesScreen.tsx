import { useNavigation } from '@react-navigation/native';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  BellOff,
  ClipboardList,
  CreditCard,
  Heart,
  Mail,
  MessageCircle,
  MessageSquare,
  Moon,
  Pill,
  Smartphone,
  Tag,
  TrendingUp,
  Volume2,
  Zap,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  CategoryKey,
  ChannelKey,
  DEFAULT_PREFS,
  MessagingTiming,
  NotificationPreferences,
  NotificationStats,
  QuietHours,
  notificationsService,
} from '../../services/notifications.service';
import { colors } from '../../theme/colors';

// ─── Channel meta ─────────────────────────────────────────────────────────────

type ChannelMeta = { key: ChannelKey; label: string; icon: React.ReactNode; color: string };

const CHANNELS: ChannelMeta[] = [
  {
    key: 'in_app',
    label: 'In-App',
    icon: <Smartphone size={13} color={colors.white} />,
    color: colors.primary,
  },
  { key: 'email', label: 'Email', icon: <Mail size={13} color={colors.white} />, color: '#3b82f6' },
  {
    key: 'sms',
    label: 'SMS',
    icon: <MessageCircle size={13} color={colors.white} />,
    color: colors.success,
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: <MessageSquare size={13} color={colors.white} />,
    color: '#25D366',
  },
  { key: 'push', label: 'Push', icon: <Bell size={13} color={colors.white} />, color: '#eab308' },
];

// ─── Category meta ────────────────────────────────────────────────────────────

type CategoryMeta = { key: CategoryKey; label: string; subtitle: string; icon: React.ReactNode };

const CATEGORIES: CategoryMeta[] = [
  {
    key: 'appointment_reminders',
    label: 'Appointment Reminders',
    subtitle: 'Reminders before your scheduled appointments',
    icon: <Bell size={20} color={colors.primary} />,
  },
  {
    key: 'appointment_updates',
    label: 'Appointment Updates',
    subtitle: 'Booked, confirmed, or cancelled appointments',
    icon: <ClipboardList size={20} color={colors.secondary} />,
  },
  {
    key: 'prescription_updates',
    label: 'Prescription Updates',
    subtitle: 'New prescriptions and pharmacy order updates',
    icon: <Pill size={20} color={colors.accent} />,
  },
  {
    key: 'payment_updates',
    label: 'Payment Updates',
    subtitle: 'Payment confirmations and transaction receipts',
    icon: <CreditCard size={20} color={colors.success} />,
  },
  {
    key: 'health_reminders',
    label: 'Health Reminders',
    subtitle: 'Medication and health checkup reminders',
    icon: <Heart size={20} color={colors.destructive} />,
  },
  {
    key: 'vitals_alerts',
    label: 'Vitals Alerts',
    subtitle: 'Alerts when your vitals need attention',
    icon: <TrendingUp size={20} color={colors.secondary} />,
  },
  {
    key: 'message_notifications',
    label: 'Message Notifications',
    subtitle: 'Notifications for unread messages',
    icon: <MessageCircle size={20} color={colors.primary} />,
  },
  {
    key: 'promotional',
    label: 'Promotions & Offers',
    subtitle: 'Health tips, special offers, and insights',
    icon: <Tag size={20} color={colors.mutedForeground} />,
  },
];

// ─── Email delay options ──────────────────────────────────────────────────────

const DELAY_OPTIONS: Array<{ label: string; minutes: number }> = [
  { label: '5 minutes', minutes: 5 },
  { label: '10 minutes', minutes: 10 },
  { label: '20 minutes', minutes: 20 },
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
];

const COOLDOWN_OPTIONS: Array<{ label: string; hours: number }> = [
  { label: '1 hour', hours: 1 },
  { label: '2 hours', hours: 2 },
  { label: '3 hours', hours: 3 },
  { label: '6 hours', hours: 6 },
  { label: '12 hours', hours: 12 },
  { label: 'Never', hours: 0 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-xs text-muted-foreground uppercase tracking-wider px-5 pt-6 pb-2 font-semibold">
      {title}
    </Text>
  );
}

/** Channel icon chip — small coloured square with icon, tappable */
function ChannelChip({
  meta,
  active,
  onToggle,
}: {
  meta: ChannelMeta;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={`${meta.label} notifications`}
      accessibilityState={{ checked: active }}
      className="items-center gap-1"
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          backgroundColor: active ? meta.color : colors.muted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {meta.icon}
      </View>
      <Text
        style={{
          fontSize: 9,
          fontWeight: '600',
          color: active ? colors.foreground : colors.mutedForeground,
          textAlign: 'center',
        }}
      >
        {meta.label}
      </Text>
    </TouchableOpacity>
  );
}

/** One category row: icon + label/subtitle on left, 5 channel chips on right */
function CategoryRow({
  meta,
  channels,
  onToggleChannel,
  isLast,
}: {
  meta: CategoryMeta;
  channels: NotificationPreferences[CategoryKey];
  onToggleChannel: (ch: ChannelKey) => void;
  isLast: boolean;
}) {
  const anyActive = CHANNELS.some((c) => channels[c.key]);

  return (
    <View className={`p-4 bg-card ${!isLast ? 'border-b border-border' : ''}`}>
      {/* Top: icon + label */}
      <View className="flex-row items-center gap-3 mb-3">
        <View className="w-9 h-9 rounded-full bg-muted items-center justify-center">
          {meta.icon}
        </View>
        <View className="flex-1">
          <Text
            className="text-foreground font-medium"
            style={{ color: anyActive ? colors.foreground : colors.mutedForeground }}
          >
            {meta.label}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
            {meta.subtitle}
          </Text>
        </View>
      </View>

      {/* Bottom: 5 channel chips */}
      <View className="flex-row justify-between px-1">
        {CHANNELS.map((ch) => (
          <ChannelChip
            key={ch.key}
            meta={ch}
            active={channels[ch.key]}
            onToggle={() => onToggleChannel(ch.key)}
          />
        ))}
      </View>
    </View>
  );
}

/** Standard toggle row used for simple on/off settings */
function ToggleRow({
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
        <Text className="text-sm text-muted-foreground mt-0.5">{subtitle}</Text>
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

/** Coming-soon row — dimmed, no interaction */
function ComingSoonRow({
  icon,
  label,
  subtitle,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center p-4 bg-card ${!isLast ? 'border-b border-border' : ''}`}
      style={{ opacity: 0.5 }}
    >
      <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">{icon}</View>
      <View className="flex-1 mr-3">
        <Text className="text-foreground font-medium">{label}</Text>
        <Text className="text-sm text-muted-foreground mt-0.5">{subtitle}</Text>
      </View>
      <View className="bg-muted border border-border rounded-full px-2.5 py-1">
        <Text className="text-xs font-semibold text-muted-foreground">Coming Soon</Text>
      </View>
    </View>
  );
}

/** Bottom-sheet option picker */
function PickerSheet<T>({
  visible,
  title,
  options,
  selectedIndex,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: Array<{ label: string; value: T }>;
  selectedIndex: number;
  onSelect: (index: number, value: T) => void;
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
          {options.map((opt, i) => {
            const sel = i === selectedIndex;
            return (
              <TouchableOpacity
                key={String(opt.value)}
                activeOpacity={0.7}
                onPress={() => {
                  onSelect(i, opt.value);
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
                  {opt.label}
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationPreferencesScreen() {
  const navigation = useNavigation<any>();

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [showDelayPicker, setShowDelayPicker] = useState(false);
  const [showCooldownPicker, setShowCooldownPicker] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      const [prefsResult, statsResult] = await Promise.allSettled([
        notificationsService.getPreferences(),
        notificationsService.getStats(),
      ]);
      if (prefsResult.status === 'fulfilled' && prefsResult.value) {
        setPrefs({ ...DEFAULT_PREFS, ...prefsResult.value });
      }
      if (statsResult.status === 'fulfilled' && statsResult.value) {
        setStats(statsResult.value);
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

  // ── Debounced PATCH ──────────────────────────────────────────────────────────

  const scheduleSave = useCallback((patch: Partial<NotificationPreferences>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await notificationsService.updatePreferences(patch);
      } catch {
        Alert.alert('Could not save', 'Your preferences could not be saved. Please try again.');
      } finally {
        setSaving(false);
      }
    }, 600);
  }, []);

  // ── Toggle a single channel within a category ────────────────────────────────

  const toggleChannel = useCallback(
    (category: CategoryKey, channel: ChannelKey) => {
      setPrefs((prev) => {
        const updated: NotificationPreferences = {
          ...prev,
          [category]: {
            ...prev[category],
            [channel]: !prev[category][channel],
          },
        };
        scheduleSave({ [category]: updated[category] });
        return updated;
      });
    },
    [scheduleSave]
  );

  // ── Enable / Disable all categories × all channels ──────────────────────────

  const setAllCategories = useCallback(
    (value: boolean) => {
      const allFlags = Object.fromEntries(CHANNELS.map((c) => [c.key, value])) as Record<
        ChannelKey,
        boolean
      >;

      const patch = Object.fromEntries(
        CATEGORIES.map((cat) => [cat.key, { ...allFlags }])
      ) as Partial<NotificationPreferences>;

      setPrefs((prev) => ({ ...prev, ...patch }));
      scheduleSave(patch);
    },
    [scheduleSave]
  );

  // ── Quiet hours toggle ───────────────────────────────────────────────────────

  const toggleQuietHours = useCallback(() => {
    setPrefs((prev) => {
      const updated: QuietHours = {
        ...prev.quiet_hours,
        enabled: !prev.quiet_hours.enabled,
      };
      scheduleSave({ quiet_hours: updated });
      return { ...prev, quiet_hours: updated };
    });
  }, [scheduleSave]);

  // ── Messaging timing ─────────────────────────────────────────────────────────

  const setMessagingTiming = useCallback(
    (patch: Partial<MessagingTiming>) => {
      setPrefs((prev) => {
        const updated: MessagingTiming = { ...prev.messaging_timing, ...patch };
        scheduleSave({ messaging_timing: updated });
        return { ...prev, messaging_timing: updated };
      });
    },
    [scheduleSave]
  );

  // ── Derived stats ────────────────────────────────────────────────────────────

  const totalChannelSlots = CATEGORIES.length * CHANNELS.length;
  const activeChannelSlots = CATEGORIES.reduce(
    (sum, cat) => sum + CHANNELS.filter((ch) => prefs[cat.key][ch.key]).length,
    0
  );

  const currentDelayIndex = DELAY_OPTIONS.findIndex(
    (o) => o.minutes === prefs.messaging_timing.unread_threshold_minutes
  );
  const currentCooldownIndex = COOLDOWN_OPTIONS.findIndex(
    (o) => o.hours === prefs.messaging_timing.cooldown_hours
  );
  const delayLabel =
    DELAY_OPTIONS[currentDelayIndex]?.label ??
    `${prefs.messaging_timing.unread_threshold_minutes} min`;
  const cooldownLabel =
    COOLDOWN_OPTIONS[currentCooldownIndex]?.label ?? `${prefs.messaging_timing.cooldown_hours}h`;

  // ── Loading state ────────────────────────────────────────────────────────────

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

  // ── Main render ──────────────────────────────────────────────────────────────

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
                {activeChannelSlots} of {totalChannelSlots} channels active
              </Text>
              <Text className="text-muted-foreground text-sm mt-0.5">
                {stats?.unread
                  ? `${stats.unread} unread notification${stats.unread === 1 ? '' : 's'}`
                  : 'Manage how RapidCapsule reaches you'}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View className="px-4 pb-4">
            <View className="h-1.5 bg-muted rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${(activeChannelSlots / totalChannelSlots) * 100}%` }}
              />
            </View>
          </View>

          {/* Enable / Disable All */}
          <View className="flex-row border-t border-border">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setAllCategories(true)}
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
                  'This will turn off all notification channels. Critical security and payment alerts will still be delivered.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Disable All',
                      style: 'destructive',
                      onPress: () => setAllCategories(false),
                    },
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

        {/* ── Notification Types ── */}
        <SectionHeader title="Notification Types" />
        <View className="mx-5 bg-card border border-border rounded-2xl overflow-hidden">
          {CATEGORIES.map((cat, i) => (
            <CategoryRow
              key={cat.key}
              meta={cat}
              channels={prefs[cat.key]}
              onToggleChannel={(ch) => toggleChannel(cat.key, ch)}
              isLast={i === CATEGORIES.length - 1}
            />
          ))}
        </View>

        {/* ── Critical alerts note ── */}
        <View className="mx-5 mt-4 flex-row items-start gap-2.5 bg-muted/50 border border-border rounded-2xl p-4">
          <AlertCircle size={15} color={colors.mutedForeground} style={{ marginTop: 1 }} />
          <Text className="flex-1 text-xs text-muted-foreground leading-5">
            Critical notifications — including security alerts and payment confirmations — are
            always delivered regardless of your preferences.
          </Text>
        </View>

        {/* ── Message Email Timing ── */}
        <SectionHeader title="Message Email Timing" />
        <View className="mx-5 bg-card border border-border rounded-2xl overflow-hidden">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowDelayPicker(true)}
            className="flex-row items-center p-4 bg-card border-b border-border"
          >
            <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">
              <Mail size={20} color={colors.accent} />
            </View>
            <View className="flex-1 mr-2">
              <Text className="text-foreground font-medium">Send email after unread for</Text>
              <Text className="text-sm text-muted-foreground mt-0.5">
                Delay before first email notification
              </Text>
            </View>
            <Text className="text-sm text-primary font-semibold mr-1">{delayLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowCooldownPicker(true)}
            className="flex-row items-center p-4 bg-card"
          >
            <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">
              <Bell size={20} color={colors.secondary} />
            </View>
            <View className="flex-1 mr-2">
              <Text className="text-foreground font-medium">Repeat no more often than</Text>
              <Text className="text-sm text-muted-foreground mt-0.5">
                Cooldown between repeat emails
              </Text>
            </View>
            <Text className="text-sm text-primary font-semibold mr-1">{cooldownLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Additional ── */}
        <SectionHeader title="Additional" />
        <View className="mx-5 bg-card border border-border rounded-2xl overflow-hidden">
          <ToggleRow
            icon={<Moon size={20} color={colors.accent} />}
            label="Quiet Hours"
            subtitle={
              prefs.quiet_hours.enabled
                ? `${prefs.quiet_hours.start} – ${prefs.quiet_hours.end}`
                : 'Pause non-urgent notifications at night'
            }
            value={prefs.quiet_hours.enabled}
            onToggle={toggleQuietHours}
          />
          <ComingSoonRow
            icon={<Volume2 size={20} color={colors.secondary} />}
            label="Notification Sound"
            subtitle="Customise your alert sound"
            isLast
          />
        </View>
      </ScrollView>

      {/* ── Pickers ── */}
      <PickerSheet
        visible={showDelayPicker}
        title="Send email after unread for"
        options={DELAY_OPTIONS.map((o) => ({ label: o.label, value: o.minutes }))}
        selectedIndex={currentDelayIndex}
        onSelect={(_, minutes) => setMessagingTiming({ unread_threshold_minutes: minutes })}
        onClose={() => setShowDelayPicker(false)}
      />
      <PickerSheet
        visible={showCooldownPicker}
        title="Repeat no more often than every"
        options={COOLDOWN_OPTIONS.map((o) => ({ label: o.label, value: o.hours }))}
        selectedIndex={currentCooldownIndex}
        onSelect={(_, hours) => setMessagingTiming({ cooldown_hours: hours })}
        onClose={() => setShowCooldownPicker(false)}
      />
    </SafeAreaView>
  );
}
