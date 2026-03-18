import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  Calendar,
  CreditCard,
  Heart,
  Activity,
  Pill,
  Dumbbell,
  MessageSquare,
  Megaphone,
  Smartphone,
  Mail,
  MessageCircle,
  Send,
  BellRing,
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import { ActivityIndicator, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '../../components/ui';
import { Text } from '../../components/ui/Text';
import {
  useNotificationPreferencesQuery,
  useUpdatePreferenceMutation,
} from '../../hooks/queries/useNotificationPreferencesQuery';
import {
  Channel,
  ChannelPreferences,
  PreferenceCategory,
} from '../../services/notification-preferences.service';
import { colors } from '../../theme/colors';

// ── Category config ────────────────────────────────────────

interface CategoryConfig {
  key: PreferenceCategory;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'appointment_reminders',
    title: 'Appointment Reminders',
    description: 'Get reminded before upcoming appointments',
    icon: Calendar,
    iconColor: colors.primary,
  },
  {
    key: 'appointment_updates',
    title: 'Appointment Updates',
    description: 'Booking confirmations, cancellations, and changes',
    icon: Bell,
    iconColor: colors.secondary,
  },
  {
    key: 'payment_updates',
    title: 'Payment Updates',
    description: 'Payment receipts, refunds, and wallet activity',
    icon: CreditCard,
    iconColor: colors.success,
  },
  {
    key: 'health_reminders',
    title: 'Health Reminders',
    description: 'Health checkup and wellness reminders',
    icon: Heart,
    iconColor: colors.destructive,
  },
  {
    key: 'vitals_alerts',
    title: 'Vitals Alerts',
    description: 'Alerts when vitals are outside normal range',
    icon: Activity,
    iconColor: colors.secondary,
  },
  {
    key: 'prescription_updates',
    title: 'Prescription Updates',
    description: 'New prescriptions and pharmacy order status',
    icon: Pill,
    iconColor: colors.accent,
  },
  {
    key: 'recovery_updates',
    title: 'Recovery Program',
    description: 'Milestones, check-in reminders, and progress',
    icon: Dumbbell,
    iconColor: colors.primary,
  },
  {
    key: 'message_notifications',
    title: 'Message Notifications',
    description: 'Messages from specialists and support',
    icon: MessageSquare,
    iconColor: colors.primary,
  },
  {
    key: 'promotional',
    title: 'Promotional',
    description: 'Health tips, offers, and platform news',
    icon: Megaphone,
    iconColor: colors.mutedForeground,
  },
];

// ── Channel config ─────────────────────────────────────────

interface ChannelConfig {
  key: Channel;
  label: string;
  icon: React.ElementType;
}

const CHANNELS: ChannelConfig[] = [
  { key: 'in_app', label: 'In-App', icon: BellRing },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'sms', label: 'SMS', icon: MessageCircle },
  { key: 'whatsapp', label: 'WhatsApp', icon: Send },
  { key: 'push', label: 'Push', icon: Smartphone },
];

// ── Category Card ──────────────────────────────────────────

function CategoryCard({
  config,
  channels,
  onToggle,
}: {
  config: CategoryConfig;
  channels: ChannelPreferences;
  onToggle: (category: PreferenceCategory, channel: Channel, value: boolean) => void;
}) {
  const IconComponent = config.icon;

  return (
    <View className="mx-5 mb-3 bg-card border border-border rounded-2xl overflow-hidden">
      {/* Category header */}
      <View className="flex-row items-center gap-3 px-4 pt-4 pb-2">
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${config.iconColor}1A`,
          }}
        >
          <IconComponent size={18} color={config.iconColor} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{config.title}</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">{config.description}</Text>
        </View>
      </View>

      {/* Channel toggles */}
      <View className="px-4 pb-3 pt-1">
        {CHANNELS.map((ch) => {
          const ChannelIcon = ch.icon;
          const enabled = channels?.[ch.key] ?? true;

          return (
            <View key={ch.key} className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center gap-2.5">
                <ChannelIcon size={14} color={colors.mutedForeground} />
                <Text className="text-xs text-foreground/80">{ch.label}</Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={(value) => onToggle(config.key, ch.key, value)}
                trackColor={{ false: colors.muted, true: `${colors.primary}80` }}
                thumbColor={enabled ? colors.primary : colors.mutedForeground}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────

export default function NotificationPreferencesScreen() {
  const navigation = useNavigation<any>();
  const { data: preferences, isLoading } = useNotificationPreferencesQuery();
  const updateMutation = useUpdatePreferenceMutation();

  const handleToggle = useCallback(
    (category: PreferenceCategory, channel: Channel, value: boolean) => {
      updateMutation.mutate({ category, channel, value });
    },
    [updateMutation]
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Notification Preferences" onBack={() => navigation.goBack()} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm text-muted-foreground mt-3">Loading preferences...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="pt-4 pb-28"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-xs text-muted-foreground px-6 pb-3">
            Choose how you want to be notified for each category.
          </Text>

          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.key}
              config={cat}
              channels={preferences?.[cat.key] ?? ({} as ChannelPreferences)}
              onToggle={handleToggle}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
