import React from 'react';
import { View } from 'react-native';
import Button from './Button';
import { Text } from './Text';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <View className="bg-muted rounded-full p-4">{icon}</View>

      <Text className="text-lg font-bold text-foreground mt-4">{title}</Text>

      {subtitle ? (
        <Text className="text-sm text-muted-foreground mt-1 text-center">{subtitle}</Text>
      ) : null}

      {actionLabel && onAction ? (
        <View className="mt-6 w-full">
          <Button variant="primary" onPress={onAction} fullWidth={false}>
            {actionLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}
