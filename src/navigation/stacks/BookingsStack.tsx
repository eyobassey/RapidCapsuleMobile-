import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AppointmentsListScreen from '../../screens/bookings/AppointmentsListScreen';
import AppointmentDetailScreen from '../../screens/bookings/AppointmentDetailScreen';
import SelectServiceTypeScreen from '../../screens/bookings/booking/SelectServiceTypeScreen';
import SelectSpecialtyScreen from '../../screens/bookings/booking/SelectSpecialtyScreen';
import SelectSpecialistScreen from '../../screens/bookings/booking/SelectSpecialistScreen';
import SelectScheduleScreen from '../../screens/bookings/booking/SelectScheduleScreen';
import ConfirmBookingScreen from '../../screens/bookings/booking/ConfirmBookingScreen';
import ConsentScreen from '../../screens/bookings/booking/ConsentScreen';
import RateAppointmentScreen from '../../screens/bookings/RateAppointmentScreen';

export type BookingsStackParamList = {
  AppointmentsList: undefined;
  AppointmentDetail: { id: string };
  SelectServiceType:
    | {
        healthCheckupId?: string;
        healthCheckupSummary?: string;
      }
    | undefined;
  ConsentScreen:
    | {
        healthCheckupId?: string;
        healthCheckupSummary?: string;
      }
    | undefined;
  SelectSpecialty:
    | {
        healthCheckupId?: string;
        healthCheckupSummary?: string;
      }
    | undefined;
  SelectSpecialist: {
    professionalCategory: string;
    specialistCategory: string;
  };
  SelectSchedule: { specialistId?: string } | undefined;
  ConfirmBooking: undefined;
  RateAppointment: { id: string };
};

const Stack = createNativeStackNavigator<BookingsStackParamList>();

export default function BookingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AppointmentsList" component={AppointmentsListScreen} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
      <Stack.Screen name="SelectServiceType" component={SelectServiceTypeScreen} />
      <Stack.Screen name="ConsentScreen" component={ConsentScreen} />
      <Stack.Screen name="SelectSpecialty" component={SelectSpecialtyScreen} />
      <Stack.Screen name="SelectSpecialist" component={SelectSpecialistScreen} />
      <Stack.Screen name="SelectSchedule" component={SelectScheduleScreen} />
      <Stack.Screen name="ConfirmBooking" component={ConfirmBookingScreen} />
      <Stack.Screen name="RateAppointment" component={RateAppointmentScreen} />
    </Stack.Navigator>
  );
}
