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

jest.mock('../../../services/meeting.service', () => ({
  meetingService: { join: jest.fn(), resolveJoinUrl: jest.fn() },
}));

// Mock sub-components that have heavy native/query dependencies
jest.mock('../../../components/appointments/RescheduleSheet', () => () => null);
jest.mock('../../../components/appointments/ReceiptSheet', () => () => null);

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

const baseStore = {
  currentAppointment: null,
  isLoading: false,
  fetchAppointmentById: jest.fn(),
  cancelAppointment: jest.fn(),
};

describe('AppointmentDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls fetchAppointmentById with the route id on mount', () => {
    const fetchAppointmentById = jest.fn();
    (useAppointmentsStore as unknown as jest.Mock).mockReturnValue({
      ...baseStore,
      isLoading: true,
      fetchAppointmentById,
    });
    renderWithNav();
    expect(fetchAppointmentById).toHaveBeenCalledWith('apt-1');
  });

  it('renders "Appointment not found" when appointment is null and not loading', async () => {
    (useAppointmentsStore as unknown as jest.Mock).mockReturnValue({
      ...baseStore,
      currentAppointment: null,
      isLoading: false,
    });
    const { getByText } = renderWithNav();
    await waitFor(() => {
      expect(getByText('Appointment not found')).toBeTruthy();
    });
  });

  it('shows "Join Meeting" for non-chat upcoming appointments', async () => {
    (useAppointmentsStore as unknown as jest.Mock).mockReturnValue({
      ...baseStore,
      currentAppointment: {
        _id: 'apt-1',
        status: 'OPEN',
        meeting_channel: 'zoom',
        specialist_id: { profile: { first_name: 'Jane', last_name: 'Doe' } },
      },
    });
    const { getByText } = renderWithNav();
    await waitFor(() => {
      expect(getByText('Join Meeting')).toBeTruthy();
    });
  });

  it('shows "Message Doctor" instead of "Join Meeting" for chat channel', async () => {
    (useAppointmentsStore as unknown as jest.Mock).mockReturnValue({
      ...baseStore,
      currentAppointment: {
        _id: 'apt-1',
        status: 'OPEN',
        meeting_channel: 'chat',
        specialist_id: { profile: { first_name: 'Jane', last_name: 'Doe' } },
      },
    });
    const { getByText, queryByText } = renderWithNav();
    await waitFor(() => {
      expect(getByText('Message Doctor')).toBeTruthy();
      expect(queryByText('Join Meeting')).toBeNull();
    });
  });

  it('shows a countdown hint when the join window has not opened yet (non-chat)', async () => {
    const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    (useAppointmentsStore as unknown as jest.Mock).mockReturnValue({
      ...baseStore,
      currentAppointment: {
        _id: 'apt-1',
        status: 'OPEN',
        meeting_channel: 'zoom',
        start_time: futureTime,
        specialist_id: { profile: { first_name: 'Jane', last_name: 'Doe' } },
      },
    });
    const { getByText } = renderWithNav();
    await waitFor(() => {
      expect(getByText(/Button activates 15 min before start/)).toBeTruthy();
    });
  });

  it('shows a countdown hint when the chat appointment has not started yet', async () => {
    const futureTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    (useAppointmentsStore as unknown as jest.Mock).mockReturnValue({
      ...baseStore,
      currentAppointment: {
        _id: 'apt-1',
        status: 'OPEN',
        meeting_channel: 'chat',
        start_time: futureTime,
        specialist_id: { profile: { first_name: 'Jane', last_name: 'Doe' } },
      },
    });
    const { getByText } = renderWithNav();
    await waitFor(() => {
      expect(getByText(/Chat opens at appointment time/)).toBeTruthy();
    });
  });

  it('shows "No notes yet" empty state when all note fields are empty', async () => {
    (useAppointmentsStore as unknown as jest.Mock).mockReturnValue({
      ...baseStore,
      currentAppointment: {
        _id: 'apt-1',
        status: 'OPEN',
        meeting_channel: 'zoom',
        patient_notes: null,
        specialist_notes: null,
        notes: null,
        specialist_id: { profile: { first_name: 'Jane', last_name: 'Doe' } },
      },
    });
    const { getByText } = renderWithNav();
    await waitFor(() => {
      expect(getByText('No notes yet')).toBeTruthy();
    });
  });

  it('does not show the notes card for cancelled appointments', async () => {
    (useAppointmentsStore as unknown as jest.Mock).mockReturnValue({
      ...baseStore,
      currentAppointment: {
        _id: 'apt-1',
        status: 'CANCELLED',
        meeting_channel: 'zoom',
        specialist_id: { profile: { first_name: 'Jane', last_name: 'Doe' } },
      },
    });
    const { queryByText } = renderWithNav();
    await waitFor(() => {
      expect(queryByText('No notes yet')).toBeNull();
    });
  });
});
