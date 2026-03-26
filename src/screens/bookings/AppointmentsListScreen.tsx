import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import {
  AlertTriangle,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  Clock,
  Plus,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import { Header, Skeleton, TabBar, Text } from '../../components/ui';
import { useAppointmentsQuery } from '../../hooks/queries';
import { useRefreshOnFocus } from '../../hooks/useRefresh';
import { meetingService } from '../../services/meeting.service';
import type { BookingsStackParamList } from '../../navigation/stacks/BookingsStack';
import { colors } from '../../theme/colors';

type Nav = NativeStackNavigationProp<BookingsStackParamList>;

const TABS = [
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
  { label: 'Missed', value: 'missed' },
  { label: 'Cancelled', value: 'cancelled' },
];

function ListSkeleton() {
  return (
    <View className="p-4 gap-3">
      {[1, 2, 3].map((i) => (
        <View key={i} className="bg-card border border-border rounded-2xl p-4 gap-3">
          <View className="flex-row items-center gap-3">
            <Skeleton width={40} height={40} borderRadius={20} />
            <View className="flex-1 gap-2">
              <Skeleton width="60%" height={14} />
              <Skeleton width="40%" height={12} />
            </View>
          </View>
          <Skeleton height={12} />
          <Skeleton width="70%" height={12} />
        </View>
      ))}
    </View>
  );
}

type EmptyConfig = {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  color: string;
  title: string;
  subtitle: string;
  showAction: boolean;
};

const EMPTY_CONFIG: Record<string, EmptyConfig> = {
  upcoming: {
    icon: CalendarCheck,
    color: colors.primary,
    title: 'No upcoming appointments',
    subtitle: "Your schedule is clear. Book a session with a specialist whenever you're ready.",
    showAction: true,
  },
  past: {
    icon: Clock,
    color: colors.success,
    title: 'No completed appointments',
    subtitle: 'Appointments you complete will show up here for your reference.',
    showAction: false,
  },
  missed: {
    icon: AlertTriangle,
    color: colors.secondary,
    title: 'No missed appointments',
    subtitle: "You're all caught up — no missed sessions on record.",
    showAction: false,
  },
  cancelled: {
    icon: CalendarX,
    color: colors.destructive,
    title: 'No cancelled appointments',
    subtitle: 'Any appointments you cancel will be recorded here.',
    showAction: false,
  },
};

function AppointmentsEmptyState({ filter, onBook }: { filter: string; onBook: () => void }) {
  const config = EMPTY_CONFIG[filter] ?? EMPTY_CONFIG.upcoming!;
  const Icon = config.icon;

  return (
    <View style={emptyStyles.container}>
      {/* Icon with double-ring treatment */}
      <View style={[emptyStyles.iconRing, { borderColor: `${config.color}20` }]}>
        <View style={[emptyStyles.iconCircle, { backgroundColor: `${config.color}18` }]}>
          <Icon size={32} color={config.color} strokeWidth={1.75} />
        </View>
      </View>

      <Text style={emptyStyles.title}>{config.title}</Text>
      <Text style={emptyStyles.subtitle}>{config.subtitle}</Text>

      {config.showAction && (
        <TouchableOpacity
          onPress={onBook}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Book a new appointment"
          style={[emptyStyles.cta, { backgroundColor: config.color }]}
        >
          <CalendarPlus size={16} color="#fff" strokeWidth={2} />
          <Text style={emptyStyles.ctaLabel}>Book Appointment</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 32,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  ctaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

type StatTileProps = {
  label: string;
  count: number;
  highlight?: boolean;
  active?: boolean;
  loading?: boolean;
  onPress?: () => void;
};

function StatTile({
  label,
  count,
  highlight = false,
  active = false,
  loading = false,
  onPress,
}: StatTileProps) {
  const displayCount = count > 99 ? '99+' : String(count);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${label}: ${displayCount}`}
      style={[
        statStyles.tile,
        highlight && statStyles.tileHighlighted,
        active && statStyles.tileActive,
      ]}
    >
      {loading ? (
        <Skeleton width={32} height={22} borderRadius={4} />
      ) : (
        <Text
          style={[
            statStyles.count,
            highlight && statStyles.countHighlighted,
            active && statStyles.countActive,
          ]}
        >
          {displayCount}
        </Text>
      )}
      <Text style={[statStyles.label, active && statStyles.labelActive]}>{label}</Text>
      {/* Active tab indicator bar */}
      {active && <View style={statStyles.activeBar} />}
    </TouchableOpacity>
  );
}

const statStyles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  tileHighlighted: {
    backgroundColor: `${colors.secondary}10`,
    borderColor: `${colors.secondary}35`,
  },
  tileActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  count: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
  },
  countHighlighted: {
    color: colors.secondary,
  },
  countActive: {
    color: colors.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  labelActive: {
    color: colors.primary,
  },
  activeBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});

export default function AppointmentsListScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'missed' | 'cancelled'>('upcoming');

  const {
    data: appointments = [],
    isLoading,
    refetch,
    isRefetching,
  } = useAppointmentsQuery(filter);

  // Stats counts — React Query deduplicates the active-tab fetch via cache key
  const { data: upcomingData = [], isLoading: loadingUpcoming } = useAppointmentsQuery('upcoming');
  const { data: pastData = [], isLoading: loadingPast } = useAppointmentsQuery('past');
  const { data: missedData = [], isLoading: loadingMissed } = useAppointmentsQuery('missed');
  const { data: cancelledData = [], isLoading: loadingCancelled } =
    useAppointmentsQuery('cancelled');

  const statsLoading = loadingUpcoming || loadingPast || loadingMissed || loadingCancelled;
  const totalCount =
    upcomingData.length + pastData.length + missedData.length + cancelledData.length;

  const handleTabChange = useCallback((value: string) => {
    setFilter(value as 'upcoming' | 'past' | 'missed' | 'cancelled');
  }, []);

  useRefreshOnFocus(refetch);

  const navigateToBook = useCallback(() => {
    navigation.navigate('SelectSpecialty');
  }, [navigation]);

  const handleJoin = useCallback((appointment: any) => {
    void meetingService.join({
      channel: appointment.meeting_channel || 'zoom',
      joinUrl: meetingService.resolveJoinUrl(appointment),
      meetingId: appointment.meeting_id || appointment.zoom_meeting_id,
      password: appointment.meeting_password || appointment.zoom_meeting_password,
      address: appointment.address || appointment.location,
    });
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header
        title="Appointments"
        rightAction={
          <TouchableOpacity
            onPress={navigateToBook}
            accessibilityRole="button"
            accessibilityLabel="Book new appointment"
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={24} color={colors.foreground} />
          </TouchableOpacity>
        }
      />

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 16 }}>
        <StatTile label="Total" count={totalCount} loading={statsLoading} />
        <StatTile
          label="Upcoming"
          count={upcomingData.length}
          active={filter === 'upcoming'}
          loading={statsLoading}
          onPress={() => handleTabChange('upcoming')}
        />
        <StatTile
          label="Completed"
          count={pastData.length}
          active={filter === 'past'}
          loading={statsLoading}
          onPress={() => handleTabChange('past')}
        />
        <StatTile
          label="Missed"
          count={missedData.length}
          highlight={missedData.length > 0}
          active={filter === 'missed'}
          loading={statsLoading}
          onPress={() => handleTabChange('missed')}
        />
      </View>

      <View className="px-4 pb-3">
        <TabBar tabs={TABS} activeTab={filter} onChange={handleTabChange} />
      </View>

      {isLoading && appointments.length === 0 ? (
        <ListSkeleton />
      ) : (
        <FlashList
          data={appointments}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              onPress={() => navigation.navigate('AppointmentDetail', { id: item._id || item.id })}
              onJoin={() => handleJoin(item)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 100,
          }}
          estimatedItemSize={120}
          ListEmptyComponent={<AppointmentsEmptyState filter={filter} onBook={navigateToBook} />}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={navigateToBook}
        accessibilityRole="button"
        accessibilityLabel="Book new appointment"
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 72,
          right: insets.right + 16,
          backgroundColor: colors.primary,
          borderRadius: 999,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <CalendarPlus size={20} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
