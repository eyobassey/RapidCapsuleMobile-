import React, { useEffect } from 'react';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/auth';
import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import MainTabs from './MainTabs';
import { colors } from '../theme/colors';
import linking from '../config/linking';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isLoading, isAuthenticated, needsOnboarding, hydrate } = useAuthStore();

  useEffect(() => {
    let args: { E2E_SKIP_AUTH?: boolean | string } | undefined;
    try {
      // Optional native module used for E2E launchArgs (Detox).
      // Keep this runtime-safe even if pods aren't installed yet.

      const mod = require('react-native-launch-arguments');
      args = mod?.LaunchArguments?.value?.();
    } catch {
      args = undefined;
    }
    const skipAuth = args?.E2E_SKIP_AUTH === true || args?.E2E_SKIP_AUTH === '1';
    if (skipAuth) {
      useAuthStore.setState({
        isLoading: false,
        isAuthenticated: true,
        needsOnboarding: false,
        token: 'e2e-token',
        user: {
          _id: 'e2e-user',
          email: 'e2e@rapidcapsule.local',
          user_type: 'Patient',
          profile: { first_name: 'E2E', last_name: 'User' },
          is_email_verified: true,
        },
      } as any);
      return;
    }

    hydrate();
  }, [hydrate]);

  return (
    <NavigationContainer linking={linking} theme={DarkTheme}>
      {isLoading ? (
        <View className="flex-1 bg-background items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthStack} />
          ) : needsOnboarding ? (
            <Stack.Screen name="Onboarding" component={OnboardingStack} />
          ) : (
            <Stack.Screen name="Main" component={MainTabs} />
          )}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
