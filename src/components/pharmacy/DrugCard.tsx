import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Pill, ShieldAlert, ShoppingCart } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useCurrency } from '../../hooks/useCurrency';
import type { Drug } from '../../types/pharmacy.types';
import { getDrugPrice, getDrugImage } from '../../types/pharmacy.types';
import { Text } from '../ui';

interface DrugCardProps {
  drug: Drug;
  variant?: 'compact' | 'full';
  onPress: (drug: Drug) => void;
  onAddToCart?: (drug: Drug) => void;
}

export default function DrugCard({ drug, variant = 'full', onPress, onAddToCart }: DrugCardProps) {
  const { format } = useCurrency();
  const dosageForm =
    typeof drug.dosage_form === 'object' ? drug.dosage_form?.name : drug.dosage_form;
  const imageUrl = getDrugImage(drug);
  const price = getDrugPrice(drug);
  const canQuickAdd =
    !!onAddToCart &&
    drug.is_available !== false &&
    drug.is_active !== false &&
    !drug.requires_prescription;

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={() => onPress(drug)}
        className="w-40 bg-card border border-border rounded-2xl overflow-hidden mr-3"
        activeOpacity={0.7}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="w-full h-28" resizeMode="cover" />
        ) : (
          <View className="w-full h-28 bg-muted items-center justify-center">
            <Pill size={32} color={colors.mutedForeground} />
          </View>
        )}
        <View className="p-3">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {drug.name}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
            {drug.strength}
          </Text>
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-sm font-bold text-primary">{format(price)}</Text>
            {canQuickAdd && (
              <TouchableOpacity
                onPress={() => onAddToCart?.(drug)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Add ${drug.name} to cart`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-9 h-9 rounded-full bg-primary items-center justify-center"
              >
                <ShoppingCart size={16} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Full variant — horizontal row
  return (
    <View className="bg-card border border-border rounded-2xl p-3 flex-row items-center mb-3">
      {imageUrl ? (
        <TouchableOpacity onPress={() => onPress(drug)} activeOpacity={0.7}>
          <Image source={{ uri: imageUrl }} className="w-16 h-16 rounded-xl" resizeMode="cover" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => onPress(drug)} activeOpacity={0.7}>
          <View className="w-16 h-16 rounded-xl bg-muted items-center justify-center">
            <Pill size={24} color={colors.mutedForeground} />
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => onPress(drug)}
        className="flex-1 ml-3"
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${drug.name} details`}
      >
        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
          {drug.name}
        </Text>
        {drug.generic_name ? (
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {drug.generic_name}
          </Text>
        ) : null}
        <Text className="text-xs text-muted-foreground mt-0.5">
          {[drug.strength, dosageForm, drug.manufacturer].filter(Boolean).join(' · ')}
        </Text>
      </TouchableOpacity>

      <View className="items-end ml-2">
        <Text className="text-sm font-bold text-primary">{format(price)}</Text>
        {drug.requires_prescription && (
          <View className="flex-row items-center mt-1">
            <ShieldAlert size={12} color={colors.secondary} />
            <Text className="text-[10px] text-secondary ml-0.5">Rx</Text>
          </View>
        )}
        {canQuickAdd && (
          <TouchableOpacity
            onPress={() => onAddToCart?.(drug)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Add ${drug.name} to cart`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="mt-2 w-9 h-9 rounded-full bg-primary items-center justify-center"
          >
            <ShoppingCart size={16} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
