import React from 'react';
import { View } from 'react-native';
import { colors } from '../../theme/colors';
import { STATUS_COLORS } from '../../utils/constants';
import { Text } from './Text';

type BadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  status: string;
  size?: BadgeSize;
}

/**
 * Maps color keys from STATUS_COLORS to actual hex values.
 * "warning" is mapped to secondary (orange) since there is no dedicated warning color.
 */
const colorValueMap: Record<string, { bg: string; text: string }> = {
  success: { bg: `${colors.success}33`, text: colors.success },
  destructive: { bg: `${colors.destructive}33`, text: colors.destructive },
  primary: { bg: `${colors.primary}33`, text: colors.primary },
  secondary: { bg: `${colors.secondary}33`, text: colors.secondary },
  accent: { bg: `${colors.accent}33`, text: colors.accent },
  muted: { bg: `${colors.muted}`, text: colors.mutedForeground },
  warning: { bg: `${colors.secondary}33`, text: colors.secondary },
};

const defaultColor = { bg: `${colors.muted}`, text: colors.mutedForeground };

function capitalize(str: string): string {
  if (!str) return '';
  // Replace underscores with spaces and capitalize each word
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const colorKey = STATUS_COLORS[status] ?? 'muted';
  const colorValues = colorValueMap[colorKey] ?? defaultColor;

  const isSmall = size === 'sm';

  return (
    <View
      style={{
        backgroundColor: colorValues.bg,
        paddingHorizontal: isSmall ? 8 : 12,
        paddingVertical: isSmall ? 2 : 4,
        borderRadius: 9999,
      }}
    >
      <Text
        style={{
          color: colorValues.text,
          fontSize: isSmall ? 12 : 14,
          fontWeight: '500',
        }}
      >
        {capitalize(status)}
      </Text>
    </View>
  );
}
