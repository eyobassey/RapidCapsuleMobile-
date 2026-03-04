import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ProfileBridgeScreen from '../screens/onboarding/ProfileBridgeScreen';
import OnboardingDashboardScreen from '../screens/onboarding/OnboardingDashboardScreen';
import EmergencyContactScreen from '../screens/onboarding/EmergencyContactScreen';

export type OnboardingStackParamList = {
  ProfileBridge: undefined;
  OnboardingDashboard: undefined;
  EmergencyContact: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {backgroundColor: '#151c2c'},
      }}>
      <Stack.Screen name="ProfileBridge" component={ProfileBridgeScreen} />
      <Stack.Screen name="OnboardingDashboard" component={OnboardingDashboardScreen} />
      <Stack.Screen name="EmergencyContact" component={EmergencyContactScreen} />
    </Stack.Navigator>
  );
}
