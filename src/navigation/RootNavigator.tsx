import React, { useEffect } from 'react';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Linking } from 'react-native';
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
    let cancelled = false;

    const setE2EAuth = () => {
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
    };

    (async () => {
      // 1) Detox launchArgs (requires optional native module).
      let args: { E2E_SKIP_AUTH?: boolean | string } | undefined;
      try {
        const mod = require('react-native-launch-arguments');
        args = mod?.LaunchArguments?.value?.();
      } catch {
        args = undefined;
      }
      const skipAuthFromArgs = args?.E2E_SKIP_AUTH === true || args?.E2E_SKIP_AUTH === '1';

      // 2) Fallback: deep link query param (works without any extra native modules).
      const initialUrl = await Linking.getInitialURL();
      const skipAuthFromUrl =
        typeof initialUrl === 'string' &&
        (initialUrl.includes('e2eSkipAuth=1') || initialUrl.includes('E2E_SKIP_AUTH=1'));

      if (cancelled) return;

      if (skipAuthFromArgs || skipAuthFromUrl) {
        setE2EAuth();
        return;
      }

      hydrate();
    })();

    return () => {
      cancelled = true;
    };
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
