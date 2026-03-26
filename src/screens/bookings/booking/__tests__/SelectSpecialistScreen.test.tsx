import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import SelectSpecialistScreen from '../SelectSpecialistScreen';
import { useAppointmentsStore } from '../../../../store/appointments';
import { useSpecialistsQuery } from '../../../../hooks/queries';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
  SafeAreaView: require('react-native').View,
}));

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({
    params: { professionalCategory: 'Specialist', specialistCategory: 'Cardiology' },
  }),
}));

jest.mock('../../../../store/appointments', () => ({
  useAppointmentsStore: jest.fn(),
}));

jest.mock('../../../../hooks/queries', () => ({
  useSpecialistsQuery: jest.fn(),
}));

// FlashList requires an estimated item size and measures items — stub it for tests
jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native');
  return { FlashList: FlatList };
});

// Stub SpecialistCard to expose a pressable element with the specialist's name
jest.mock('../../../../components/appointments/SpecialistCard', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return function SpecialistCard({ specialist, onSelect }: any) {
    const profile = specialist.profile || {};
    const label = profile.first_name
      ? `Dr. ${profile.first_name} ${profile.last_name || ''}`
      : specialist.name || 'Specialist';
    return (
      <TouchableOpacity onPress={onSelect} accessibilityLabel={label}>
        <Text>{label}</Text>
      </TouchableOpacity>
    );
  };
});

describe('SelectSpecialistScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAppointmentsStore as unknown as jest.Mock).mockReturnValue({ setBookingData: jest.fn() });
    (useSpecialistsQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false });
  });

  it('renders the header and step 5 indicator', () => {
    const { getByText } = render(<SelectSpecialistScreen />);
    expect(getByText('Select Specialist')).toBeTruthy();
    expect(getByText('Step 5 of 6')).toBeTruthy();
  });

  it('passes category params to the specialists query', () => {
    render(<SelectSpecialistScreen />);
    expect(useSpecialistsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        professional_category: 'Specialist',
        specialist_category: 'Cardiology',
      })
    );
  });

  it('navigates to ConfirmBooking (not SelectSchedule) when a specialist is selected', async () => {
    const setBookingData = jest.fn();
    (useAppointmentsStore as unknown as jest.Mock).mockReturnValue({ setBookingData });
    (useSpecialistsQuery as jest.Mock).mockReturnValue({
      data: [{ _id: 'sp-1', profile: { first_name: 'John', last_name: 'Smith' } }],
      isLoading: false,
    });

    const { getByText } = render(<SelectSpecialistScreen />);
    await waitFor(() => expect(getByText('Dr. John Smith')).toBeTruthy());
    fireEvent.press(getByText('Dr. John Smith'));

    expect(setBookingData).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('ConfirmBooking');
    expect(mockNavigate).not.toHaveBeenCalledWith('SelectSchedule', expect.anything());
  });
});
