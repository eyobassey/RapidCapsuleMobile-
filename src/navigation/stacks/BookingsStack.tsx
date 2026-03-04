import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import AppointmentsListScreen from '../../screens/bookings/AppointmentsListScreen';
import AppointmentDetailScreen from '../../screens/bookings/AppointmentDetailScreen';
import SelectSpecialtyScreen from '../../screens/bookings/booking/SelectSpecialtyScreen';
import SelectSpecialistScreen from '../../screens/bookings/booking/SelectSpecialistScreen';
import SelectScheduleScreen from '../../screens/bookings/booking/SelectScheduleScreen';
import ConfirmBookingScreen from '../../screens/bookings/booking/ConfirmBookingScreen';
import RateAppointmentScreen from '../../screens/bookings/RateAppointmentScreen';

export type BookingsStackParamList = {
  AppointmentsList: undefined;
  AppointmentDetail: {id: string};
  SelectSpecialty: undefined;
  SelectSpecialist: {categoryId: string};
  SelectSchedule: {specialistId: string};
  ConfirmBooking: undefined;
  RateAppointment: {id: string};
};

const Stack = createNativeStackNavigator<BookingsStackParamList>();

export default function BookingsStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="AppointmentsList" component={AppointmentsListScreen} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
      <Stack.Screen name="SelectSpecialty" component={SelectSpecialtyScreen} />
      <Stack.Screen name="SelectSpecialist" component={SelectSpecialistScreen} />
      <Stack.Screen name="SelectSchedule" component={SelectScheduleScreen} />
      <Stack.Screen name="ConfirmBooking" component={ConfirmBookingScreen} />
      <Stack.Screen name="RateAppointment" component={RateAppointmentScreen} />
    </Stack.Navigator>
  );
}
