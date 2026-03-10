import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../../theme/colors';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  right?: React.ReactNode;
  center?: React.ReactNode;
}

export default function Header({ title, onBack, rightAction, right, center }: HeaderProps) {
  const rightNode = right ?? rightAction ?? null;
  return (
    <View className="flex-row items-center justify-between bg-card border-b border-border px-4 py-3">
      <View className="w-10 items-start">
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
        ) : null}
      </View>

      {center ? (
        <View style={{ flex: 1 }}>{center}</View>
      ) : (
        <Text
          className="text-lg font-bold text-foreground flex-1 text-center"
          accessibilityRole="header"
          numberOfLines={1}
        >
          {title}
        </Text>
      )}

      <View className="w-10 items-end">{rightNode}</View>
    </View>
  );
}
