import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Package, Truck, Store} from 'lucide-react-native';
import {StatusBadge} from '../ui';
import {formatDate} from '../../utils/formatters';
import {useCurrency} from '../../hooks/useCurrency';
import {colors} from '../../theme/colors';
import type {PharmacyOrder} from '../../types/pharmacy.types';

interface OrderCardProps {
  order: PharmacyOrder;
  onPress: (order: PharmacyOrder) => void;
}

export default function OrderCard({order, onPress}: OrderCardProps) {
  const {format} = useCurrency();
  const itemCount = order.items.length;
  const firstItem = order.items[0]?.drug_name || 'Order';
  const itemSummary = itemCount === 1 ? firstItem : `${firstItem} + ${itemCount - 1} more`;
  const isDelivery = order.delivery_method === 'DELIVERY';
  const pharmacyName =
    typeof order.pharmacy === 'object' && order.pharmacy?.name
      ? order.pharmacy.name
      : null;

  return (
    <TouchableOpacity
      onPress={() => onPress(order)}
      className="bg-card border border-border rounded-2xl p-4 mb-3"
      activeOpacity={0.7}>
      {/* Top row: order number + status */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Package size={16} color={colors.mutedForeground} />
          <Text className="text-xs font-medium text-muted-foreground ml-1.5">
            #{order.order_number}
          </Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      {/* Item summary */}
      <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
        {itemSummary}
      </Text>

      {/* Delivery method + item count */}
      <View className="flex-row items-center mt-1.5 gap-3">
        <View className="flex-row items-center">
          {isDelivery ? (
            <Truck size={13} color={colors.mutedForeground} />
          ) : (
            <Store size={13} color={colors.mutedForeground} />
          )}
          <Text className="text-xs text-muted-foreground ml-1">
            {isDelivery ? 'Delivery' : 'Pickup'}
          </Text>
        </View>
        <Text className="text-xs text-muted-foreground">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
        {pharmacyName && (
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {pharmacyName}
          </Text>
        )}
      </View>

      {/* Bottom row: date + total */}
      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-xs text-muted-foreground">
          {formatDate(order.created_at)}
        </Text>
        <Text className="text-sm font-bold text-primary">
          {format(order.total_amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
