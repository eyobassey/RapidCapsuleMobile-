import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {colors} from '../../theme/colors';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function Header({title, onBack, rightAction}: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between bg-card border-b border-border px-4 py-3">
      <View className="w-10 items-start">
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text
        className="text-lg font-bold text-foreground flex-1 text-center"
        numberOfLines={1}>
        {title}
      </Text>

      <View className="w-10 items-end">{rightAction ?? null}</View>
    </View>
  );
}
