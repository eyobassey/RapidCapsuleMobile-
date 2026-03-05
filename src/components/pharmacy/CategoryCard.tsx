import React from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
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
      className="flex-1 bg-card border border-border rounded-2xl overflow-hidden m-1.5"
      activeOpacity={0.7}>
      {category.image_url ? (
        <Image
          source={{uri: category.image_url}}
          className="w-full h-20"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-20 bg-primary/10 items-center justify-center">
          <Pill size={28} color={colors.primary} />
        </View>
      )}
      <View className="p-3 items-center">
        <Text className="text-sm font-semibold text-foreground text-center" numberOfLines={2}>
          {category.name}
        </Text>
        {category.drug_count != null && (
          <Text className="text-xs text-muted-foreground mt-0.5">
            {category.drug_count} drugs
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
