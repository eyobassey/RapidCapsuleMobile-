import { BrainCircuit, Calendar, Home, Pill } from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
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

export default function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const cartCount = usePharmacyStore((s) => s.cartCount);
  const user = useAuthStore((s) => s.user);

  // Check if the focused tab wants to hide the tab bar
  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key]?.options;
  if ((focusedOptions?.tabBarStyle as any)?.display === 'none') {
    return null;
  }

  const profileImage = user?.profile?.profile_photo || user?.profile?.profile_image;
  const firstName = user?.profile?.first_name || 'User';
  const lastName = user?.profile?.last_name || '';

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-card/95 border-t border-border px-4 pt-3 flex-row justify-between items-center"
      style={{ paddingBottom: insets.bottom, zIndex: 1000, elevation: 1000 }}
    >
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const isEka = route.name === 'Eka';
        const isProfile = route.name === 'Profile';
        const Icon = TAB_ICONS[route.name];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented) {
            // Map tab name to its initial screen name
            const initialScreen = route.name === 'Profile' ? 'ProfileHome' : route.name;
            if (isFocused) {
              // Already on this tab — reset to initial screen
              navigation.navigate(route.name, { screen: initialScreen });
            } else {
              // Switch tab and reset its stack to initial screen
              navigation.navigate(
                route.name,
                route.name !== 'Eka' ? { screen: initialScreen } : undefined
              );
            }
          }
        };

        const tabLabel = route.name === 'Eka' ? 'Eka AI' : route.name;

        // Eka FAB (elevated center button)
        if (isEka) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityLabel={tabLabel}
              accessibilityState={{ selected: isFocused }}
              testID="bottom-tab-eka"
              style={{
                position: 'relative',
                top: -20,
                width: 56,
                height: 56,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 4,
                borderColor: colors.background,
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Icon size={24} color={colors.white} />
            </TouchableOpacity>
          );
        }

        const showBadge = route.name === 'Pharmacy' && cartCount > 0;

        // Profile tab: show avatar instead of icon
        if (isProfile) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityLabel="Profile"
              accessibilityState={{ selected: isFocused }}
              testID="bottom-tab-profile"
              className="items-center gap-1 flex-1"
            >
              <View
                style={{
                  borderWidth: 2,
                  borderRadius: 9999,
                  borderColor: isFocused ? colors.primary : 'transparent',
                }}
              >
                <Avatar uri={profileImage} firstName={firstName} lastName={lastName} size="sm" />
              </View>
              <Text
                className={`text-[10px] ${
                  isFocused ? 'font-bold text-primary' : 'font-medium text-muted-foreground'
                }`}
              >
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={`${tabLabel}${showBadge ? `, ${cartCount} items in cart` : ''}`}
            accessibilityState={{ selected: isFocused }}
            testID={`bottom-tab-${String(route.name).toLowerCase()}`}
            className="items-center gap-1 flex-1"
          >
            <View style={{ position: 'relative' }}>
              <Icon size={24} color={isFocused ? colors.primary : colors.mutedForeground} />
              {showBadge && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                    backgroundColor: colors.destructive,
                    borderRadius: 9999,
                    width: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              className={`text-[10px] ${
                isFocused ? 'font-bold text-primary' : 'font-medium text-muted-foreground'
              }`}
            >
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
