import { WifiOff } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFontStyle } from '../../config/fonts';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { Text } from './Text';

export default function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const { top } = useSafeAreaInsets();

  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!isConnected) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      translateY.value = withTiming(-80, { duration: 220 });
      opacity.value = withTiming(0, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- translateY and opacity are Reanimated shared values (stable refs, never change identity)
  }, [isConnected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.banner, { top: top + 10 }, animatedStyle]}
      accessibilityRole="alert"
      accessibilityLabel="No internet connection"
      accessibilityLiveRegion="polite"
    >
      <WifiOff size={13} color="#fff" strokeWidth={2.5} />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(18, 22, 36, 0.94)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 9999,
  },
  text: {
    color: '#ffffff',
    fontSize: 13,
    ...getFontStyle('medium'),
  },
});
