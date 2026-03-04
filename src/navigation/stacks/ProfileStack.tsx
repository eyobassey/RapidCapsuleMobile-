import React from 'react';
import {View, Text} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ProfileScreen from '../../screens/profile/ProfileScreen';
import EditProfileScreen from '../../screens/profile/EditProfileScreen';
import WalletScreen from '../../screens/profile/WalletScreen';
import PrescriptionsListScreen from '../../screens/prescriptions/PrescriptionsListScreen';
import PrescriptionDetailScreen from '../../screens/prescriptions/PrescriptionDetailScreen';

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Wallet: undefined;
  PrescriptionsList: undefined;
  PrescriptionDetail: {id: string};
  Settings: undefined;
};

function PlaceholderScreen({route}: any) {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-foreground text-lg">{route.name}</Text>
    </View>
  );
}

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="PrescriptionsList" component={PrescriptionsListScreen} />
      <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} />
      <Stack.Screen name="Settings" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}
