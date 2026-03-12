import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppointmentsStore } from '../../../store/appointments';
import AppointmentDetailScreen from '../AppointmentDetailScreen';
import type { BookingsStackParamList } from '../../../navigation/stacks/BookingsStack';

jest.mock('../../../store/appointments', () => {
  const actual = jest.requireActual('../../../store/appointments');
  return {
    ...actual,
    useAppointmentsStore: jest.fn(actual.useAppointmentsStore),
  };
});

type NavParams = BookingsStackParamList;

const Stack = createNativeStackNavigator<NavParams>();

function renderWithNav() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="AppointmentDetail"
          component={AppointmentDetailScreen}
          initialParams={{ id: 'apt-1' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('AppointmentDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders skeleton while loading and then shows content', async () => {
    const fetchAppointmentById = jest.fn();

    // First render: loading with no appointment
    (useAppointmentsStore as jest.Mock).mockReturnValue({
      currentAppointment: null,
      isLoading: true,
      fetchAppointmentById,
      cancelAppointment: jest.fn(),
    });

    const { rerender, getByText } = renderWithNav();

    expect(fetchAppointmentById).toHaveBeenCalledWith('apt-1');

    // Simulate store updating with loaded appointment
    (useAppointmentsStore as jest.Mock).mockReturnValue({
      currentAppointment: {
        _id: 'apt-1',
        status: 'OPEN',
        specialist_id: {
          profile: { first_name: 'Jane', last_name: 'Doe' },
        },
      },
      isLoading: false,
      fetchAppointmentById,
      cancelAppointment: jest.fn(),
    });

    rerender(
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="AppointmentDetail"
            component={AppointmentDetailScreen}
            initialParams={{ id: 'apt-1' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText(/Appointment Details/)).toBeTruthy();
    });
  });
});
