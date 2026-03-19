import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text, View } from 'react-native';
import PrescriptionDetailScreen from '../../screens/prescriptions/PrescriptionDetailScreen';
import PrescriptionsListScreen from '../../screens/prescriptions/PrescriptionsListScreen';
import AboutScreen from '../../screens/profile/AboutScreen';
import EditProfileScreen from '../../screens/profile/EditProfileScreen';
import HealthRecordsScreen from '../../screens/profile/HealthRecordsScreen';
import NotificationPreferencesScreen from '../../screens/profile/NotificationPreferencesScreen';
import ProfileScreen from '../../screens/profile/ProfileScreen';
import ReferralRewardsScreen from '../../screens/profile/ReferralRewardsScreen';
import SecuritySettingsScreen from '../../screens/profile/SecuritySettingsScreen';
import WalletScreen from '../../screens/profile/WalletScreen';
import WebViewScreen from '../../screens/profile/WebViewScreen';
// Onboarding screens accessible from profile
import AddressEmergencyScreen from '../../screens/onboarding/AddressEmergencyScreen';
import AllergiesScreen from '../../screens/onboarding/AllergiesScreen';
import DependantsScreen from '../../screens/onboarding/DependantsScreen';
import DeviceIntegrationScreen from '../../screens/onboarding/DeviceIntegrationScreen';
import MedicalHistoryScreen from '../../screens/onboarding/MedicalHistoryScreen';
import OnboardingDashboardScreen from '../../screens/onboarding/OnboardingDashboardScreen';
import PersonalDetailsScreen from '../../screens/onboarding/PersonalDetailsScreen';
import VitalsMetricsScreen from '../../screens/onboarding/VitalsMetricsScreen';
import WalletCreditsScreen from '../../screens/onboarding/WalletCreditsScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Wallet: { initialTab?: string } | undefined;
  HealthRecords: undefined;
  PrescriptionsList: undefined;
  PrescriptionDetail: { id: string };
  Settings: undefined;
  SecuritySettings: undefined;
  NotificationPreferences: undefined;
  ReferralRewards: undefined;
  About: undefined;
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
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
      <Stack.Screen name="ReferralRewards" component={ReferralRewardsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
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
