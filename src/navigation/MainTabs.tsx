import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
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
  'HealthCheckupPatientInfo',
  'HealthCheckupRiskFactors',
  'HealthCheckupSymptomSearch',
  'HealthCheckupInterview',
  'HealthCheckupResults',
  'HealthCheckupHistory',
  'HealthCheckupDetail',
  'LogVitals',
  'VitalDetail',
]);

function getTabBarStyle(route: any) {
  const routeName = getFocusedRouteNameFromRoute(route);
  if (routeName && HIDE_TAB_SCREENS.has(routeName)) {
    return {display: 'none' as const};
  }
  return {};
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={({route}) => ({
          tabBarStyle: getTabBarStyle(route),
        })}
      />
      <Tab.Screen name="Bookings" component={BookingsStack} />
      <Tab.Screen name="Eka" component={EkaChatScreen} />
      <Tab.Screen name="Pharmacy" component={PharmacyStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
