import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import EkaChatScreen from '../screens/main/EkaChatScreen';
import BottomTabBar from '../components/navigation/BottomTabBar';
import HomeStack from './stacks/HomeStack';
import BookingsStack from './stacks/BookingsStack';
import PharmacyStack from './stacks/PharmacyStack';
import ProfileStack from './stacks/ProfileStack';

export type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Eka: undefined;
  Pharmacy: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Screens where the tab bar should be hidden (focused flows)
const HIDE_TAB_SCREENS = new Set([
  // Booking flow
  'SelectSpecialty',
  'SelectSpecialist',
  'SelectSchedule',
  'ConfirmBooking',
  'AppointmentDetail',
  'RateAppointment',
  // Profile health data screens
  'OnboardingDashboard',
  'PersonalDetails',
  'AddressEmergency',
  'Dependants',
  'VitalsMetrics',
  'Allergies',
  'MedicalHistory',
  'DeviceIntegration',
  'WalletCredits',
  'WebView',
  // Prescription screens
  'PrescriptionsList',
  'PrescriptionDetail',
  'HealthCheckupPatientInfo',
  'HealthCheckupRiskFactors',
  'HealthCheckupSymptomSearch',
  'HealthCheckupInterview',
  'HealthCheckupResults',
  'HealthCheckupHistory',
  'HealthCheckupDetail',
  'LogVitals',
  'VitalDetail',
  'Cart',
  'Checkout',
  'OrderDetail',
  'TrackOrder',
  'DrugDetail',
  'UploadPrescription',
  'UploadDetail',
  // Messages
  'MessagingConsent',
  'ConversationsList',
  'Chat',
  'NewConversation',
  'MediaPreview',
  // Recovery
  'RecoveryEnroll',
  'RecoveryDashboard',
  'DailyCheckIn',
  'ScreeningSelect',
  'ScreeningFlow',
  'ScreeningResult',
  'ScreeningHistory',
  'Milestones',
  'Crisis',
  'CheckInHistory',
  'CompanionChat',
  'RecoveryPlan',
  'GroupSessions',
  'PeerSupport',
  'MATDashboard',
  'HarmReduction',
  'RiskHistory',
  'ExerciseHistory',
]);

function getTabBarStyle(route: any) {
  const routeName = getFocusedRouteNameFromRoute(route);
  if (routeName && HIDE_TAB_SCREENS.has(routeName)) {
    return { display: 'none' as const };
  }
  return {};
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      id="MainTabs"
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={({ route }) => ({
          tabBarStyle: getTabBarStyle(route),
        })}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsStack}
        options={({ route }) => ({
          tabBarStyle: getTabBarStyle(route),
        })}
      />
      <Tab.Screen
        name="Eka"
        component={EkaChatScreen}
        options={{ tabBarStyle: { display: 'none' } }}
      />
      <Tab.Screen
        name="Pharmacy"
        component={PharmacyStack}
        options={({ route }) => ({
          tabBarStyle: getTabBarStyle(route),
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={({ route }) => ({
          tabBarStyle: getTabBarStyle(route),
        })}
      />
    </Tab.Navigator>
  );
}
