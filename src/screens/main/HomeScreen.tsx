import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  Bell,
  Stethoscope,
  Pill,
  Calendar,
  HeartPulse,
  BrainCircuit,
  CalendarDays,
  Wallet,
  ChevronRight,
  Video,
  Phone,
  MapPin,
} from 'lucide-react-native';

import {useAuthStore} from '../../store/auth';
import {useHealthScoreStore} from '../../store/healthScore';
import {useAppointmentsStore} from '../../store/appointments';
import {useWalletStore} from '../../store/wallet';
import {useNotificationsStore} from '../../store/notifications';

import {Avatar, ProgressRing, StatusBadge, Skeleton} from '../../components/ui';
import {colors} from '../../theme/colors';
import {
  getGreeting,
  formatCurrency,
  formatDate,
  formatTime,
  formatRelativeDate,
} from '../../utils/formatters';
import {MEETING_CHANNEL_LABELS} from '../../utils/constants';

// Score thresholds → ring color
function getScoreColor(score: number): string {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.primary;
  if (score >= 40) return colors.secondary;
  return colors.destructive;
}

// Meeting channel → icon component
function MeetingChannelIcon({channel}: {channel?: string}) {
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
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  // ---------- stores ----------
  const user = useAuthStore(s => s.user);
  const {score, status: healthStatus, isLoading: scoreLoading, fetchScore} = useHealthScoreStore();
  const {
    appointments,
    isLoading: aptsLoading,
    fetchAppointments,
    setFilter,
  } = useAppointmentsStore();
  const {balance, currency, fetchBalance} = useWalletStore();
  const {unreadCount, fetchUnreadCount} = useNotificationsStore();

  // ---------- derived ----------
  const firstName = user?.profile?.first_name || 'User';
  const lastName = user?.profile?.last_name || '';
  const profileImage = user?.profile?.profile_photo || user?.profile?.profile_image;
  const greeting = getGreeting();

  const upcomingAppointments = useMemo(
    () =>
      appointments.filter(
        (a: any) =>
          a.status === 'OPEN' || a.status === 'ONGOING' || a.status === 'RESCHEDULED',
      ),
    [appointments],
  );

  const nextAppointment = upcomingAppointments[0] ?? null;

  // ---------- data fetching ----------
  const loadData = useCallback(async () => {
    setFilter('upcoming');
    await Promise.allSettled([
      fetchScore(),
      fetchAppointments(),
      fetchBalance(),
      fetchUnreadCount(),
    ]);
  }, [fetchScore, fetchAppointments, fetchBalance, fetchUnreadCount, setFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // ---------- quick actions config ----------
  const quickActions = [
    {
      icon: <Stethoscope size={22} color="#0ea5e9" />,
      title: 'Health Checkup',
      subtitle: 'AI diagnosis',
      bg: 'bg-sky-500/10',
      accentColor: '#0ea5e9',
      onPress: () => navigation.navigate('Vitals'),
    },
    {
      icon: <Calendar size={22} color="#818cf8" />,
      title: 'Book Appt',
      subtitle: 'See a specialist',
      bg: 'bg-indigo-500/10',
      accentColor: '#818cf8',
      onPress: () => navigation.getParent()?.navigate('Bookings'),
    },
    {
      icon: <Pill size={22} color="#10b981" />,
      title: 'Pharmacy',
      subtitle: 'Order medicines',
      bg: 'bg-emerald-500/10',
      accentColor: '#10b981',
      onPress: () => navigation.getParent()?.navigate('Pharmacy'),
    },
    {
      icon: <HeartPulse size={22} color="#f43f5e" />,
      title: 'Log Vitals',
      subtitle: 'Track health',
      bg: 'bg-rose-500/10',
      accentColor: '#f43f5e',
      onPress: () => navigation.navigate('LogVitals'),
    },
  ];

  // ---------- render ----------
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* ---- Header ---- */}
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">
            {greeting}, {firstName}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            How are you feeling today?
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          {/* Notification bell */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Notifications')}
            className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center">
            <Bell size={20} color={colors.foreground} />
            {unreadCount > 0 && (
              <View className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive items-center justify-center px-1">
                <Text className="text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity activeOpacity={0.7}>
            <Avatar
              uri={profileImage}
              firstName={firstName}
              lastName={lastName}
              size="md"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-28"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        {/* ---- Health Score Card ---- */}
        <View className="mx-5 mt-2 bg-card border border-border rounded-3xl p-5 overflow-hidden relative">
          {/* Subtle decorative orb */}
          <View className="absolute -top-10 -right-10 w-40 h-40 bg-success/5 rounded-full" />

          {scoreLoading ? (
            <View className="items-center py-4 gap-3">
              <Skeleton width={120} height={120} borderRadius={60} />
              <Skeleton width={100} height={14} />
            </View>
          ) : score != null ? (
            <View className="items-center">
              <ProgressRing
                progress={score}
                size={130}
                strokeWidth={8}
                color={getScoreColor(score)}>
                <View className="items-center">
                  <Text className="text-3xl font-bold text-foreground leading-none">
                    {score}
                  </Text>
                  <Text
                    className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
                    style={{color: getScoreColor(score)}}>
                    {healthStatus || 'Score'}
                  </Text>
                </View>
              </ProgressRing>
              <Text className="text-xs text-muted-foreground mt-3 text-center max-w-[260px]">
                Your health score is based on vitals, checkups, and activity data.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Vitals')}
              className="items-center py-4">
              <View className="w-20 h-20 rounded-full bg-muted items-center justify-center mb-3">
                <HeartPulse size={32} color={colors.mutedForeground} />
              </View>
              <Text className="text-sm font-semibold text-foreground">
                No health data yet
              </Text>
              <Text className="text-xs text-muted-foreground mt-1 text-center">
                Complete a checkup or log vitals to see your score
              </Text>
              <View className="mt-3 bg-primary/10 rounded-full px-4 py-1.5">
                <Text className="text-xs font-bold text-primary">
                  Get Started
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ---- Quick Stats Row ---- */}
        <View className="flex-row mx-5 mt-4 gap-3">
          {/* Upcoming Appointments */}
          <View className="flex-1 bg-card border border-border rounded-2xl p-3 items-center">
            <View className="w-8 h-8 rounded-full bg-indigo-500/10 items-center justify-center mb-1.5">
              <CalendarDays size={16} color="#818cf8" />
            </View>
            <Text className="text-xl font-bold text-foreground">
              {aptsLoading ? '--' : upcomingAppointments.length}
            </Text>
            <Text className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Upcoming
            </Text>
          </View>

          {/* Active Prescriptions */}
          <View className="flex-1 bg-card border border-border rounded-2xl p-3 items-center">
            <View className="w-8 h-8 rounded-full bg-emerald-500/10 items-center justify-center mb-1.5">
              <Pill size={16} color="#10b981" />
            </View>
            <Text className="text-xl font-bold text-foreground">{'\u2013'}</Text>
            <Text className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Active Rx
            </Text>
          </View>

          {/* Wallet Balance */}
          <View className="flex-1 bg-card border border-border rounded-2xl p-3 items-center">
            <View className="w-8 h-8 rounded-full bg-sky-500/10 items-center justify-center mb-1.5">
              <Wallet size={16} color="#0ea5e9" />
            </View>
            <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
              {formatCurrency(balance, currency)}
            </Text>
            <Text className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Wallet
            </Text>
          </View>
        </View>

        {/* ---- Quick Actions Grid ---- */}
        <View className="mx-5 mt-6">
          <Text className="text-sm font-bold text-foreground mb-3 px-1">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {quickActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={action.onPress}
                className="bg-card border border-border rounded-2xl p-4"
                style={{width: '48%', flexGrow: 1}}>
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${action.bg} mb-2.5`}>
                  {action.icon}
                </View>
                <Text className="text-sm font-semibold text-foreground">
                  {action.title}
                </Text>
                <Text className="text-[10px] text-muted-foreground mt-0.5">
                  {action.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ---- Eka AI Banner ---- */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.getParent()?.navigate('Eka')}
          className="mx-5 mt-6 bg-card border border-primary/20 rounded-3xl p-5 overflow-hidden relative">
          {/* Decorative orb */}
          <View className="absolute -top-6 -right-6 w-28 h-28 bg-primary/10 rounded-full" />
          <View className="absolute bottom-0 left-0 w-20 h-20 bg-primary/5 rounded-full" />

          <View className="flex-row items-center gap-4 relative z-10">
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center"
              style={{backgroundColor: colors.primary}}>
              <BrainCircuit size={28} color={colors.white} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-base text-foreground mb-0.5">
                Ask Eka AI
              </Text>
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
            <Text className="text-sm font-bold text-foreground mb-3 px-1">
              Next Appointment
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              className="bg-card border border-border rounded-2xl p-4 overflow-hidden relative">
              {/* Decorative accent strip */}
              <View
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{backgroundColor: colors.accent}}
              />

              <View className="flex-row gap-4 items-center">
                {/* Date block */}
                <View className="w-14 h-14 rounded-2xl bg-background border border-border items-center justify-center">
                  <Text className="text-[10px] font-bold uppercase" style={{color: colors.accent}}>
                    {new Date(nextAppointment.start_time || nextAppointment.date || nextAppointment.appointment_date).toLocaleDateString('en-US', {month: 'short'})}
                  </Text>
                  <Text className="text-lg font-bold leading-none" style={{color: colors.accent}}>
                    {new Date(nextAppointment.start_time || nextAppointment.date || nextAppointment.appointment_date).getDate()}
                  </Text>
                </View>

                {/* Details */}
                <View className="flex-1">
                  <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>
                    {nextAppointment.specialist?.profile?.first_name
                      ? `Dr. ${nextAppointment.specialist.profile.first_name} ${nextAppointment.specialist.profile.last_name || ''}`
                      : 'Specialist'}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                    {nextAppointment.specialist_category?.name || nextAppointment.category || 'Consultation'}
                  </Text>

                  <View className="flex-row items-center gap-2 mt-1.5">
                    <Text className="text-xs font-medium" style={{color: colors.accent}}>
                      {formatRelativeDate(nextAppointment.start_time || nextAppointment.date || nextAppointment.appointment_date)}
                      {(nextAppointment.start_time || nextAppointment.time) ? `, ${formatTime(nextAppointment.start_time || nextAppointment.time)}` : ''}
                    </Text>

                    {nextAppointment.meeting_channel && (
                      <View className="flex-row items-center gap-1 bg-primary/10 rounded-full px-2 py-0.5">
                        <MeetingChannelIcon channel={nextAppointment.meeting_channel} />
                        <Text className="text-[10px] font-medium text-primary">
                          {MEETING_CHANNEL_LABELS[nextAppointment.meeting_channel] || nextAppointment.meeting_channel}
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

        {/* Bottom spacer */}
        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
