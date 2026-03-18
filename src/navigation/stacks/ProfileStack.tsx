import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../../screens/profile/ProfileScreen';
import EditProfileScreen from '../../screens/profile/EditProfileScreen';
import WalletScreen from '../../screens/profile/WalletScreen';
import HealthRecordsScreen from '../../screens/profile/HealthRecordsScreen';
import WebViewScreen from '../../screens/profile/WebViewScreen';
import PrescriptionsListScreen from '../../screens/prescriptions/PrescriptionsListScreen';
import PrescriptionDetailScreen from '../../screens/prescriptions/PrescriptionDetailScreen';
// Onboarding screens accessible from profile
import OnboardingDashboardScreen from '../../screens/onboarding/OnboardingDashboardScreen';
import PersonalDetailsScreen from '../../screens/onboarding/PersonalDetailsScreen';
import AddressEmergencyScreen from '../../screens/onboarding/AddressEmergencyScreen';
import DependantsScreen from '../../screens/onboarding/DependantsScreen';
import VitalsMetricsScreen from '../../screens/onboarding/VitalsMetricsScreen';
import AllergiesScreen from '../../screens/onboarding/AllergiesScreen';
import MedicalHistoryScreen from '../../screens/onboarding/MedicalHistoryScreen';
import DeviceIntegrationScreen from '../../screens/onboarding/DeviceIntegrationScreen';
import WalletCreditsScreen from '../../screens/onboarding/WalletCreditsScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Wallet: { initialTab?: string } | undefined;
  HealthRecords: undefined;
  PrescriptionsList: undefined;
  PrescriptionDetail: { id: string };
  Settings: undefined;
  WebView: { title: string; url: string };
  // Onboarding screens (reused from onboarding flow)
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

function PlaceholderScreen({ route }: any) {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-foreground text-lg">{route.name}</Text>
    </View>
  );
}

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="HealthRecords" component={HealthRecordsScreen} />
      <Stack.Screen name="PrescriptionsList" component={PrescriptionsListScreen} />
      <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} />
      <Stack.Screen name="Settings" component={PlaceholderScreen} />
      <Stack.Screen name="WebView" component={WebViewScreen} />
      {/* Onboarding screens */}
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
