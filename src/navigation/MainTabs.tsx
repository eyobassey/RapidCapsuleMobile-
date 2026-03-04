import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
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

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Bookings" component={BookingsStack} />
      <Tab.Screen name="Eka" component={EkaChatScreen} />
      <Tab.Screen name="Pharmacy" component={PharmacyStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
