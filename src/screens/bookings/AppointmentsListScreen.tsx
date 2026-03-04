import React, {useCallback, useEffect} from 'react';
import {View, Text, FlatList, TouchableOpacity, Linking} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Plus, CalendarPlus, CalendarX, CalendarCheck, Clock} from 'lucide-react-native';
import {Header, TabBar, EmptyState, Skeleton} from '../../components/ui';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import {useAppointmentsStore} from '../../store/appointments';
import {colors} from '../../theme/colors';
import type {BookingsStackParamList} from '../../navigation/stacks/BookingsStack';

type Nav = NativeStackNavigationProp<BookingsStackParamList>;

const TABS = [
  {label: 'Upcoming', value: 'upcoming'},
  {label: 'Past', value: 'past'},
  {label: 'Cancelled', value: 'cancelled'},
];

function ListSkeleton() {
  return (
    <View className="p-4 gap-3">
      {[1, 2, 3].map(i => (
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

const emptyConfig: Record<string, {icon: React.ReactNode; title: string; subtitle: string}> = {
  upcoming: {
    icon: <CalendarCheck size={32} color={colors.mutedForeground} />,
    title: 'No upcoming appointments',
    subtitle: 'Book an appointment with a specialist to get started.',
  },
  past: {
    icon: <Clock size={32} color={colors.mutedForeground} />,
    title: 'No past appointments',
    subtitle: 'Your completed appointments will appear here.',
  },
  cancelled: {
    icon: <CalendarX size={32} color={colors.mutedForeground} />,
    title: 'No cancelled appointments',
    subtitle: 'Cancelled appointments will appear here.',
  },
};

export default function AppointmentsListScreen() {
  const navigation = useNavigation<Nav>();
  const {
    appointments,
    isLoading,
    filter,
    setFilter,
    fetchAppointments,
  } = useAppointmentsStore();

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const handleTabChange = useCallback((value: string) => {
    setFilter(value as 'upcoming' | 'past' | 'cancelled');
  }, [setFilter]);

  const handleRefresh = useCallback(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const navigateToBook = useCallback(() => {
    navigation.navigate('SelectSpecialty');
  }, [navigation]);

  const handleJoin = useCallback((appointment: any) => {
    const link = appointment.meeting_link || appointment.zoom_link;
    if (link) {
      Linking.openURL(link);
    }
  }, []);

  const empty = emptyConfig[filter] || emptyConfig.upcoming;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header
        title="Appointments"
        rightAction={
          <TouchableOpacity
            onPress={navigateToBook}
            activeOpacity={0.7}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Plus size={24} color={colors.foreground} />
          </TouchableOpacity>
        }
      />

      <View className="px-4 py-3">
        <TabBar tabs={TABS} activeTab={filter} onChange={handleTabChange} />
      </View>

      {isLoading && appointments.length === 0 ? (
        <ListSkeleton />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={item => item._id || item.id || String(Math.random())}
          renderItem={({item}) => (
            <AppointmentCard
              appointment={item}
              onPress={() => navigation.navigate('AppointmentDetail', {id: item._id || item.id})}
              onJoin={() => handleJoin(item)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 100,
            flexGrow: appointments.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={
            <EmptyState
              icon={empty.icon}
              title={empty.title}
              subtitle={empty.subtitle}
              actionLabel="Book Appointment"
              onAction={navigateToBook}
            />
          }
          refreshing={isLoading}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={navigateToBook}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          backgroundColor: colors.primary,
          borderRadius: 16,
          paddingHorizontal: 20,
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          shadowColor: colors.primary,
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}>
        <CalendarPlus size={20} color={colors.white} />
        <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 14}}>Book</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
