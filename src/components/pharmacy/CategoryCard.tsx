import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Pill} from 'lucide-react-native';
import {colors} from '../../theme/colors';
import type {DrugCategory} from '../../types/pharmacy.types';

interface CategoryCardProps {
  category: DrugCategory;
  onPress: (category: DrugCategory) => void;
}

export default function CategoryCard({category, onPress}: CategoryCardProps) {
  return (
    <TouchableOpacity
      onPress={() => onPress(category)}
      className="flex-1 bg-card border border-border rounded-2xl p-4 items-center m-1.5"
      activeOpacity={0.7}>
      <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-2">
        <Pill size={22} color={colors.primary} />
      </View>
      <Text className="text-sm font-semibold text-foreground text-center" numberOfLines={2}>
        {category.name}
      </Text>
      {category.drug_count != null && (
        <Text className="text-xs text-muted-foreground mt-0.5">
          {category.drug_count} drugs
        </Text>
      )}
    </TouchableOpacity>
  );
}
