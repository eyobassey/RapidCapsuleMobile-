import { useNavigation } from '@react-navigation/native';
import {
  Apple,
  Bell,
  Brain,
  BrainCircuit,
  Calendar,
  CalendarDays,
  ChevronRight,
  Droplets,
  Dumbbell,
  HeartPulse,
  MapPin,
  MessageCircle,
  Moon,
  Phone,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Video,
  Wallet,
} from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../../store/auth';
import { useCreditsStore } from '../../store/credits';
import { useMessagingStore } from '../../store/messaging';

import {
  useAppointmentsQuery,
  useGenerateDigestMutation,
  useGenerateTipsMutation,
  useHealthScoreQuery,
  useHealthTipsFeaturedQuery,
  usePrescriptionsQuery,
  useTodaysDigestQuery,
  useUnreadCountQuery,
  useWalletBalanceQuery,
} from '../../hooks/queries';

import RecoveryHomeCard from '../../components/recovery/RecoveryHomeCard';
import { HealthGauge, Skeleton } from '../../components/ui';
import { Text } from '../../components/ui/Text';
import { useCurrency } from '../../hooks/useCurrency';
import { colors } from '../../theme/colors';
import { MEETING_CHANNEL_LABELS } from '../../utils/constants';
import { formatRelativeDate, formatTime, getGreeting } from '../../utils/formatters';

// Category → icon component for health tips
const TIP_CATEGORY_ICONS: Record<string, React.ElementType> = {
  nutrition: Apple,
  exercise: Dumbbell,
  sleep: Moon,
  mental_health: Brain,
  preventive: ShieldCheck,
  hydration: Droplets,
  medication: Pill,
};

const TIP_PRIORITY_COLORS: Record<string, string> = {
  urgent: '#f43f5e',
  high: '#f59e0b',
  medium: '#0ea5e9',
  low: '#10b981',
};

// Score thresholds → ring color
function getScoreColor(score: number): string {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.primary;
  if (score >= 40) return colors.secondary;
  return colors.destructive;
}

// Meeting channel → icon component
function MeetingChannelIcon({ channel }: { channel?: string }) {
  switch (channel) {
    case 'zoom':
    case 'google_meet':
    case 'microsoft_teams':
      return <Video size={14} color={colors.primary} />;
    case 'phone':
    case 'whatsapp':
      return <Phone size={14} color={colors.primary} />;
    case 'in_person':
      return <MapPin size={14} color={colors.primary} />;
    default:
      return <Video size={14} color={colors.primary} />;
  }
}

export default function HomeScreen() {
  const { format } = useCurrency();
  const navigation = useNavigation<any>();

  // ---------- auth (client state) ----------
  const user = useAuthStore((s) => s.user);

  // ---------- React Query hooks ----------
  const {
    data: healthScoreData,
    isLoading: scoreLoading,
    refetch: refetchScore,
  } = useHealthScoreQuery();

  const {
    data: appointments = [],
    isLoading: aptsLoading,
    refetch: refetchAppointments,
  } = useAppointmentsQuery('upcoming');

  const { data: walletData, refetch: refetchBalance } = useWalletBalanceQuery();

  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useUnreadCountQuery();

  const {
    data: prescriptions = [],
    isLoading: rxLoading,
    refetch: refetchPrescriptions,
  } = usePrescriptionsQuery();

  const {
    data: featuredTips = [],
    isLoading: tipsLoading,
    refetch: refetchTips,
  } = useHealthTipsFeaturedQuery();

  const generateTipsMutation = useGenerateTipsMutation();

  const {
    data: todaysDigest,
    isLoading: digestLoading,
    refetch: refetchDigest,
  } = useTodaysDigestQuery();

  const generateDigestMutation = useGenerateDigestMutation();

  // ---------- credits store (kept — has plans/purchase logic) ----------
  const {
    totalAvailable,
    hasUnlimited,
    isLoading: creditsLoading,
    fetchCredits,
  } = useCreditsStore();

  // ---------- messaging store (client state) ----------
  const msgUnread = useMessagingStore((s) => s.unreadTotal);
  const checkConsent = useMessagingStore((s) => s.checkConsent);
  const fetchConversations = useMessagingStore((s) => s.fetchConversations);
  const computeUnreadTotal = useMessagingStore((s) => s.computeUnreadTotal);

  // ---------- derived ----------
  const score = healthScoreData?.score ?? null;
  const healthStatus = healthScoreData?.status ?? null;
  const balance = walletData?.currentBalance ?? walletData?.balance ?? 0;

  const firstName = user?.profile?.first_name || 'User';
  const greeting = getGreeting();

  const upcomingAppointments = useMemo(
    () =>
      (appointments || []).filter(
        (a: any) => a.status === 'OPEN' || a.status === 'ONGOING' || a.status === 'RESCHEDULED'
      ),
    [appointments]
  );

  const nextAppointment = upcomingAppointments[0] ?? null;

  const activeRxCount = useMemo(() => {
    const activeStatuses = new Set([
      'active',
      'paid',
      'dispensed',
      'shipped',
      'processing',
      'draft',
      'pending',
      'confirmed',
      'pending_payment',
      'pending_acceptance',
    ]);
    return (prescriptions || []).filter((rx: any) =>
      activeStatuses.has((rx.status || '').toLowerCase())
    ).length;
  }, [prescriptions]);

  // ---------- data fetching ----------
  const handleMessages = useCallback(async () => {
    const hasConsent = await checkConsent();
    if (hasConsent) {
      navigation.navigate('ConversationsList');
    } else {
      navigation.navigate('MessagingConsent');
    }
  }, [checkConsent, navigation]);

  // Pull-to-refresh: refetch all queries + non-query data
  const onRefresh = useCallback(async () => {
    await Promise.allSettled([
      refetchScore(),
      refetchAppointments(),
      refetchBalance(),
      refetchUnreadCount(),
      refetchPrescriptions(),
      refetchTips(),
      refetchDigest(),
      fetchCredits(),
      fetchConversations(1).then(() => computeUnreadTotal(user?._id || '')),
    ]);
  }, [
    refetchScore,
    refetchAppointments,
    refetchBalance,
    refetchUnreadCount,
    refetchPrescriptions,
    refetchTips,
    refetchDigest,
    fetchCredits,
    fetchConversations,
    computeUnreadTotal,
    user?._id,
  ]);

  // Fetch non-query data on mount
  React.useEffect(() => {
    fetchCredits();
    fetchConversations(1).then(() => computeUnreadTotal(user?._id || ''));
  }, [fetchCredits, fetchConversations, computeUnreadTotal, user?._id]);

  // ---------- quick actions config ----------
  const quickActions = [
    {
      icon: <Stethoscope size={24} color="#0ea5e9" />,
      title: 'Health Checkup',
      subtitle: 'AI diagnosis',
      accentColor: '#0ea5e9',
      onPress: () => navigation.navigate('HealthCheckupStart'),
    },
    {
      icon: <Calendar size={24} color="#818cf8" />,
      title: 'Book Appt',
      subtitle: 'See a specialist',
      accentColor: '#818cf8',
      onPress: () => navigation.getParent()?.navigate('Bookings'),
    },
    {
      icon: <Pill size={24} color="#10b981" />,
      title: 'Pharmacy',
      subtitle: 'Order medicines',
      accentColor: '#10b981',
      onPress: () => navigation.getParent()?.navigate('Pharmacy'),
    },
    {
      icon: <HeartPulse size={24} color="#f43f5e" />,
      title: 'Vitals',
      subtitle: 'Track health',
      accentColor: '#f43f5e',
      onPress: () => navigation.navigate('Vitals'),
    },
  ];

  // ---------- render ----------
  return (
    <SafeAreaView testID="home-screen" className="flex-1 bg-background" edges={['top']}>
      {/* ---- Header ---- */}
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">
            {greeting}, {firstName}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">How are you feeling today?</Text>
        </View>

        <View className="flex-row items-center gap-3">
          {/* Messages */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleMessages}
            accessibilityRole="button"
            accessibilityLabel={`Messages${msgUnread > 0 ? `, ${msgUnread} unread` : ''}`}
            accessibilityHint="Double tap to open messages"
            testID="home-messages"
            className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center"
          >
            <MessageCircle size={20} color={colors.foreground} />
            {msgUnread > 0 && (
              <View className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary items-center justify-center px-1">
                <Text className="text-[10px] font-bold text-white">
                  {msgUnread > 99 ? '99+' : msgUnread}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Notification bell */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityRole="button"
            accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            accessibilityHint="Double tap to view notifications"
            className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center"
          >
            <Bell size={20} color={colors.foreground} />
            {unreadCount > 0 && (
              <View className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive items-center justify-center px-1">
                <Text className="text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-28"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ---- Health Score Card ---- */}
        <View
          className="mx-5 mt-2 bg-card border border-border rounded-3xl p-5 overflow-hidden relative"
          accessibilityLabel={
            score != null
              ? `Health score ${score}, ${healthStatus || ''}`
              : 'Health score not available'
          }
        >
          {/* Subtle decorative orb */}
          <View className="absolute -top-10 -right-10 w-40 h-40 bg-success/5 rounded-full" />

          {scoreLoading ? (
            <View className="flex-row items-center gap-4 py-2">
              <Skeleton width={120} height={90} borderRadius={12} />
              <View className="flex-1 gap-2">
                <Skeleton width={80} height={14} />
                <Skeleton width={140} height={10} />
              </View>
            </View>
          ) : score != null ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('HealthInsights')}
              accessibilityRole="button"
              accessibilityLabel={`Health score ${score}, tap to view insights`}
              className="flex-row items-center gap-4"
            >
              <HealthGauge score={score} size={130} />
              <View className="flex-1 gap-1.5">
                <View className="flex-row items-center gap-2">
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getScoreColor(score) }}
                  />
                  <Text className="text-sm font-bold" style={{ color: getScoreColor(score) }}>
                    {healthStatus || 'Score'}
                  </Text>
                </View>
                <Text className="text-sm font-semibold text-foreground">
                  Your health score is {score}
                </Text>
                <Text className="text-[11px] text-muted-foreground leading-relaxed">
                  It is based on your vitals, checkups and activity data.
                </Text>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Vitals')}
              className="items-center py-4"
            >
              <View className="w-20 h-20 rounded-full bg-muted items-center justify-center mb-3">
                <HeartPulse size={32} color={colors.mutedForeground} />
              </View>
              <Text className="text-sm font-semibold text-foreground">No health data yet</Text>
              <Text className="text-xs text-muted-foreground mt-1 text-center">
                Complete a checkup or log vitals to see your score
              </Text>
              <View className="mt-3 bg-primary/10 rounded-full px-4 py-1.5">
                <Text className="text-xs font-bold text-primary">Get Started</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ---- Dr. Eka Card ---- */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('DrEka')}
          accessibilityRole="button"
          accessibilityLabel="Dr. Eka's daily digest"
          accessibilityHint="Double tap to view full digest"
          className="mx-5 mt-4 bg-card border border-primary/20 rounded-2xl p-4 overflow-hidden relative"
        >
          {/* Decorative orb */}
          <View className="absolute -top-4 -right-4 w-20 h-20 bg-primary/8 rounded-full" />

          <View className="flex-row items-center gap-3 relative z-10">
            <View
              className="w-11 h-11 rounded-2xl items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-lg">🩺</Text>
            </View>

            <View className="flex-1">
              {digestLoading ? (
                <>
                  <Skeleton width={100} height={12} />
                  <View className="mt-1.5">
                    <Skeleton width={180} height={10} />
                  </View>
                </>
              ) : todaysDigest?.summary ? (
                <>
                  <Text className="text-xs font-bold text-foreground mb-0.5">Dr. Eka says...</Text>
                  <Text
                    className="text-[10px] text-muted-foreground leading-relaxed"
                    numberOfLines={2}
                  >
                    {todaysDigest.summary}
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-xs font-bold text-foreground mb-0.5">Dr. Eka</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={(e) => {
                      e.stopPropagation();
                      generateDigestMutation.mutate();
                    }}
                    disabled={generateDigestMutation.isPending}
                    className="flex-row items-center gap-1"
                  >
                    {generateDigestMutation.isPending ? (
                      <ActivityIndicator size={10} color={colors.primary} />
                    ) : null}
                    <Text className="text-[10px] font-semibold text-primary">
                      {generateDigestMutation.isPending
                        ? 'Generating...'
                        : "Generate today's digest"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {todaysDigest?.summary && (
              <View className="flex-row items-center gap-0.5">
                <Text className="text-[10px] font-semibold text-primary">View</Text>
                <ChevronRight size={14} color={colors.primary} />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* ---- Quick Stats Row ---- */}
        <View className="flex-row mx-5 mt-4 gap-3">
          {/* Upcoming Appointments */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate('Bookings')}
            accessibilityRole="button"
            accessibilityLabel={`${upcomingAppointments.length} upcoming appointments`}
            accessibilityHint="Double tap to view your appointments"
            style={[
              styles.statCard,
              { borderColor: 'rgba(129,140,248,0.18)', backgroundColor: 'rgba(129,140,248,0.06)' },
            ]}
          >
            <View style={styles.statCardTop}>
              <Text style={styles.statLabel}>Upcoming</Text>
              <CalendarDays size={14} color="#818cf8" strokeWidth={2} />
            </View>
            {aptsLoading ? (
              <ActivityIndicator size="small" color="#818cf8" />
            ) : (
              <Text style={[styles.statValue, { color: '#818cf8' }]}>
                {upcomingAppointments.length}
              </Text>
            )}
          </TouchableOpacity>

          {/* Active Prescriptions */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.getParent()?.navigate('Pharmacy')}
            accessibilityRole="button"
            accessibilityLabel={`${activeRxCount} active prescriptions`}
            accessibilityHint="Double tap to view your prescriptions"
            style={[
              styles.statCard,
              { borderColor: 'rgba(16,185,129,0.18)', backgroundColor: 'rgba(16,185,129,0.06)' },
            ]}
          >
            <View style={styles.statCardTop}>
              <Text style={styles.statLabel}>Active Rx</Text>
              <Pill size={14} color="#10b981" strokeWidth={2} />
            </View>
            {rxLoading ? (
              <ActivityIndicator size="small" color="#10b981" />
            ) : (
              <Text style={[styles.statValue, { color: '#10b981' }]}>{activeRxCount}</Text>
            )}
          </TouchableOpacity>

          {/* Wallet Balance */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              navigation
                .getParent()
                ?.navigate('Profile', { screen: 'Wallet', params: { initialTab: 'wallet' } })
            }
            accessibilityRole="button"
            accessibilityLabel={`Wallet balance ${format(balance)}`}
            accessibilityHint="Double tap to view your wallet"
            style={[
              styles.statCard,
              { borderColor: 'rgba(14,165,233,0.18)', backgroundColor: 'rgba(14,165,233,0.06)' },
            ]}
          >
            <View style={styles.statCardTop}>
              <Text style={styles.statLabel}>Wallet</Text>
              <Wallet size={14} color="#0ea5e9" strokeWidth={2} />
            </View>
            <Text style={[styles.statValue, { color: '#0ea5e9', fontSize: 16 }]} numberOfLines={1}>
              {format(balance)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---- AI Credits Card ---- */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            navigation
              .getParent()
              ?.navigate('Profile', { screen: 'Wallet', params: { initialTab: 'credits' } })
          }
          style={styles.creditsCard}
        >
          <View style={styles.creditsIcon}>
            <Sparkles size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.creditsTitle}>AI Health Credits</Text>
            <Text style={styles.creditsSubtitle}>Generate detailed health reports</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.creditsValue}>
              {creditsLoading ? '--' : hasUnlimited ? '\u221E' : totalAvailable}
            </Text>
            <Text style={styles.creditsUnit}>{hasUnlimited ? 'Unlimited' : 'credits'}</Text>
          </View>
          <ChevronRight size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* ---- Quick Actions Grid ---- */}
        <View className="mx-5 mt-6">
          <Text className="text-sm font-bold text-foreground mb-3 px-1">Quick Actions</Text>
          <View className="flex-row flex-wrap gap-3">
            {quickActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={action.onPress}
                accessibilityRole="button"
                accessibilityLabel={`${action.title}, ${action.subtitle}`}
                style={[
                  styles.actionCard,
                  {
                    width: '48%',
                    flexGrow: 1,
                    borderColor: `${action.accentColor}22`,
                    borderTopColor: `${action.accentColor}60`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.actionIcon,
                    {
                      backgroundColor: `${action.accentColor}12`,
                      borderWidth: 1,
                      borderColor: `${action.accentColor}28`,
                    },
                  ]}
                >
                  {action.icon}
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ---- Recovery Card ---- */}
        <RecoveryHomeCard />

        {/* ---- Eka AI Banner ---- */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.getParent()?.navigate('Eka')}
          accessibilityRole="button"
          accessibilityLabel="Ask Eka AI, your personal health assistant"
          accessibilityHint="Double tap to open AI health assistant"
          className="mx-5 mt-6 bg-card border border-primary/20 rounded-3xl p-5 overflow-hidden relative"
        >
          {/* Decorative orb */}
          <View className="absolute -top-6 -right-6 w-28 h-28 bg-primary/10 rounded-full" />
          <View className="absolute bottom-0 left-0 w-20 h-20 bg-primary/5 rounded-full" />

          <View className="flex-row items-center gap-4 relative z-10">
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <BrainCircuit size={28} color={colors.white} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-base text-foreground mb-0.5">Ask Eka AI</Text>
              <Text className="text-[11px] text-muted-foreground leading-relaxed">
                Your personal health assistant. Check symptoms, analyze prescriptions, and more.
              </Text>
            </View>
            <ChevronRight size={20} color={colors.mutedForeground} />
          </View>
        </TouchableOpacity>

        {/* ---- Next Appointment ---- */}
        {nextAppointment && (
          <View className="mx-5 mt-6">
            <Text className="text-sm font-bold text-foreground mb-3 px-1">Next Appointment</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Next appointment"
              accessibilityHint="Double tap to view appointment details"
              onPress={() =>
                navigation.getParent()?.navigate('Bookings', {
                  screen: 'AppointmentDetail',
                  params: { id: nextAppointment._id || nextAppointment.id },
                })
              }
              className="bg-card border border-border rounded-2xl p-4 overflow-hidden relative"
            >
              {/* Decorative accent strip */}
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  borderTopLeftRadius: 16,
                  borderBottomLeftRadius: 16,
                  backgroundColor: colors.accent,
                }}
              />

              <View className="flex-row gap-4 items-center">
                {/* Date block */}
                <View className="w-14 h-14 rounded-2xl bg-background border border-border items-center justify-center">
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      color: colors.accent,
                    }}
                  >
                    {new Date(
                      nextAppointment.start_time ||
                        nextAppointment.date ||
                        nextAppointment.appointment_date
                    ).toLocaleDateString('en-US', { month: 'short' })}
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      lineHeight: 20,
                      color: colors.accent,
                    }}
                  >
                    {new Date(
                      nextAppointment.start_time ||
                        nextAppointment.date ||
                        nextAppointment.appointment_date
                    ).getDate()}
                  </Text>
                </View>

                {/* Details */}
                <View className="flex-1">
                  <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
                    {nextAppointment.specialist?.profile?.first_name
                      ? `Dr. ${nextAppointment.specialist.profile.first_name} ${
                          nextAppointment.specialist.profile.last_name || ''
                        }`
                      : 'Specialist'}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                    {nextAppointment.specialist_category?.name ||
                      nextAppointment.category ||
                      'Consultation'}
                  </Text>

                  <View className="flex-row items-center gap-2 mt-1.5">
                    <Text style={{ fontSize: 12, fontWeight: '500', color: colors.accent }}>
                      {formatRelativeDate(
                        nextAppointment.start_time ||
                          nextAppointment.date ||
                          nextAppointment.appointment_date
                      )}
                      {nextAppointment.start_time || nextAppointment.time
                        ? `, ${formatTime(nextAppointment.start_time || nextAppointment.time)}`
                        : ''}
                    </Text>

                    {nextAppointment.meeting_channel && (
                      <View className="flex-row items-center gap-1 bg-primary/10 rounded-full px-2 py-0.5">
                        <MeetingChannelIcon channel={nextAppointment.meeting_channel} />
                        <Text className="text-[10px] font-medium text-primary">
                          {MEETING_CHANNEL_LABELS[nextAppointment.meeting_channel] ||
                            nextAppointment.meeting_channel}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <ChevronRight size={18} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ---- Health Insights ---- */}
        <View className="mx-5 mt-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color={colors.accent} />
              <Text className="text-sm font-bold text-foreground">Health Insights</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('HealthInsights')}
              accessibilityRole="button"
              accessibilityLabel="View all health insights"
            >
              <Text className="text-xs font-semibold text-primary">View All</Text>
            </TouchableOpacity>
          </View>

          {tipsLoading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  className="bg-card border border-border rounded-2xl p-3.5"
                  style={{ width: 220 }}
                >
                  <Skeleton width={100} height={10} />
                  <View className="mt-2">
                    <Skeleton width={180} height={12} />
                  </View>
                  <View className="mt-1.5">
                    <Skeleton width={160} height={10} />
                  </View>
                  <View className="mt-1">
                    <Skeleton width={120} height={10} />
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : featuredTips.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {featuredTips.map((tip: any) => {
                const IconComp = TIP_CATEGORY_ICONS[tip.category] || ShieldCheck;
                const priorityColor = TIP_PRIORITY_COLORS[tip.priority] || TIP_PRIORITY_COLORS.low;
                return (
                  <TouchableOpacity
                    key={tip._id}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('HealthInsights')}
                    className="bg-card border border-border rounded-2xl p-3.5"
                    style={{ width: 220 }}
                  >
                    <View className="flex-row items-center gap-2 mb-2">
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 9,
                          backgroundColor: `${priorityColor}15`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconComp size={14} color={priorityColor} />
                      </View>
                      <View className="flex-1" />
                      <View
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: priorityColor }}
                      />
                    </View>
                    <Text className="text-xs font-bold text-foreground" numberOfLines={1}>
                      {tip.title}
                    </Text>
                    <Text
                      className="text-[10px] text-muted-foreground mt-1 leading-relaxed"
                      numberOfLines={2}
                    >
                      {tip.content}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => generateTipsMutation.mutate()}
              disabled={generateTipsMutation.isPending}
              className="bg-card border border-border rounded-2xl p-4 flex-row items-center justify-center gap-2"
            >
              {generateTipsMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Sparkles size={16} color={colors.primary} />
              )}
              <Text className="text-xs font-semibold text-primary">
                {generateTipsMutation.isPending ? 'Generating...' : 'Generate Health Insights'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom spacer */}
        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── Quick Stats Row ────────────────────────────────────────────────────────
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.mutedForeground,
    letterSpacing: 0.1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  // ── AI Credits Card ────────────────────────────────────────────────────────
  creditsCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: `${colors.accent}25`,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  creditsIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: `${colors.accent}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    letterSpacing: -0.2,
  },
  creditsSubtitle: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  creditsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  creditsUnit: {
    fontSize: 10,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  // ── Quick Actions Grid ─────────────────────────────────────────────────────
  actionCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderTopWidth: 2,
    borderRadius: 20,
    padding: 16,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
