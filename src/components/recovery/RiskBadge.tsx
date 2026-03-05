import React from 'react';
import {View, Text} from 'react-native';
import {colors} from '../../theme/colors';

const RISK_CONFIG: Record<string, {bg: string; color: string; label: string}> = {
  low: {bg: `${colors.success}20`, color: colors.success, label: 'Low Risk'},
  mild: {bg: `${colors.success}20`, color: colors.success, label: 'Mild'},
  moderate: {bg: `${colors.secondary}20`, color: colors.secondary, label: 'Moderate'},
  high: {bg: `${colors.destructive}20`, color: colors.destructive, label: 'High Risk'},
  moderately_severe: {bg: `${colors.destructive}20`, color: colors.destructive, label: 'Mod. Severe'},
  severe: {bg: '#7f1d1d30', color: '#dc2626', label: 'Severe'},
  critical: {bg: '#7f1d1d30', color: '#dc2626', label: 'Critical'},
};

interface Props {
  level: string;
  size?: 'sm' | 'md';
}

export default function RiskBadge({level, size = 'sm'}: Props) {
  const config = RISK_CONFIG[level?.toLowerCase()] || RISK_CONFIG.low;

  return (
    <View
      style={{
        backgroundColor: config.bg,
        borderRadius: size === 'sm' ? 8 : 10,
        paddingHorizontal: size === 'sm' ? 8 : 12,
        paddingVertical: size === 'sm' ? 3 : 5,
        alignSelf: 'flex-start',
      }}>
      <Text
        style={{
          fontSize: size === 'sm' ? 10 : 12,
          fontWeight: '700',
          color: config.color,
        }}>
        {config.label}
      </Text>
    </View>
  );
}
