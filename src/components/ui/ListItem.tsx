import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {ChevronRight} from 'lucide-react-native';
import {colors} from '../../theme/colors';

interface ListItemProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
}

export default function ListItem({
  icon,
  title,
  subtitle,
  rightElement,
  onPress,
  showChevron = true,
}: ListItemProps) {
  const content = (
    <View className="flex-row items-center p-4 bg-card border-b border-border">
      {icon ? <View className="mr-3">{icon}</View> : null}

      <View className="flex-1">
        <Text className="text-foreground font-medium">{title}</Text>
        {subtitle ? (
          <Text className="text-sm text-muted-foreground mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightElement ? (
        <View className="ml-3">{rightElement}</View>
      ) : showChevron ? (
        <ChevronRight size={16} color={colors.mutedForeground} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
