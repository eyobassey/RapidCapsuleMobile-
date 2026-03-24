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
import { navigationRef } from './navigationRef';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isLoading, isAuthenticated, needsOnboarding, bootstrapForApp } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await bootstrapForApp(() => cancelled);
    })();

    return () => {
      cancelled = true;
    };
  }, [bootstrapForApp]);

  return (
    <NavigationContainer ref={navigationRef} linking={linking} theme={DarkTheme}>
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
