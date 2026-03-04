import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SectionList,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Bell,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  CheckCircle,
  CreditCard,
  FileText,
  Package,
  ShieldCheck,
  Stethoscope,
  Trash2,
  TrendingUp,
  Truck,
  AlertTriangle,
  Wallet as WalletIcon,
  Video,
  Star,
  Trophy,
} from 'lucide-react-native';

import {useNotificationsStore} from '../../store/notifications';
import {Header, EmptyState} from '../../components/ui';
import {colors} from '../../theme/colors';
import {timeAgo, formatRelativeDate} from '../../utils/formatters';

// ---- Icon mapping ----
// Maps notification type prefixes to lucide icon components.
// Uses a lookup rather than dynamically importing to keep bundle predictable.
const ICON_MAP: Record<string, {icon: React.ElementType; color: string}> = {
  appointment_booked: {icon: CalendarPlus, color: colors.primary},
  appointment_confirmed: {icon: CalendarCheck, color: colors.success},
  appointment_reminder: {icon: Bell, color: colors.secondary},
  appointment_cancelled: {icon: CalendarX, color: colors.destructive},
  appointment_rescheduled: {icon: CalendarCheck, color: colors.secondary},
  appointment_completed: {icon: CheckCircle, color: colors.success},
  appointment_missed: {icon: AlertTriangle, color: colors.destructive},
  appointment_started: {icon: Video, color: colors.primary},

  prescription_created: {icon: FileText, color: colors.primary},
  prescription_ready: {icon: Package, color: colors.success},
  prescription_payment_required: {icon: CreditCard, color: colors.secondary},
  prescription_shipped: {icon: Truck, color: colors.primary},
  prescription_delivered: {icon: CheckCircle, color: colors.success},

  pharmacy_order_placed: {icon: Package, color: colors.primary},
  pharmacy_order_confirmed: {icon: CheckCircle, color: colors.success},
  pharmacy_order_shipped: {icon: Truck, color: colors.primary},
  pharmacy_order_delivered: {icon: CheckCircle, color: colors.success},
  pharmacy_order_cancelled: {icon: CalendarX, color: colors.destructive},

  payment_received: {icon: WalletIcon, color: colors.success},
  payment_failed: {icon: AlertTriangle, color: colors.destructive},
  wallet_credited: {icon: WalletIcon, color: colors.success},
  wallet_debited: {icon: WalletIcon, color: colors.secondary},
  refund_processed: {icon: WalletIcon, color: colors.success},

  health_checkup_complete: {icon: Stethoscope, color: colors.success},
  health_score_updated: {icon: TrendingUp, color: colors.primary},
  vitals_alert: {icon: AlertTriangle, color: colors.destructive},
  vitals_reminder: {icon: Bell, color: colors.secondary},

  account_verified: {icon: ShieldCheck, color: colors.success},
  welcome: {icon: Star, color: colors.primary},
  review_received: {icon: Star, color: colors.secondary},

  recovery_milestone_achieved: {icon: Trophy, color: colors.success},
  recovery_risk_high: {icon: AlertTriangle, color: colors.destructive},
  recovery_risk_moderate: {icon: AlertTriangle, color: colors.secondary},
};

const DEFAULT_ICON = {icon: Bell, color: colors.primary};

function getNotificationIcon(type?: string): {icon: React.ElementType; color: string} {
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
    .map(([title, data]) => ({title, data}));
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
  const {icon: IconComponent, color: iconColor} = getNotificationIcon(
    notification.type || notification.notification_type,
  );

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(notification._id)}
      className={`mx-5 mb-2 rounded-2xl border border-border p-4 flex-row items-start gap-3 ${
        isUnread ? 'bg-card' : 'bg-card/60'
      }`}>
      {/* Icon */}
      <View
        className="w-10 h-10 rounded-full items-center justify-center mt-0.5"
        style={{backgroundColor: `${iconColor}1A`}}>
        <IconComponent size={18} color={iconColor} />
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text
            className={`text-sm flex-1 ${
              isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'
            }`}
            numberOfLines={2}>
            {notification.title}
          </Text>

          {/* Unread indicator */}
          {isUnread && (
            <View className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
          )}
        </View>

        {notification.body ? (
          <Text
            className="text-xs text-muted-foreground mt-1 leading-relaxed"
            numberOfLines={2}>
            {notification.body}
          </Text>
        ) : null}

        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-[10px] text-muted-foreground">
            {timeAgo(notification.created_at || notification.createdAt || new Date())}
          </Text>

          <TouchableOpacity
            onPress={() => onRemove(notification._id)}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            activeOpacity={0.6}>
            <Trash2 size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ---- Section Header ----
function SectionHeader({title}: {title: string}) {
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
  const [refreshing, setRefreshing] = useState(false);

  const {
    notifications,
    isLoading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllRead,
    removeNotification,
  } = useNotificationsStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const sections = useMemo(
    () => groupByDate(notifications),
    [notifications],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handlePress = useCallback(
    (id: string) => {
      const notif = notifications.find((n: any) => n._id === id);
      if (notif && !notif.is_read) {
        markAsRead(id);
      }
    },
    [notifications, markAsRead],
  );

  const handleRemove = useCallback(
    (id: string) => {
      removeNotification(id);
    },
    [removeNotification],
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header
        title="Notifications"
        onBack={() => navigation.goBack()}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity
              onPress={markAllRead}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              activeOpacity={0.7}>
              <Text className="text-xs font-semibold text-primary">Read All</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <SectionList
        sections={sections}
        keyExtractor={(item: any) => item._id || item.id || String(Math.random())}
        renderItem={({item}) => (
          <NotificationItem
            notification={item}
            onPress={handlePress}
            onRemove={handleRemove}
          />
        )}
        renderSectionHeader={({section}) => (
          <SectionHeader title={section.title} />
        )}
        contentContainerStyle={
          notifications.length === 0 ? {flex: 1} : {paddingBottom: 40}
        }
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
            refreshing={refreshing}
            onRefresh={onRefresh}
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
