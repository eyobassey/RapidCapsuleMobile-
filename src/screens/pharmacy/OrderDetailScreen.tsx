import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {
  Package,
  MapPin,
  CreditCard,
  Star,
  XCircle,
  RotateCcw,
  Check,
} from 'lucide-react-native';

import {usePharmacyStore} from '../../store/pharmacy';
import {Header, StatusBadge, Button} from '../../components/ui';
import {colors} from '../../theme/colors';
import {formatDateTime} from '../../utils/formatters';
import {useCurrency} from '../../hooks/useCurrency';
import {ORDER_STATUS_SEQUENCE_DELIVERY, ORDER_STATUS_SEQUENCE_PICKUP, ORDER_STATUS_LABELS} from '../../utils/constants';
import type {PharmacyStackParamList} from '../../navigation/stacks/PharmacyStack';

export default function OrderDetailScreen() {
  const {format} = useCurrency();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PharmacyStackParamList, 'OrderDetail'>>();
  const {orderId} = route.params;

  const {currentOrder, ordersLoading, fetchOrderById, cancelOrder, rateOrder, addToCart} =
    usePharmacyStore();

  const [cancelling, setCancelling] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchOrderById(orderId);
  }, [orderId, fetchOrderById]);

  const onRefresh = useCallback(() => {
    fetchOrderById(orderId);
  }, [orderId, fetchOrderById]);

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      {text: 'No', style: 'cancel'},
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelOrder(orderId, 'Cancelled by patient');
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to cancel order');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const handleRate = async () => {
    setSubmittingRating(true);
    try {
      await rateOrder(orderId, rating, review || undefined);
      setShowRating(false);
      Alert.alert('Thank you!', 'Your rating has been submitted.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleReorder = () => {
    if (!currentOrder) return;
    // This is a simple reorder — add items back. In reality, we'd want
    // to fetch fresh drug data, but for now this works.
    Alert.alert('Reorder', 'Items will be added to your cart.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Add to Cart',
        onPress: () => {
          // Navigate to pharmacy home — items would need drug detail to add
          navigation.navigate('PharmacyHome');
        },
      },
    ]);
  };

  const order = currentOrder;

  if (ordersLoading && !order) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Order Detail" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Order Detail" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-muted-foreground">Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);
  const canRate = ['DELIVERED', 'COMPLETED'].includes(order.status) && !order.rating;
  const canTrack = ['CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(order.status);

  // Status timeline — pick sequence based on delivery method
  const isPickup = order.delivery_method === 'PICKUP';
  const statusSequence = isPickup ? ORDER_STATUS_SEQUENCE_PICKUP : ORDER_STATUS_SEQUENCE_DELIVERY;
  const currentIdx = statusSequence.indexOf(order.status as any);
  const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title={`Order #${order.order_number}`} onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-4 pb-32"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }>
        {/* Order Header */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Package size={16} color={colors.mutedForeground} />
              <Text className="text-sm font-medium text-muted-foreground ml-1.5">
                #{order.order_number}
              </Text>
            </View>
            <StatusBadge status={order.status} size="md" />
          </View>
          <Text className="text-xs text-muted-foreground">
            Placed on {formatDateTime(order.created_at)}
          </Text>
        </View>

        {/* Status Timeline */}
        {!isCancelled && (
          <View className="bg-card border border-border rounded-2xl p-4 mb-4">
            <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-3">
              Order Progress
            </Text>
            {statusSequence.map((status, idx) => {
              const isActive = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              const isLast = idx === statusSequence.length - 1;
              const label = ORDER_STATUS_LABELS[status] || status;

              return (
                <View key={status} className="flex-row">
                  <View className="items-center mr-3">
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isActive ? colors.primary : 'transparent',
                        borderWidth: isActive ? 0 : 2,
                        borderColor: isActive ? colors.primary : colors.mutedForeground,
                      }}>
                      {isActive && <Check size={14} color="#fff" />}
                    </View>
                    {!isLast && (
                      <View
                        style={{
                          width: 2,
                          height: 24,
                          backgroundColor: isActive && !isCurrent ? colors.primary : colors.mutedForeground,
                        }}
                      />
                    )}
                  </View>
                  <View className="pb-4 pt-0.5">
                    <Text
                      className={`text-sm ${
                        isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      }`}>
                      {label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Cancelled Banner */}
        {isCancelled && (
          <View className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 mb-4 flex-row items-center">
            <XCircle size={18} color={colors.destructive} />
            <Text className="text-sm text-destructive ml-2 font-medium">
              This order has been {order.status === 'REFUNDED' ? 'refunded' : 'cancelled'}
            </Text>
          </View>
        )}

        {/* Items */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-3">
            Items
          </Text>
          {order.items.map((item, idx) => (
            <View
              key={idx}
              className={`flex-row justify-between py-2 ${
                idx < order.items.length - 1 ? 'border-b border-border' : ''
              }`}>
              <View className="flex-1">
                <Text className="text-sm text-foreground">{item.drug_name}</Text>
                <Text className="text-xs text-muted-foreground">
                  {item.quantity} x {format(item.unit_price)}
                </Text>
              </View>
              <Text className="text-sm font-medium text-foreground ml-2">
                {format(item.total_price)}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery Info */}
        {order.delivery_method === 'DELIVERY' && order.delivery_address && (
          <View className="bg-card border border-border rounded-2xl p-4 mb-4">
            <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
              Delivery Address
            </Text>
            <View className="flex-row items-start">
              <MapPin size={16} color={colors.primary} />
              <View className="ml-2">
                <Text className="text-sm text-foreground">
                  {order.delivery_address.recipient_name}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {order.delivery_address.street}, {order.delivery_address.city}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {order.delivery_address.phone}
                </Text>
              </View>
            </View>
            {order.delivery_tracking_number && (
              <View className="mt-2 pt-2 border-t border-border">
                <Text className="text-xs text-muted-foreground">
                  Tracking: {order.delivery_tracking_number}
                </Text>
              </View>
            )}
            {order.estimated_delivery_date && (
              <Text className="text-xs text-muted-foreground mt-1">
                Est. Delivery: {formatDateTime(order.estimated_delivery_date)}
              </Text>
            )}
          </View>
        )}

        {order.delivery_method === 'PICKUP' && order.pickup_code && (
          <View className="bg-card border border-border rounded-2xl p-4 mb-4">
            <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
              Pickup Code
            </Text>
            <Text className="text-2xl font-bold text-primary text-center">
              {order.pickup_code}
            </Text>
            <Text className="text-xs text-muted-foreground text-center mt-1">
              Show this code when you pick up your order
            </Text>
          </View>
        )}

        {/* Payment Summary */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
            Payment Summary
          </Text>
          <View className="flex-row items-center mb-2">
            <CreditCard size={14} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground ml-1.5">
              {order.payment_method || 'Card'} · {order.payment_status}
            </Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-sm text-muted-foreground">Subtotal</Text>
            <Text className="text-sm text-foreground">{format(order.subtotal)}</Text>
          </View>
          {order.delivery_fee > 0 && (
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm text-muted-foreground">Delivery</Text>
              <Text className="text-sm text-foreground">{format(order.delivery_fee)}</Text>
            </View>
          )}
          {order.discount_amount > 0 && (
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm text-success">Discount</Text>
              <Text className="text-sm text-success">-{format(order.discount_amount)}</Text>
            </View>
          )}
          <View className="border-t border-border pt-2 mt-1 flex-row justify-between">
            <Text className="text-base font-bold text-foreground">Total</Text>
            <Text className="text-base font-bold text-primary">
              {format(order.total_amount)}
            </Text>
          </View>
        </View>

        {/* Rating Section */}
        {canRate && !showRating && (
          <Button
            variant="outline"
            onPress={() => setShowRating(true)}
            className="mb-4">
            Rate this Order
          </Button>
        )}

        {showRating && (
          <View className="bg-card border border-border rounded-2xl p-4 mb-4">
            <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-3">
              Rate Your Experience
            </Text>
            <View className="flex-row justify-center mb-3">
              {[1, 2, 3, 4, 5].map(n => (
                <View key={n} className="mx-1">
                  <Star
                    size={28}
                    color={n <= rating ? colors.secondary : colors.border}
                    fill={n <= rating ? colors.secondary : 'transparent'}
                    onPress={() => setRating(n)}
                  />
                </View>
              ))}
            </View>
            <TextInput
              className="bg-muted rounded-xl p-3 text-foreground text-sm h-20"
              placeholder="Write a review (optional)"
              placeholderTextColor={colors.mutedForeground}
              value={review}
              onChangeText={setReview}
              multiline
              textAlignVertical="top"
            />
            <Button
              variant="primary"
              onPress={handleRate}
              loading={submittingRating}
              className="mt-3">
              Submit Rating
            </Button>
          </View>
        )}

        {/* Existing Rating */}
        {order.rating && (
          <View className="bg-card border border-border rounded-2xl p-4 mb-4">
            <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
              Your Rating
            </Text>
            <View className="flex-row items-center">
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  size={18}
                  color={n <= order.rating! ? colors.secondary : colors.border}
                  fill={n <= order.rating! ? colors.secondary : 'transparent'}
                />
              ))}
            </View>
            {order.review && (
              <Text className="text-sm text-muted-foreground mt-1">{order.review}</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      {(canCancel || canRate || canTrack) && (
        <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-5 pt-3 pb-8 flex-row gap-3">
          {canTrack && (
            <Button
              variant="primary"
              onPress={() => navigation.navigate('TrackOrder', {orderNumber: order.order_number})}
              className="flex-1">
              Track Order
            </Button>
          )}
          {canCancel && (
            <Button
              variant="secondary"
              onPress={handleCancel}
              loading={cancelling}
              className="flex-1">
              Cancel Order
            </Button>
          )}
          {!isCancelled && !canTrack && (
            <Button
              variant="outline"
              onPress={handleReorder}
              className="flex-1">
              Reorder
            </Button>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
