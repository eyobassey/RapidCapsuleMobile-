import React from 'react';
import {View, Text} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

export type PharmacyStackParamList = {
  PharmacyHome: undefined;
  DrugCategory: undefined;
  DrugSearch: undefined;
  DrugDetail: undefined;
  Cart: undefined;
  Checkout: undefined;
  MyOrders: undefined;
  OrderDetail: undefined;
};

function PlaceholderScreen({route}: any) {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-foreground text-lg">{route.name}</Text>
    </View>
  );
}

const Stack = createNativeStackNavigator<PharmacyStackParamList>();

export default function PharmacyStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="PharmacyHome" component={PlaceholderScreen} />
      <Stack.Screen name="DrugCategory" component={PlaceholderScreen} />
      <Stack.Screen name="DrugSearch" component={PlaceholderScreen} />
      <Stack.Screen name="DrugDetail" component={PlaceholderScreen} />
      <Stack.Screen name="Cart" component={PlaceholderScreen} />
      <Stack.Screen name="Checkout" component={PlaceholderScreen} />
      <Stack.Screen name="MyOrders" component={PlaceholderScreen} />
      <Stack.Screen name="OrderDetail" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}
