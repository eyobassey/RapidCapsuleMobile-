import { useNavigation } from '@react-navigation/native';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  ChevronRight,
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
  NotificationPreferences,
  NotificationStats,
  notificationsService,
} from '../../services/notifications.service';
import { colors } from '../../theme/colors';

// ─── Defaults (exact API shape) ───────────────────────────────────────────────

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

const EMAIL_DELAY_OPTIONS = ['5 minutes', '10 minutes', '20 minutes', '30 minutes', '1 hour'];
const EMAIL_REPEAT_OPTIONS = ['1 hour', '2 hours', '3 hours', '6 hours', '12 hours', 'Never'];

// ─── Reusable row components ──────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-xs text-muted-foreground uppercase tracking-wider px-5 pt-6 pb-2 font-semibold">
      {title}
    </Text>
  );
}

/** Standard toggle row — matches the ProfileScreen ListItem pattern exactly */
function ToggleRow({
  icon,
  label,
  subtitle,
  value,
  onToggle,
  isLast = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
  isLast?: boolean;
  disabled?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center p-4 bg-card ${!isLast ? 'border-b border-border' : ''}`}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">{icon}</View>
      <View className="flex-1 mr-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-foreground font-medium">{label}</Text>
          {disabled && (
            <View className="bg-muted rounded px-1.5 py-0.5">
              <Text className="text-muted-foreground text-xs font-medium">Soon</Text>
            </View>
          )}
        </View>
        <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={disabled ? undefined : onToggle}
        disabled={disabled}
        trackColor={{ false: colors.muted, true: `${colors.primary}60` }}
        thumbColor={value ? colors.primary : colors.mutedForeground}
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
      />
    </View>
  );
}

/** Tappable row that opens a picker / navigates — no toggle */
function ActionRow({
  icon,
  label,
  subtitle,
  value,
  onPress,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  value: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className={`flex-row items-center p-4 bg-card ${!isLast ? 'border-b border-border' : ''}`}
    >
      <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">{icon}</View>
      <View className="flex-1 mr-3">
        <Text className="text-foreground font-medium">{label}</Text>
        <Text className="text-sm text-muted-foreground mt-0.5">{subtitle}</Text>
      </View>
      <Text className="text-sm text-primary font-medium mr-1">{value}</Text>
      <ChevronRight size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

/** Coming-soon info row (no interactive control) */
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
      style={{ opacity: 0.55 }}
    >
      <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">{icon}</View>
      <View className="flex-1 mr-3">
        <Text className="text-foreground font-medium">{label}</Text>
        <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View className="bg-muted border border-border rounded-full px-2.5 py-1">
        <Text className="text-xs font-semibold text-muted-foreground">Coming Soon</Text>
      </View>
    </View>
  );
}

// ─── Bottom-sheet picker ──────────────────────────────────────────────────────

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

// ─── Screen ───────────────────────────────────────────────────────────────────

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

  const fetchAll = useCallback(async () => {
    try {
      const [prefsResult, statsResult] = await Promise.allSettled([
        notificationsService.getPreferences(),
        notificationsService.getStats(),
      ]);
      if (prefsResult.status === 'fulfilled' && prefsResult.value) {
        const merged: NotificationPreferences = { ...DEFAULT_PREFS, ...prefsResult.value };
        setPrefs(merged);
        pendingPrefs.current = merged;
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
  const unreadCount = stats?.unread ?? 0;

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
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                  : 'Manage how RapidCapsule reaches you'}
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
          <ToggleRow
            icon={<Smartphone size={20} color={colors.primary} />}
            label="In-App Notifications"
            subtitle="Alerts inside the app"
            value={prefs.in_app}
            onToggle={() => toggle('in_app')}
          />
          <ToggleRow
            icon={<Bell size={20} color={colors.secondary} />}
            label="Push Notifications"
            subtitle="Alerts on your device lock screen"
            value={prefs.push}
            onToggle={() => toggle('push')}
          />
          <ToggleRow
            icon={<Mail size={20} color={colors.accent} />}
            label="Email Notifications"
            subtitle="Updates sent to your email"
            value={prefs.email}
            onToggle={() => toggle('email')}
          />
          <ToggleRow
            icon={<MessageCircle size={20} color={colors.success} />}
            label="SMS Notifications"
            subtitle="Text messages to your phone"
            value={prefs.sms}
            onToggle={() => toggle('sms')}
          />
          <ComingSoonRow
            icon={<MessageSquare size={20} color={colors.mutedForeground} />}
            label="WhatsApp"
            subtitle="WhatsApp messages"
            isLast
          />
        </View>

        {/* ── Notification Types ── */}
        <SectionHeader title="Notification Types" />
        <View className="mx-5 bg-card border border-border rounded-2xl overflow-hidden">
          <ToggleRow
            icon={<Bell size={20} color={colors.primary} />}
            label="Appointment Reminders"
            subtitle="Reminders before your scheduled appointments"
            value={prefs.appointment_reminders}
            onToggle={() => toggle('appointment_reminders')}
          />
          <ToggleRow
            icon={<ClipboardList size={20} color={colors.mutedForeground} />}
            label="Appointment Updates"
            subtitle="Updates when appointments are booked or cancelled"
            value={false}
            onToggle={() => {}}
            disabled
          />
          <ToggleRow
            icon={<Bell size={20} color={colors.secondary} />}
            label="Prescription Updates"
            subtitle="New prescriptions and pharmacy order updates"
            value={prefs.prescription_updates}
            onToggle={() => toggle('prescription_updates')}
          />
          <ToggleRow
            icon={<CreditCard size={20} color={colors.success} />}
            label="Payment Alerts"
            subtitle="Payment confirmations and transaction receipts"
            value={prefs.payment_alerts}
            onToggle={() => toggle('payment_alerts')}
          />
          <ToggleRow
            icon={<Heart size={20} color={colors.mutedForeground} />}
            label="Health Reminders"
            subtitle="Medication and health checkup reminders"
            value={false}
            onToggle={() => {}}
            disabled
          />
          <ToggleRow
            icon={<TrendingUp size={20} color={colors.mutedForeground} />}
            label="Vitals Alerts"
            subtitle="Alerts when your vitals need attention"
            value={false}
            onToggle={() => {}}
            disabled
          />
          <ToggleRow
            icon={<MessageCircle size={20} color={colors.mutedForeground} />}
            label="Message Notifications"
            subtitle="Email notifications for unread messages"
            value={false}
            onToggle={() => {}}
            disabled
          />
          <ToggleRow
            icon={<Tag size={20} color={colors.mutedForeground} />}
            label="Promotions & Offers"
            subtitle="Health tips, offers, and insights"
            value={prefs.promotional}
            onToggle={() => toggle('promotional')}
            isLast
          />
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
          <ActionRow
            icon={<Mail size={20} color={colors.accent} />}
            label="Send email after unread for"
            subtitle="Delay before first email notification"
            value={emailDelay}
            onPress={() => setShowDelayPicker(true)}
          />
          <ActionRow
            icon={<Bell size={20} color={colors.secondary} />}
            label="Repeat no more than every"
            subtitle="Minimum time between repeat emails"
            value={emailRepeat}
            onPress={() => setShowRepeatPicker(true)}
            isLast
          />
        </View>

        {/* ── Additional ── */}
        <SectionHeader title="Additional" />
        <View className="mx-5 bg-card border border-border rounded-2xl overflow-hidden">
          <ToggleRow
            icon={<Moon size={20} color={colors.accent} />}
            label="Quiet Hours"
            subtitle="Pause non-urgent notifications at night"
            value={quietHours}
            onToggle={() => setQuietHours((v) => !v)}
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
        options={EMAIL_DELAY_OPTIONS}
        selected={emailDelay}
        onSelect={setEmailDelay}
        onClose={() => setShowDelayPicker(false)}
      />
      <PickerSheet
        visible={showRepeatPicker}
        title="Repeat no more than every"
        options={EMAIL_REPEAT_OPTIONS}
        selected={emailRepeat}
        onSelect={setEmailRepeat}
        onClose={() => setShowRepeatPicker(false)}
      />
    </SafeAreaView>
  );
}
