import React, {useCallback, useEffect, useState} from 'react';
import {View, FlatList, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Pill} from 'lucide-react-native';

import {usePrescriptionsStore} from '../../store/prescriptions';
import {Header, TabBar, EmptyState, Skeleton} from '../../components/ui';
import PrescriptionCard from '../../components/prescriptions/PrescriptionCard';
import {colors} from '../../theme/colors';

const FILTER_TABS = [
  {label: 'All', value: ''},
  {label: 'Pending', value: 'pending_acceptance'},
  {label: 'Active', value: 'accepted'},
  {label: 'Completed', value: 'delivered'},
  {label: 'Declined', value: 'cancelled'},
];

export default function PrescriptionsListScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  const {
    prescriptions,
    isLoading,
    filter,
    setFilter,
    fetchPrescriptions,
  } = usePrescriptionsStore();

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  // Re-fetch when filter changes
  useEffect(() => {
    fetchPrescriptions();
  }, [filter, fetchPrescriptions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPrescriptions();
    setRefreshing(false);
  }, [fetchPrescriptions]);

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  if (isLoading && prescriptions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Prescriptions" onBack={() => navigation.goBack()} />
        <View className="px-5 pt-4">
          <View className="mb-4">
            <Skeleton height={44} borderRadius={12} />
          </View>
          {[1, 2, 3, 4].map(i => (
            <View key={i} className="bg-card border border-border rounded-2xl p-4 mb-3">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Skeleton width={32} height={32} borderRadius={16} />
                  <Skeleton width={100} height={16} />
                </View>
                <Skeleton width={70} height={22} borderRadius={11} />
              </View>
              <Skeleton width={150} height={12} className="mb-2" />
              <Skeleton width={120} height={12} className="mb-3" />
              <View className="flex-row justify-between pt-3 border-t border-border">
                <Skeleton width={100} height={12} />
                <Skeleton width={80} height={14} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Prescriptions" onBack={() => navigation.goBack()} />

      <View className="px-5 pt-4 pb-2">
        <TabBar
          tabs={FILTER_TABS}
          activeTab={filter}
          onChange={handleFilterChange}
        />
      </View>

      <FlatList
        data={prescriptions}
        keyExtractor={(item: any) => item._id}
        contentContainerClassName="px-5 pt-2 pb-8"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({item}) => (
          <PrescriptionCard
            prescription={item}
            onPress={() =>
              navigation.navigate('PrescriptionDetail', {id: item._id})
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={<Pill size={32} color={colors.mutedForeground} />}
            title="No prescriptions"
            subtitle={
              filter
                ? 'No prescriptions match this filter.'
                : 'You have no prescriptions yet. They will appear here when prescribed by a specialist.'
            }
          />
        }
      />
    </SafeAreaView>
  );
}
