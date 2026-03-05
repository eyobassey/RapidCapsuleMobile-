import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Package} from 'lucide-react-native';
import {StatusBadge} from '../ui';
import {formatCurrency, formatDate} from '../../utils/formatters';
import {colors} from '../../theme/colors';
import type {PharmacyOrder} from '../../types/pharmacy.types';

interface OrderCardProps {
  order: PharmacyOrder;
  onPress: (order: PharmacyOrder) => void;
}

export default function OrderCard({order, onPress}: OrderCardProps) {
  const itemSummary =
    order.items.length === 1
      ? order.items[0].drug_name
      : `${order.items[0]?.drug_name || 'Order'} + ${order.items.length - 1} more`;

  return (
    <TouchableOpacity
      onPress={() => onPress(order)}
      className="bg-card border border-border rounded-2xl p-4 mb-3"
      activeOpacity={0.7}>
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Package size={16} color={colors.mutedForeground} />
          <Text className="text-xs font-medium text-muted-foreground ml-1.5">
            #{order.order_number}
          </Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
        {itemSummary}
      </Text>

      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-xs text-muted-foreground">
          {formatDate(order.created_at)}
        </Text>
        <Text className="text-sm font-bold text-primary">
          {formatCurrency(order.total_amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
