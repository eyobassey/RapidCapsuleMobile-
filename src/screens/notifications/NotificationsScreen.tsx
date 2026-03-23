import { useNavigation } from '@react-navigation/native';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
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

import { EmptyState, Header, Skeleton } from '../../components/ui';
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
const NOTIFICATION_ROUTES: Array<{ prefix: string; tab: string; screen: string }> = [
  { prefix: 'appointment_', tab: 'Bookings', screen: 'AppointmentsList' },
  { prefix: 'prescription_', tab: 'Profile', screen: 'PrescriptionsList' },
  { prefix: 'pharmacy_', tab: 'Pharmacy', screen: 'MyOrders' },
  { prefix: 'payment_', tab: 'Profile', screen: 'Wallet' },
  { prefix: 'wallet_', tab: 'Profile', screen: 'Wallet' },
  { prefix: 'refund_', tab: 'Profile', screen: 'Wallet' },
  { prefix: 'health_checkup_', tab: 'Home', screen: 'HealthCheckupHistory' },
  { prefix: 'health_score_', tab: 'Home', screen: 'Vitals' },
  { prefix: 'vitals_', tab: 'Home', screen: 'Vitals' },
  { prefix: 'recovery_', tab: 'Home', screen: 'RecoveryDashboard' },
  { prefix: 'health_insight_', tab: 'Home', screen: 'HealthInsights' },
  { prefix: 'dr_eka_', tab: 'Home', screen: 'DrEka' },
];

function getRouteForNotification(type?: string): { tab: string; screen: string } | null {
  if (!type) return null;
  for (const route of NOTIFICATION_ROUTES) {
    if (type.startsWith(route.prefix)) return { tab: route.tab, screen: route.screen };
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
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }
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

// ---- Skeleton loader ----
function NotificationSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, gap: 10, paddingTop: 8 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            gap: 12,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="70%" height={13} />
            <Skeleton width="90%" height={11} />
            <Skeleton width="30%" height={10} />
          </View>
        </View>
      ))}
    </View>
  );
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
      style={{
        marginHorizontal: 20,
        marginBottom: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isUnread ? `${colors.primary}30` : colors.border,
        backgroundColor: colors.card,
        flexDirection: 'row',
        alignItems: 'flex-start',
        overflow: 'hidden',
      }}
    >
      {/* Unread accent bar */}
      {isUnread && (
        <View
          style={{
            width: 3,
            alignSelf: 'stretch',
            backgroundColor: colors.primary,
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
          }}
        />
      )}

      <View
        style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 }}
      >
        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${iconColor}18`,
            flexShrink: 0,
          }}
        >
          <IconComponent size={18} color={iconColor} />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text
              style={{
                flex: 1,
                fontSize: 13,
                lineHeight: 18,
                color: isUnread ? colors.foreground : `${colors.foreground}99`,
                fontWeight: isUnread ? '600' : '500',
              }}
              numberOfLines={2}
            >
              {notification.title}
            </Text>
            {isUnread && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.primary,
                  marginTop: 4,
                  flexShrink: 0,
                }}
              />
            )}
          </View>

          {notification.message || notification.body ? (
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                marginTop: 3,
                lineHeight: 17,
              }}
              numberOfLines={2}
            >
              {notification.message || notification.body}
            </Text>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 8,
            }}
          >
            <Text style={{ fontSize: 11, color: `${colors.mutedForeground}99` }}>
              {timeAgo(notification.created_at || notification.createdAt || new Date())}
            </Text>

            <TouchableOpacity
              onPress={() => onRemove(notification._id)}
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 4 }}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel="Remove notification"
            >
              <Trash2 size={13} color={`${colors.mutedForeground}80`} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ---- Section Header ----
function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 8,
        gap: 8,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: colors.mutedForeground,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: colors.muted,
          borderRadius: 10,
          paddingHorizontal: 7,
          paddingVertical: 2,
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: '600', color: colors.mutedForeground }}>
          {count}
        </Text>
      </View>
    </View>
  );
}

// ---- Main Screen ----
export default function NotificationsScreen() {
  const navigation = useNavigation<any>();

  const { data: notifications = [], isLoading, refetch } = useNotificationsQuery();
  const { data: unreadCount = 0 } = useUnreadCountQuery();
  const markReadMutation = useMarkReadMutation();
  const markAllReadMutation = useMarkAllReadMutation();
  const { removeNotification } = useNotificationsStore();

  const sections = useMemo(() => groupByDate(notifications), [notifications]);

  const handlePress = useCallback(
    (id: string) => {
      const notif = notifications.find((n: any) => n._id === id);
      if (!notif) return;
      if (!notif.is_read) markReadMutation.mutate(id);
      const notifType = notif.type || notif.notification_type;
      const route = getRouteForNotification(notifType);
      if (route) navigation.navigate(route.tab, { screen: route.screen });
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Header
        title="Notifications"
        onBack={() => navigation.goBack()}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
            >
              <CheckCheck size={22} color={colors.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isLoading ? (
        <NotificationSkeleton />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item: any) => item._id || item.id || String(Math.random())}
          renderItem={({ item }) => (
            <NotificationItem notification={item} onPress={handlePress} onRemove={handleRemove} />
          )}
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} count={section.data.length} />
          )}
          contentContainerStyle={
            notifications.length === 0 ? { flex: 1 } : { paddingBottom: 40, paddingTop: 4 }
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Bell size={40} color={colors.mutedForeground} />}
              title="No notifications yet"
              subtitle="We'll notify you when something important happens with your appointments, prescriptions, and health updates."
            />
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
      )}
    </SafeAreaView>
  );
}
