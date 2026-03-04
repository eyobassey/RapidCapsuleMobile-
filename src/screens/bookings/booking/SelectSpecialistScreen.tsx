import React, {useEffect} from 'react';
import {View, Text, FlatList} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {Users} from 'lucide-react-native';
import {Header, EmptyState, Skeleton} from '../../../components/ui';
import SpecialistCard from '../../../components/appointments/SpecialistCard';
import {useAppointmentsStore} from '../../../store/appointments';
import {colors} from '../../../theme/colors';
import type {BookingsStackParamList} from '../../../navigation/stacks/BookingsStack';

type Nav = NativeStackNavigationProp<BookingsStackParamList>;
type Route = RouteProp<BookingsStackParamList, 'SelectSpecialist'>;

function ListSkeleton() {
  return (
    <View className="p-4 gap-3">
      {[1, 2, 3].map(i => (
        <View key={i} className="bg-card border border-border rounded-2xl p-4 gap-3">
          <View className="flex-row items-start gap-3">
            <Skeleton width={56} height={56} borderRadius={28} />
            <View className="flex-1 gap-2">
              <Skeleton width="60%" height={16} />
              <Skeleton width="40%" height={12} />
              <Skeleton width="50%" height={12} />
            </View>
          </View>
          <Skeleton height={48} borderRadius={16} />
        </View>
      ))}
    </View>
  );
}

export default function SelectSpecialistScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {categoryId} = route.params;

  const {specialists, isLoading, fetchSpecialists, setBookingData} =
    useAppointmentsStore();

  useEffect(() => {
    fetchSpecialists({categoryId});
  }, [categoryId]);

  const handleSelect = (specialist: any) => {
    setBookingData({specialist});
    navigation.navigate('SelectSchedule', {
      specialistId: specialist._id || specialist.id,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Select Specialist" onBack={() => navigation.goBack()} />

      {/* Step indicator */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center gap-2">
          <View className="flex-row gap-1.5">
            {[1, 2, 3, 4].map(step => (
              <View
                key={step}
                className="h-1.5 rounded-full"
                style={{
                  width: step <= 2 ? 32 : 16,
                  backgroundColor: step <= 2 ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>
          <Text className="text-muted-foreground text-xs ml-2">Step 2 of 4</Text>
        </View>
      </View>

      <Text className="px-4 pt-2 pb-4 text-foreground text-base font-bold">
        Choose your specialist
      </Text>

      {isLoading && specialists.length === 0 ? (
        <ListSkeleton />
      ) : (
        <FlatList
          data={specialists}
          keyExtractor={item => item._id || item.id || String(Math.random())}
          renderItem={({item}) => (
            <SpecialistCard
              specialist={item}
              onSelect={() => handleSelect(item)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 40,
            flexGrow: specialists.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={
            <EmptyState
              icon={<Users size={32} color={colors.mutedForeground} />}
              title="No specialists available"
              subtitle="There are no specialists available in this category right now. Please try again later."
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
