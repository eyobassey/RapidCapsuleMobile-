import React from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import {Pill, ShieldAlert} from 'lucide-react-native';
import {colors} from '../../theme/colors';
import {formatCurrency} from '../../utils/formatters';
import type {Drug} from '../../types/pharmacy.types';

interface DrugCardProps {
  drug: Drug;
  variant?: 'compact' | 'full';
  onPress: (drug: Drug) => void;
}

export default function DrugCard({drug, variant = 'full', onPress}: DrugCardProps) {
  const dosageForm = typeof drug.dosage_form === 'object' ? drug.dosage_form?.name : drug.dosage_form;

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={() => onPress(drug)}
        className="w-40 bg-card border border-border rounded-2xl overflow-hidden mr-3"
        activeOpacity={0.7}>
        {drug.primary_image ? (
          <Image
            source={{uri: drug.primary_image}}
            className="w-full h-28"
            resizeMode="cover"
          />
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
          <Text className="text-sm font-bold text-primary mt-1">
            {formatCurrency(drug.price || 0)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Full variant — horizontal row
  return (
    <TouchableOpacity
      onPress={() => onPress(drug)}
      className="bg-card border border-border rounded-2xl p-3 flex-row items-center mb-3"
      activeOpacity={0.7}>
      {drug.primary_image ? (
        <Image
          source={{uri: drug.primary_image}}
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
      </View>

      <View className="items-end ml-2">
        <Text className="text-sm font-bold text-primary">
          {formatCurrency(drug.price || 0)}
        </Text>
        {drug.requires_prescription && (
          <View className="flex-row items-center mt-1">
            <ShieldAlert size={12} color={colors.secondary} />
            <Text className="text-[10px] text-secondary ml-0.5">Rx</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
