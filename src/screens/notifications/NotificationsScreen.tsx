import { useNavigation } from '@react-navigation/native';
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  CheckCircle,
  CreditCard,
  FileText,
  Package,
  ShieldCheck,
  Star,
  Stethoscope,
  Trash2,
  TrendingUp,
  Trophy,
  Truck,
  Video,
  Wallet as WalletIcon,
} from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { RefreshControl, SectionList, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, Header } from '../../components/ui';
import { Text } from '../../components/ui/Text';
import {
  useMarkAllReadMutation,
  useMarkReadMutation,
  useNotificationsQuery,
  useUnreadCountQuery,
} from '../../hooks/queries';
import { useNotificationsStore } from '../../store/notifications';
import { colors } from '../../theme/colors';
import { formatRelativeDate, timeAgo } from '../../utils/formatters';

// ---- Icon mapping ----
// Maps notification type prefixes to lucide icon components.
// Uses a lookup rather than dynamically importing to keep bundle predictable.
const ICON_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  appointment_booked: { icon: CalendarPlus, color: colors.primary },
  appointment_confirmed: { icon: CalendarCheck, color: colors.success },
  appointment_reminder: { icon: Bell, color: colors.secondary },
  appointment_cancelled: { icon: CalendarX, color: colors.destructive },
  appointment_rescheduled: { icon: CalendarCheck, color: colors.secondary },
  appointment_completed: { icon: CheckCircle, color: colors.success },
  appointment_missed: { icon: AlertTriangle, color: colors.destructive },
  appointment_started: { icon: Video, color: colors.primary },

  prescription_created: { icon: FileText, color: colors.primary },
  prescription_ready: { icon: Package, color: colors.success },
  prescription_payment_required: { icon: CreditCard, color: colors.secondary },
  prescription_shipped: { icon: Truck, color: colors.primary },
  prescription_delivered: { icon: CheckCircle, color: colors.success },

  pharmacy_order_placed: { icon: Package, color: colors.primary },
  pharmacy_order_confirmed: { icon: CheckCircle, color: colors.success },
  pharmacy_order_shipped: { icon: Truck, color: colors.primary },
  pharmacy_order_delivered: { icon: CheckCircle, color: colors.success },
  pharmacy_order_cancelled: { icon: CalendarX, color: colors.destructive },

  payment_received: { icon: WalletIcon, color: colors.success },
  payment_failed: { icon: AlertTriangle, color: colors.destructive },
  wallet_credited: { icon: WalletIcon, color: colors.success },
  wallet_debited: { icon: WalletIcon, color: colors.secondary },
  refund_processed: { icon: WalletIcon, color: colors.success },

  health_checkup_complete: { icon: Stethoscope, color: colors.success },
  health_score_updated: { icon: TrendingUp, color: colors.primary },
  vitals_alert: { icon: AlertTriangle, color: colors.destructive },
  vitals_reminder: { icon: Bell, color: colors.secondary },

  account_verified: { icon: ShieldCheck, color: colors.success },
  welcome: { icon: Star, color: colors.primary },
  review_received: { icon: Star, color: colors.secondary },

  recovery_milestone_achieved: { icon: Trophy, color: colors.success },
  recovery_risk_high: { icon: AlertTriangle, color: colors.destructive },
  recovery_risk_moderate: { icon: AlertTriangle, color: colors.secondary },
};

const DEFAULT_ICON = { icon: Bell, color: colors.primary };

// ---- Navigation routing ----
// Maps notification type prefixes to a tab + screen for cross-tab navigation.
// Uses the longest matching prefix so e.g. "pharmacy_order_shipped" matches "pharmacy_order".
const NOTIFICATION_ROUTES: Array<{
  prefix: string;
  tab: string;
  screen: string;
}> = [
  // Appointments → Bookings tab
  { prefix: 'appointment_', tab: 'Bookings', screen: 'AppointmentsList' },

  // Prescriptions → Profile tab
  { prefix: 'prescription_', tab: 'Profile', screen: 'PrescriptionsList' },

  // Pharmacy orders → Pharmacy tab
  { prefix: 'pharmacy_', tab: 'Pharmacy', screen: 'MyOrders' },

  // Payments & wallet → Profile tab (Wallet screen)
  { prefix: 'payment_', tab: 'Profile', screen: 'Wallet' },
  { prefix: 'wallet_', tab: 'Profile', screen: 'Wallet' },
  { prefix: 'refund_', tab: 'Profile', screen: 'Wallet' },

  // Health checkup → Home tab
  { prefix: 'health_checkup_', tab: 'Home', screen: 'HealthCheckupHistory' },
  { prefix: 'health_score_', tab: 'Home', screen: 'Vitals' },

  // Vitals → Home tab
  { prefix: 'vitals_', tab: 'Home', screen: 'Vitals' },

  // Recovery → Home tab
  { prefix: 'recovery_', tab: 'Home', screen: 'RecoveryDashboard' },

  // Health Insights → Home tab
  { prefix: 'health_insight_', tab: 'Home', screen: 'HealthInsights' },

  // Dr. Eka → Home tab
  { prefix: 'dr_eka_', tab: 'Home', screen: 'DrEka' },
];

function getRouteForNotification(type?: string): { tab: string; screen: string } | null {
  if (!type) return null;
  for (const route of NOTIFICATION_ROUTES) {
    if (type.startsWith(route.prefix)) {
      return { tab: route.tab, screen: route.screen };
    }
  }
  return null;
}

function getNotificationIcon(type?: string): { icon: React.ElementType; color: string } {
  if (!type) return DEFAULT_ICON;
  return ICON_MAP[type] ?? DEFAULT_ICON;
}

// ---- Section grouping ----
interface NotificationSection {
  title: string;
  data: any[];
}

function groupByDate(notifications: any[]): NotificationSection[] {
  const groups: Record<string, any[]> = {};

  for (const n of notifications) {
    const label = formatRelativeDate(n.created_at || n.createdAt || new Date());
    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(n);
  }

  // Sort sections: Today first, Yesterday second, then by original order
  const order = ['Today', 'Yesterday'];
  return Object.entries(groups)
    .sort(([a], [b]) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return 0;
    })
    .map(([title, data]) => ({ title, data }));
}

// ---- Notification Row ----
function NotificationItem({
  notification,
  onPress,
  onRemove,
}: {
  notification: any;
  onPress: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const isUnread = !notification.is_read;
  const { icon: IconComponent, color: iconColor } = getNotificationIcon(
    notification.type || notification.notification_type
  );

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${isUnread ? 'Unread: ' : ''}${notification.title}`}
      onPress={() => onPress(notification._id)}
      className={`mx-5 mb-2 rounded-2xl border border-border p-4 flex-row items-start gap-3 ${
        isUnread ? 'bg-card' : 'bg-card/60'
      }`}
    >
      {/* Icon */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
          backgroundColor: `${iconColor}1A`,
        }}
      >
        <IconComponent size={18} color={iconColor} />
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text
            className={`text-sm flex-1 ${
              isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'
            }`}
            numberOfLines={2}
          >
            {notification.title}
          </Text>

          {/* Unread indicator */}
          {isUnread && <View className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />}
        </View>

        {notification.message || notification.body ? (
          <Text className="text-xs text-muted-foreground mt-1 leading-relaxed" numberOfLines={2}>
            {notification.message || notification.body}
          </Text>
        ) : null}

        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-[10px] text-muted-foreground">
            {timeAgo(notification.created_at || notification.createdAt || new Date())}
          </Text>

          <TouchableOpacity
            onPress={() => onRemove(notification._id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="Remove notification"
          >
            <Trash2 size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ---- Section Header ----
function SectionHeader({ title }: { title: string }) {
  return (
    <View className="px-6 pt-5 pb-2">
      <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {title}
      </Text>
    </View>
  );
}

// ---- Main Screen ----
export default function NotificationsScreen() {
  const navigation = useNavigation<any>();

  // React Query hooks
  const { data: notifications = [], isLoading, refetch } = useNotificationsQuery();

  const { data: unreadCount = 0 } = useUnreadCountQuery();

  const markReadMutation = useMarkReadMutation();
  const markAllReadMutation = useMarkAllReadMutation();

  // Keep store's removeNotification for optimistic local removal
  const { removeNotification } = useNotificationsStore();

  const sections = useMemo(() => groupByDate(notifications), [notifications]);

  const handlePress = useCallback(
    (id: string) => {
      const notif = notifications.find((n: any) => n._id === id);
      if (!notif) return;

      // Mark as read
      if (!notif.is_read) {
        markReadMutation.mutate(id);
      }

      // Navigate based on notification type
      const notifType = notif.type || notif.notification_type;
      const route = getRouteForNotification(notifType);
      if (route) {
        navigation.navigate(route.tab, { screen: route.screen });
      }
    },
    [notifications, markReadMutation, navigation]
  );

  const handleRemove = useCallback(
    (id: string) => {
      removeNotification(id);
    },
    [removeNotification]
  );

  const handleMarkAllRead = useCallback(() => {
    markAllReadMutation.mutate();
  }, [markAllReadMutation]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header
        title="Notifications"
        onBack={() => navigation.goBack()}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
            >
              <Text className="text-xs font-semibold text-primary">Read All</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <SectionList
        sections={sections}
        keyExtractor={(item: any) => item._id || item.id || String(Math.random())}
        renderItem={({ item }) => (
          <NotificationItem notification={item} onPress={handlePress} onRemove={handleRemove} />
        )}
        renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
        contentContainerStyle={notifications.length === 0 ? { flex: 1 } : { paddingBottom: 40 }}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon={<Bell size={40} color={colors.mutedForeground} />}
              title="No notifications yet"
              subtitle="We'll notify you when something important happens with your appointments, prescriptions, and health updates."
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
