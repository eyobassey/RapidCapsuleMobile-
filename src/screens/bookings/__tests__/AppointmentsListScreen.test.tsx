import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppointmentsListScreen from '../AppointmentsListScreen';
import { useAppointmentsQuery } from '../../../hooks/queries/useAppointmentsQuery';
import type { BookingsStackParamList } from '../../../navigation/stacks/BookingsStack';

jest.mock('../../../hooks/queries/useAppointmentsQuery');

type NavParams = BookingsStackParamList;

const Stack = createNativeStackNavigator<NavParams>();

function renderWithProviders() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AppointmentsList" component={AppointmentsListScreen} />
          <Stack.Screen name="AppointmentDetail" component={() => null} />
          <Stack.Screen name="SelectSpecialty" component={() => null} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

describe('AppointmentsListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty state when there are no appointments', async () => {
    (useAppointmentsQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = renderWithProviders();

    await waitFor(() => {
      expect(getByText('No upcoming appointments')).toBeTruthy();
    });
  });

  it('renders without crashing when FAB is present', () => {
    (useAppointmentsQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    renderWithProviders();
  });
});
