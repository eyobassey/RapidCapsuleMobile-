import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/main/HomeScreen';
import EkaChatScreen from '../screens/main/EkaChatScreen';
import BottomTabBar from '../components/navigation/BottomTabBar';
import {View, Text} from 'react-native';

export type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Eka: undefined;
  Pharmacy: undefined;
  Profile: undefined;
};

// Placeholder screens for tabs not yet built
function PlaceholderScreen({route}: any) {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-foreground text-xl font-bold">{route.name}</Text>
      <Text className="text-muted-foreground text-sm mt-2">Coming soon</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Bookings" component={PlaceholderScreen} />
      <Tab.Screen name="Eka" component={EkaChatScreen} />
      <Tab.Screen name="Pharmacy" component={PlaceholderScreen} />
      <Tab.Screen name="Profile" component={PlaceholderScreen} />
    </Tab.Navigator>
  );
}
