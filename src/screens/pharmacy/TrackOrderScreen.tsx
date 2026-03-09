import React, {useCallback, useEffect, useRef, useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {
  CheckCircle,
  Settings,
  Truck,
  Store,
  Package,
  Phone,
  Clock,
  MapPin,
  User,
  ChevronRight,
} from 'lucide-react-native';

import {usePharmacyStore} from '../../store/pharmacy';
import {Header, StatusBadge, Button} from '../../components/ui';
import {colors} from '../../theme/colors';
import {formatDateTime} from '../../utils/formatters';
import {useCurrency} from '../../hooks/useCurrency';
import {ORDER_STATUS_LABELS} from '../../utils/constants';
import type {PharmacyStackParamList} from '../../navigation/stacks/PharmacyStack';

const TRACKABLE_STATUSES = [
  'CONFIRMED',
  'PROCESSING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
];

export default function TrackOrderScreen() {
  const {format} = useCurrency();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PharmacyStackParamList, 'TrackOrder'>>();
  const {orderNumber} = route.params;

  const {trackingOrder, ordersLoading, trackOrder} = usePharmacyStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial fetch
  useEffect(() => {
    trackOrder(orderNumber);
  }, [orderNumber, trackOrder]);

  // Auto-refresh every 30s for active orders
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      trackOrder(orderNumber);
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [orderNumber, trackOrder]);

  const onRefresh = useCallback(() => {
    trackOrder(orderNumber);
  }, [orderNumber, trackOrder]);

  const order = trackingOrder;

  // Delivery steps
  const deliverySteps = useMemo(() => {
    if (!order) return [];
    const status = order.status;
    const isPickup = order.delivery_method === 'PICKUP';

    const steps = [
      {
        icon: CheckCircle,
        title: 'Order Confirmed',
        description: 'Your order has been confirmed',
        completed: ['CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(status),
        current: status === 'CONFIRMED',
      },
      {
        icon: Settings,
        title: 'Preparing Order',
        description: 'The pharmacy is preparing your medications',
        completed: ['PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(status),
        current: status === 'PROCESSING',
      },
      {
        icon: isPickup ? Package : Truck,
        title: isPickup ? 'Ready for Pickup' : 'Out for Delivery',
        description: isPickup ? 'Your order is ready at the pharmacy' : 'Your order is on its way',
        completed: ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(status),
        current: status === 'READY_FOR_PICKUP' || status === 'OUT_FOR_DELIVERY',
      },
      {
        icon: CheckCircle,
        title: isPickup ? 'Completed' : 'Delivered',
        description: isPickup ? 'Order collected from pharmacy' : 'Order delivered to your address',
        completed: ['DELIVERED', 'COMPLETED'].includes(status),
        current: status === 'DELIVERED' || status === 'COMPLETED',
      },
    ];

    // Find timestamp from status_history for each step
    return steps.map(step => {
      let time: string | undefined;
      if (step.completed && order.status_history?.length) {
        // Find matching history entry
        const entry = order.status_history.find(h => {
          if (step.title === 'Order Confirmed') return h.status === 'CONFIRMED';
          if (step.title === 'Preparing Order') return h.status === 'PROCESSING';
          if (step.title === 'Ready for Pickup') return h.status === 'READY_FOR_PICKUP';
          if (step.title === 'Out for Delivery') return h.status === 'OUT_FOR_DELIVERY';
          if (step.title === 'Completed') return h.status === 'COMPLETED';
          if (step.title === 'Delivered') return h.status === 'DELIVERED';
          return false;
        });
        if (entry?.timestamp) time = formatDateTime(entry.timestamp);
      }
      return {...step, time};
    });
  }, [order]);

  // Format delivery address
  const deliveryAddress = useMemo(() => {
    if (!order) return '';
    const addr = order.delivery_address;
    if (!addr) return order.delivery_method === 'PICKUP' ? 'Pickup at pharmacy' : 'No address';
    if (typeof addr === 'string') return addr;
    const parts = [addr.recipient_name, addr.street, addr.city, addr.state].filter(Boolean);
    return parts.join(', ') || 'No address';
  }, [order]);

  const pharmacyName =
    order && typeof order.pharmacy === 'object' && order.pharmacy?.name
      ? order.pharmacy.name
      : 'Rapid Capsule Pharmacy';

  const pharmacyPhone =
    order && typeof order.pharmacy === 'object' && (order.pharmacy as any)?.phone
      ? (order.pharmacy as any).phone
      : null;

  const deliveryPerson = (order as any)?.delivery_person;

  const handleCallPharmacy = () => {
    if (pharmacyPhone) Linking.openURL(`tel:${pharmacyPhone}`);
  };

  const handleCallDriver = () => {
    if (deliveryPerson?.phone) Linking.openURL(`tel:${deliveryPerson.phone}`);
  };

  const handleViewDetails = () => {
    if (order) navigation.navigate('OrderDetail', {orderId: order._id});
  };

  // Loading state
  if (ordersLoading && !order) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Track Order" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Track Order" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center p-8">
          <Package size={48} color={colors.mutedForeground} />
          <Text className="text-base font-semibold text-foreground mt-4">Order not found</Text>
          <Text className="text-sm text-muted-foreground mt-1 text-center">
            We couldn't find order #{orderNumber}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Track Order" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-4 pb-32"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }>
        {/* Order Header */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base font-bold text-foreground">
                #{order.order_number}
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </Text>
            </View>
            <StatusBadge status={order.status} size="md" />
          </View>
          {order.estimated_delivery_date && (
            <View className="flex-row items-center mt-3 bg-primary/10 rounded-xl px-3 py-2">
              <Clock size={14} color={colors.primary} />
              <Text className="text-xs font-semibold text-primary ml-1.5">
                Est. delivery: {formatDateTime(order.estimated_delivery_date)}
              </Text>
            </View>
          )}
        </View>

        {/* Location Info */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          {/* From */}
          <View className="flex-row items-center">
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.primary,
              }}
            />
            <View className="ml-3">
              <Text className="text-[10px] text-muted-foreground uppercase">From</Text>
              <Text className="text-sm font-medium text-foreground">{pharmacyName}</Text>
            </View>
          </View>

          {/* Connecting line */}
          <View
            style={{
              width: 2,
              height: 20,
              backgroundColor: colors.border,
              marginLeft: 5,
            }}
          />

          {/* To */}
          <View className="flex-row items-center">
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.success,
              }}
            />
            <View className="ml-3">
              <Text className="text-[10px] text-muted-foreground uppercase">To</Text>
              <Text className="text-sm font-medium text-foreground">{deliveryAddress}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Status Timeline */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-4">
            Delivery Status
          </Text>
          {deliverySteps.map((step, idx) => {
            const isLast = idx === deliverySteps.length - 1;
            const IconComponent = step.icon;

            return (
              <View key={idx} className="flex-row">
                {/* Step indicator */}
                <View className="items-center mr-4">
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: step.completed
                        ? colors.success
                        : step.current
                        ? colors.primary
                        : colors.muted,
                    }}>
                    <IconComponent
                      size={18}
                      color={step.completed || step.current ? '#fff' : colors.mutedForeground}
                    />
                  </View>
                  {!isLast && (
                    <View
                      style={{
                        width: 2,
                        height: 32,
                        backgroundColor: step.completed ? colors.success : colors.border,
                      }}
                    />
                  )}
                </View>

                {/* Step content */}
                <View className="pb-5 pt-1 flex-1">
                  <Text
                    className={`text-sm font-semibold ${
                      step.current
                        ? 'text-primary'
                        : step.completed
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}>
                    {step.title}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </Text>
                  {step.time && (
                    <Text className="text-[10px] text-muted-foreground mt-1">
                      {step.time}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Delivery Person */}
        {order.status === 'OUT_FOR_DELIVERY' && deliveryPerson && (
          <View className="bg-card border border-border rounded-2xl p-4 mb-4">
            <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-3">
              Delivery Person
            </Text>
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-muted items-center justify-center overflow-hidden">
                {deliveryPerson.photo ? (
                  <Image
                    source={{uri: deliveryPerson.photo}}
                    style={{width: 48, height: 48}}
                    resizeMode="cover"
                  />
                ) : (
                  <User size={24} color={colors.mutedForeground} />
                )}
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-foreground">
                  {deliveryPerson.name}
                </Text>
                {deliveryPerson.vehicle && (
                  <Text className="text-xs text-muted-foreground">
                    {deliveryPerson.vehicle}
                  </Text>
                )}
              </View>
              {deliveryPerson.phone && (
                <TouchableOpacity
                  onPress={handleCallDriver}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Call delivery person ${deliveryPerson.name}`}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.success,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Phone size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-3">
            Order Summary
          </Text>
          <View className="flex-row justify-between py-2 border-b border-border">
            <Text className="text-sm text-muted-foreground">Items</Text>
            <Text className="text-sm font-medium text-foreground">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-border">
            <Text className="text-sm text-muted-foreground">Total Amount</Text>
            <Text className="text-sm font-bold text-primary">
              {format(order.total_amount)}
            </Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-sm text-muted-foreground">Payment</Text>
            <Text className="text-sm font-medium text-foreground">
              {order.payment_status === 'PAID' ? 'Paid' : order.payment_status || 'Pending'}
            </Text>
          </View>

          <Button
            variant="outline"
            onPress={handleViewDetails}
            className="mt-3">
            View Full Order Details
          </Button>
        </View>

        {/* Actions */}
        <View className="gap-3">
          {pharmacyPhone && (
            <Button variant="secondary" onPress={handleCallPharmacy}>
              Contact Pharmacy
            </Button>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
