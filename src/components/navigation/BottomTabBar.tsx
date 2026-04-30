import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BrainCircuit, Calendar, Home, Pill } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';
import { usePharmacyStore } from '../../store/pharmacy';
import { colors } from '../../theme/colors';
import { Avatar } from '../ui';
import { Text } from '../ui/Text';

const TAB_ICONS: Record<string, any> = {
  Home: Home,
  Bookings: Calendar,
  Eka: BrainCircuit,
  Pharmacy: Pill,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabItem({
  route,
  isFocused,
  onPress,
  Icon,
  cartCount,
  user,
}: {
  route: any;
  isFocused: boolean;
  onPress: () => void;
  Icon: any;
  cartCount: number;
  user: any;
}) {
  const isProfile = route.name === 'Profile';
  const isPharmacy = route.name === 'Pharmacy';
  const showBadge = isPharmacy && cartCount > 0;

  // Animation values
  const scale = useSharedValue(isFocused ? 1.15 : 1);
  const opacity = useSharedValue(isFocused ? 1 : 0.65);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.15 : 1, { damping: 12, stiffness: 120 });
    opacity.value = withSpring(isFocused ? 1 : 0.65);
  }, [isFocused, scale, opacity]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const tabLabel = route.name === 'Eka' ? 'Eka AI' : route.name;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="tab"
      accessibilityLabel={`${tabLabel}${showBadge ? `, ${cartCount} items in cart` : ''}`}
      accessibilityState={{ selected: isFocused }}
      testID={`bottom-tab-${String(route.name).toLowerCase()}`}
      className="items-center justify-center flex-1 h-full"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={[styles.itemContainer, animatedIconStyle]}>
        {isProfile ? (
          <View
            style={{
              borderWidth: 1.5,
              borderRadius: 9999,
              borderColor: isFocused ? colors.primary : 'transparent',
              padding: 1.5,
              backgroundColor: isFocused ? `${colors.primary}10` : 'transparent',
            }}
          >
            <Avatar
              uri={user?.profile?.profile_photo || user?.profile?.profile_image}
              firstName={user?.profile?.first_name || 'U'}
              lastName={user?.profile?.last_name || ''}
              size="xs"
            />
          </View>
        ) : (
          <View style={{ position: 'relative' }}>
            <Icon
              size={22}
              color={isFocused ? colors.primary : colors.mutedForeground}
              strokeWidth={isFocused ? 2.5 : 2}
            />
            {showBadge && (
              <View
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -10,
                  backgroundColor: colors.destructive,
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  paddingHorizontal: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: colors.card,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 8, fontWeight: '800' }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>
      <Text
        style={{
          fontSize: 9,
          fontWeight: isFocused ? '700' : '600',
          color: isFocused ? colors.primary : colors.mutedForeground,
          marginTop: 2,
          opacity: isFocused ? 1 : 0.8,
        }}
      >
        {tabLabel}
      </Text>
    </TouchableOpacity>
  );
}

function EkaButton({
  isFocused,
  onPress,
  Icon,
}: {
  isFocused: boolean;
  onPress: () => void;
  Icon: any;
}) {
  // Glow halo animation
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    // Breathing/Pulse effect
    glowScale.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(withTiming(0.6, { duration: 1500 }), withTiming(0.3, { duration: 1500 })),
      -1,
      true
    );
  }, [glowScale, glowOpacity]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: isFocused ? glowOpacity.value + 0.2 : glowOpacity.value,
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isFocused ? withSpring(1.2) : withSpring(1) }],
  }));

  return (
    <View style={styles.ekaWrapper}>
      {/* Background Pulse Halo */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: colors.primary,
          },
          animatedGlowStyle,
        ]}
      />

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="tab"
        accessibilityLabel="Eka AI"
        accessibilityState={{ selected: isFocused }}
        testID="bottom-tab-eka"
      >
        <LinearGradient
          colors={[colors.primary, colors.accent]} // Sky Blue -> Indigo
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.ekaButton, { borderColor: colors.background }]}
        >
          {/* Inner Highlight Ring (Glass Effect) */}
          <View
            style={{
              position: 'absolute',
              top: 1,
              left: 1,
              right: 1,
              bottom: 1,
              borderRadius: 29,
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.15)',
            }}
          />
          <Animated.View
            style={[animatedIconStyle, { alignItems: 'center', justifyContent: 'center' }]}
          >
            <Icon size={26} color={colors.white} strokeWidth={2.5} />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Tab Bar ─────────────────────────────────────────────────────────────

export default function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const cartCount = usePharmacyStore((s) => s.cartCount);
  const user = useAuthStore((s) => s.user);

  // Check if the focused tab wants to hide the tab bar
  const focusedRoute = state.routes[state.index];
  const focusedOptions = focusedRoute ? descriptors[focusedRoute.key]?.options : undefined;
  if ((focusedOptions?.tabBarStyle as any)?.display === 'none') {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 6 }]}>
      {/* Background with slight translucency */}
      <View style={styles.blurBackground} />

      <View style={styles.contentContainer}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const isEka = route.name === 'Eka';
          const Icon = TAB_ICONS[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
              const initialScreen = route.name === 'Profile' ? 'ProfileHome' : route.name;
              if (isFocused) {
                navigation.navigate(route.name, { screen: initialScreen });
              } else {
                navigation.navigate(
                  route.name,
                  route.name !== 'Eka' ? { screen: initialScreen } : undefined
                );
              }
            }
          };

          if (isEka) {
            return (
              <EkaButton key={route.key} isFocused={isFocused} onPress={onPress} Icon={Icon} />
            );
          }

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              Icon={Icon}
              cartCount={cartCount}
              user={user}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${colors.card}F2`, // high opacity card color for glassmorphism effect
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    height: 54,
  },
  itemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  ekaWrapper: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28, // Floating effect
  },
  ekaButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 12,
  },
});
