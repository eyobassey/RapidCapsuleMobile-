import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ProfileBridgeScreen from '../screens/onboarding/ProfileBridgeScreen';
import OnboardingDashboardScreen from '../screens/onboarding/OnboardingDashboardScreen';
import PersonalDetailsScreen from '../screens/onboarding/PersonalDetailsScreen';
import AddressEmergencyScreen from '../screens/onboarding/AddressEmergencyScreen';
import DependantsScreen from '../screens/onboarding/DependantsScreen';
import VitalsMetricsScreen from '../screens/onboarding/VitalsMetricsScreen';
import AllergiesScreen from '../screens/onboarding/AllergiesScreen';
import MedicalHistoryScreen from '../screens/onboarding/MedicalHistoryScreen';
import DeviceIntegrationScreen from '../screens/onboarding/DeviceIntegrationScreen';
import WalletCreditsScreen from '../screens/onboarding/WalletCreditsScreen';

export type OnboardingStackParamList = {
  ProfileBridge: undefined;
  OnboardingDashboard: undefined;
  PersonalDetails: undefined;
  AddressEmergency: undefined;
  Dependants: undefined;
  VitalsMetrics: undefined;
  Allergies: undefined;
  MedicalHistory: undefined;
  DeviceIntegration: undefined;
  WalletCredits: undefined;
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
      <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
      <Stack.Screen name="AddressEmergency" component={AddressEmergencyScreen} />
      <Stack.Screen name="Dependants" component={DependantsScreen} />
      <Stack.Screen name="VitalsMetrics" component={VitalsMetricsScreen} />
      <Stack.Screen name="Allergies" component={AllergiesScreen} />
      <Stack.Screen name="MedicalHistory" component={MedicalHistoryScreen} />
      <Stack.Screen name="DeviceIntegration" component={DeviceIntegrationScreen} />
      <Stack.Screen name="WalletCredits" component={WalletCreditsScreen} />
    </Stack.Navigator>
  );
}
