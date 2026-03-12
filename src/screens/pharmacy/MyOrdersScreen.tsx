import React, { useCallback, useMemo, useState } from 'react';
import { View, RefreshControl, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ClipboardList, TrendingUp, CheckCircle, Package } from 'lucide-react-native';

import { useMyOrdersQuery } from '../../hooks/queries';
import OrderCard from '../../components/pharmacy/OrderCard';
import { Header, TabBar, EmptyState, Text } from '../../components/ui';
import { colors } from '../../theme/colors';
import type { PharmacyOrder } from '../../types/pharmacy.types';

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];
const ACTIVE_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
];
const COMPLETED_STATUSES = ['DELIVERED', 'COMPLETED'];
const CANCELLED_STATUSES = ['CANCELLED', 'REFUNDED'];

export default function MyOrdersScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading: ordersLoading, isFetching, refetch } = useMyOrdersQuery();
  const myOrders = useMemo(() => data?.orders ?? [], [data?.orders]);
  const [activeTab, setActiveTab] = useState('all');

  const onRefresh = useCallback(() => refetch(), [refetch]);

  const handleOrderPress = (order: PharmacyOrder) => {
    navigation.navigate('OrderDetail', { orderId: order._id });
  };

  // Stats
  const stats = useMemo(() => {
    const total = myOrders.length;
    const active = myOrders.filter((o: PharmacyOrder) => ACTIVE_STATUSES.includes(o.status)).length;
    const completed = myOrders.filter((o: PharmacyOrder) =>
      COMPLETED_STATUSES.includes(o.status)
    ).length;
    return { total, active, completed };
  }, [myOrders]);

  // Client-side filter by tab
  const filteredOrders = useMemo(
    () =>
      myOrders.filter((order: PharmacyOrder) => {
        if (activeTab === 'all') return true;
        if (activeTab === 'active') return ACTIVE_STATUSES.includes(order.status);
        if (activeTab === 'completed') return COMPLETED_STATUSES.includes(order.status);
        if (activeTab === 'cancelled') return CANCELLED_STATUSES.includes(order.status);
        return true;
      }),
    [myOrders, activeTab]
  );

  const emptyMessages: Record<string, string> = {
    all: 'No orders yet',
    active: 'No active orders',
    completed: 'No completed orders',
    cancelled: 'No cancelled orders',
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="My Orders" onBack={() => navigation.goBack()} />

      {/* Stats Bar */}
      {myOrders.length > 0 && (
        <View className="flex-row px-5 pt-3 pb-1 gap-3">
          <View className="flex-1 bg-card border border-border rounded-xl p-3 items-center">
            <Package size={16} color={colors.primary} />
            <Text className="text-lg font-bold text-foreground mt-1">{stats.total}</Text>
            <Text className="text-[10px] text-muted-foreground">Total</Text>
          </View>
          <View className="flex-1 bg-card border border-border rounded-xl p-3 items-center">
            <TrendingUp size={16} color={colors.secondary} />
            <Text className="text-lg font-bold text-foreground mt-1">{stats.active}</Text>
            <Text className="text-[10px] text-muted-foreground">Active</Text>
          </View>
          <View className="flex-1 bg-card border border-border rounded-xl p-3 items-center">
            <CheckCircle size={16} color={colors.success} />
            <Text className="text-lg font-bold text-foreground mt-1">{stats.completed}</Text>
            <Text className="text-[10px] text-muted-foreground">Completed</Text>
          </View>
        </View>
      )}

      <View className="px-5 py-2">
        <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </View>

      <FlashList<PharmacyOrder>
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <OrderCard order={item} onPress={handleOrderPress} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={120}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} />}
        ListEmptyComponent={
          ordersLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
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
