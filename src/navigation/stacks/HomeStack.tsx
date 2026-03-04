import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../../screens/main/HomeScreen';
import NotificationsScreen from '../../screens/notifications/NotificationsScreen';
import VitalsScreen from '../../screens/vitals/VitalsScreen';
import VitalDetailScreen from '../../screens/vitals/VitalDetailScreen';
import LogVitalsScreen from '../../screens/vitals/LogVitalsScreen';

export type HomeStackParamList = {
  Home: undefined;
  Notifications: undefined;
  Vitals: undefined;
  VitalDetail: {vitalType: string};
  LogVitals: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Vitals" component={VitalsScreen} />
      <Stack.Screen name="VitalDetail" component={VitalDetailScreen} />
      <Stack.Screen name="LogVitals" component={LogVitalsScreen} />
    </Stack.Navigator>
  );
}
