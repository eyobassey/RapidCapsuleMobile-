import React from 'react';
import { View, Image, TouchableOpacity, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Minus, Plus, X, ShoppingCart, Pill, ShieldAlert } from 'lucide-react-native';

import { usePharmacyStore } from '../../store/pharmacy';
import { Header, Button, EmptyState, Text } from '../../components/ui';
import { colors } from '../../theme/colors';
import { useCurrency } from '../../hooks/useCurrency';
import type { CartItem } from '../../types/pharmacy.types';

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  format,
}: {
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  format: (amount: number) => string;
}) {
  return (
    <View className="bg-card border border-border rounded-2xl p-3 flex-row items-center mb-3">
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          className="w-16 h-16 rounded-xl"
          resizeMode="cover"
        />
      ) : (
        <View className="w-16 h-16 rounded-xl bg-muted items-center justify-center">
          <Pill size={24} color={colors.mutedForeground} />
        </View>
      )}

      <View className="flex-1 ml-3">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-muted-foreground">{item.strength}</Text>
        <Text className="text-sm font-bold text-primary mt-1">
          {format(item.price * item.quantity)}
        </Text>
      </View>

      <View className="items-center ml-2">
        {/* Quantity Controls */}
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.drugId, item.quantity - 1)}
            className="w-8 h-8 rounded-lg bg-muted items-center justify-center"
            disabled={item.quantity <= 1}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Decrease quantity of ${item.name}`}
            accessibilityState={{ disabled: item.quantity <= 1 }}
          >
            <Minus size={14} color={item.quantity <= 1 ? colors.muted : colors.foreground} />
          </TouchableOpacity>
          <Text
            className="text-sm font-bold text-foreground mx-2 min-w-[20px] text-center"
            accessibilityLabel={`Quantity: ${item.quantity}`}
          >
            {item.quantity}
          </Text>
          <TouchableOpacity
            onPress={() => onUpdateQuantity(item.drugId, item.quantity + 1)}
            className="w-8 h-8 rounded-lg bg-muted items-center justify-center"
            disabled={item.quantity >= item.maxQuantityPerOrder}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Increase quantity of ${item.name}`}
            accessibilityState={{ disabled: item.quantity >= item.maxQuantityPerOrder }}
          >
            <Plus
              size={14}
              color={item.quantity >= item.maxQuantityPerOrder ? colors.muted : colors.foreground}
            />
          </TouchableOpacity>
        </View>
        {/* Remove */}
        <TouchableOpacity
          onPress={() => onRemove(item.drugId)}
          className="mt-1.5"
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.name} from cart`}
        >
          <X size={16} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const { format } = useCurrency();
  const navigation = useNavigation<any>();
  const { cartItems, updateQuantity, removeFromCart, clearCart } = usePharmacyStore();

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasRxItems = cartItems.some((item) => item.requiresPrescription);

  const handleRemove = (drugId: string) => {
    Alert.alert('Remove Item', 'Remove this item from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(drugId) },
    ]);
  };

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ]);
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Cart" onBack={() => navigation.goBack()} />
        <EmptyState
          icon={<ShoppingCart size={32} color={colors.mutedForeground} />}
          title="Your cart is empty"
          subtitle="Browse our pharmacy to find what you need"
          actionLabel="Browse Drugs"
          onAction={() => navigation.navigate('PharmacyHome')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header
        title={`Cart (${cartItems.length})`}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={handleClearCart}
            accessibilityRole="button"
            accessibilityLabel="Clear cart"
          >
            <Text className="text-xs text-destructive font-medium">Clear</Text>
          </TouchableOpacity>
        }
      />

      <FlashList
        data={cartItems}
        keyExtractor={(item) => item.drugId}
        estimatedItemSize={80}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onUpdateQuantity={updateQuantity}
            onRemove={handleRemove}
            format={format}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          hasRxItems ? (
            <View className="bg-secondary/10 border border-secondary/30 rounded-2xl p-3 flex-row items-center mt-1">
              <ShieldAlert size={16} color={colors.secondary} />
              <Text className="text-xs text-secondary ml-2 flex-1">
                Some items require a prescription. You may need to upload one during checkout.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Sticky Bottom */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-5 pt-3 pb-8">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm text-muted-foreground">Subtotal</Text>
          <Text className="text-lg font-bold text-foreground">{format(subtotal)}</Text>
        </View>
        <Button variant="primary" onPress={() => navigation.navigate('Checkout')}>
          Proceed to Checkout
        </Button>
      </View>
    </SafeAreaView>
  );
}
