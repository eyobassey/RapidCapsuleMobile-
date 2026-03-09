import React from 'react';
import {View, TextInput, TouchableOpacity} from 'react-native';
import {Search, X} from 'lucide-react-native';
import {colors} from '../../theme/colors';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}

export default function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
  onSubmit,
}: SearchInputProps) {
  return (
    <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 h-12">
      <Search size={18} color={colors.mutedForeground} />

      <TextInput
        className="flex-1 text-foreground text-base ml-3 h-full"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoCorrect={false}
        accessibilityRole="search"
        accessibilityLabel={placeholder}
      />

      {value.length > 0 ? (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          activeOpacity={0.7}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          accessibilityRole="button"
          accessibilityLabel="Clear search">
          <X size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
