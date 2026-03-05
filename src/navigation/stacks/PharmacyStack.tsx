import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import PharmacyHomeScreen from '../../screens/pharmacy/PharmacyHomeScreen';
import DrugSearchScreen from '../../screens/pharmacy/DrugSearchScreen';
import DrugCategoryScreen from '../../screens/pharmacy/DrugCategoryScreen';
import DrugDetailScreen from '../../screens/pharmacy/DrugDetailScreen';
import CartScreen from '../../screens/pharmacy/CartScreen';
import CheckoutScreen from '../../screens/pharmacy/CheckoutScreen';
import MyOrdersScreen from '../../screens/pharmacy/MyOrdersScreen';
import OrderDetailScreen from '../../screens/pharmacy/OrderDetailScreen';

export type PharmacyStackParamList = {
  PharmacyHome: undefined;
  DrugCategory: {categoryId: string; categoryName: string};
  DrugSearch: undefined;
  DrugDetail: {drugId: string};
  Cart: undefined;
  Checkout: undefined;
  MyOrders: undefined;
  OrderDetail: {orderId: string};
};

const Stack = createNativeStackNavigator<PharmacyStackParamList>();

export default function PharmacyStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="PharmacyHome" component={PharmacyHomeScreen} />
      <Stack.Screen name="DrugSearch" component={DrugSearchScreen} />
      <Stack.Screen name="DrugCategory" component={DrugCategoryScreen} />
      <Stack.Screen name="DrugDetail" component={DrugDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}
