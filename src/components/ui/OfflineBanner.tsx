import React from 'react';
import { View } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { getFontStyle } from '../../config/fonts';
import { Text } from './Text';

export default function OfflineBanner() {
  const { isConnected } = useNetworkStatus();

  if (isConnected) return null;

  return (
    <View
      style={{
        backgroundColor: '#f97316',
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
      accessibilityRole="alert"
      accessibilityLabel="No internet connection"
    >
      <WifiOff size={16} color="#ffffff" />
      <Text style={{ color: '#ffffff', fontSize: 13, ...getFontStyle('medium') }}>
        No internet connection — changes will sync when online
      </Text>
    </View>
  );
}
