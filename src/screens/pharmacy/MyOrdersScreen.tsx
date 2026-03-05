import React, {useCallback, useEffect, useState} from 'react';
import {View, FlatList, RefreshControl, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {ClipboardList} from 'lucide-react-native';

import {usePharmacyStore} from '../../store/pharmacy';
import OrderCard from '../../components/pharmacy/OrderCard';
import {Header, TabBar, EmptyState} from '../../components/ui';
import {colors} from '../../theme/colors';
import type {PharmacyOrder} from '../../types/pharmacy.types';

const TABS = [
  {label: 'All', value: 'all'},
  {label: 'Active', value: 'active'},
  {label: 'Completed', value: 'completed'},
  {label: 'Cancelled', value: 'cancelled'},
];
const ACTIVE_STATUSES = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'];
const COMPLETED_STATUSES = ['DELIVERED', 'PICKED_UP'];
const CANCELLED_STATUSES = ['CANCELLED', 'REFUNDED'];

export default function MyOrdersScreen() {
  const navigation = useNavigation<any>();
  const {myOrders, ordersLoading, fetchMyOrders} = usePharmacyStore();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  const onRefresh = useCallback(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  const handleOrderPress = (order: PharmacyOrder) => {
    navigation.navigate('OrderDetail', {orderId: order._id});
  };

  // Client-side filter by tab
  const filteredOrders = myOrders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ACTIVE_STATUSES.includes(order.status);
    if (activeTab === 'completed') return COMPLETED_STATUSES.includes(order.status);
    if (activeTab === 'cancelled') return CANCELLED_STATUSES.includes(order.status);
    return true;
  });

  const emptyMessages: Record<string, string> = {
    all: 'No orders yet',
    active: 'No active orders',
    completed: 'No completed orders',
    cancelled: 'No cancelled orders',
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="My Orders" onBack={() => navigation.goBack()} />

      <View className="px-5 py-2">
        <TabBar
          tabs={TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={item => item._id}
        renderItem={({item}) => (
          <OrderCard order={item} onPress={handleOrderPress} />
        )}
        contentContainerStyle={{paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100}}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          ordersLoading ? (
            <ActivityIndicator color={colors.primary} style={{marginTop: 40}} />
          ) : (
            <EmptyState
              icon={<ClipboardList size={32} color={colors.mutedForeground} />}
              title={emptyMessages[activeTab] || 'No orders'}
              subtitle="Your pharmacy orders will appear here"
            />
          )
        }
      />
    </SafeAreaView>
  );
}
