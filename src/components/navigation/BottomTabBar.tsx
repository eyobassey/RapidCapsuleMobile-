import React from 'react';
import {View, TouchableOpacity, Text} from 'react-native';
import {
  Home,
  Calendar,
  BrainCircuit,
  Pill,
  User,
} from 'lucide-react-native';
import {colors} from '../../theme/colors';

interface BottomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const TAB_ICONS: Record<string, any> = {
  Home: Home,
  Bookings: Calendar,
  Eka: BrainCircuit,
  Pharmacy: Pill,
  Profile: User,
};

export default function BottomTabBar({state, descriptors, navigation}: BottomTabBarProps) {
  return (
    <View className="absolute bottom-0 left-0 right-0 bg-card/95 border-t border-border px-4 pt-3 pb-8 flex-row justify-between items-center">
      {state.routes.map((route: any, index: number) => {
        const {options} = descriptors[route.key];
        const isFocused = state.index === index;
        const isEka = route.name === 'Eka';
        const Icon = TAB_ICONS[route.name];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Eka FAB (elevated center button)
        if (isEka) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
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
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}>
              <Icon size={24} color={colors.white} />
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            className="items-center gap-1 flex-1">
            <Icon
              size={24}
              color={isFocused ? colors.primary : colors.mutedForeground}
            />
            <Text
              className={`text-[10px] ${
                isFocused ? 'font-bold text-primary' : 'font-medium text-muted-foreground'
              }`}>
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
