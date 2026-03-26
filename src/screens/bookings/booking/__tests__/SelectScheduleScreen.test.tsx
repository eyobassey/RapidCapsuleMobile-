import React from 'react';
import { render } from '@testing-library/react-native';
import SelectScheduleScreen from '../SelectScheduleScreen';
import { useAppointmentsStore } from '../../../../store/appointments';
import { useAvailableTimesQuery } from '../../../../hooks/queries';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
  SafeAreaView: require('react-native').View,
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: jest.fn(),
}));

jest.mock('../../../../store/appointments', () => ({
  useAppointmentsStore: jest.fn(),
}));

jest.mock('../../../../hooks/queries', () => ({
  useAvailableTimesQuery: jest.fn(),
}));

const baseStore = {
  setBookingData: jest.fn(),
  bookingData: {},
};

describe('SelectScheduleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAvailableTimesQuery as jest.Mock).mockReturnValue({ data: undefined, isLoading: false });
    (useAppointmentsStore as unknown as jest.Mock).mockReturnValue(baseStore);
  });

  describe('without a pre-selected specialist', () => {
    beforeEach(() => {
      const { useRoute } = require('@react-navigation/native');
      (useRoute as jest.Mock).mockReturnValue({ params: {} });
    });

    it('renders the header and step 4 indicator', () => {
      const { getByText } = render(<SelectScheduleScreen />);
      expect(getByText('Select Schedule')).toBeTruthy();
      expect(getByText('Step 4 of 6')).toBeTruthy();
    });

    it('shows "Preferred time" as the time section label', () => {
      const { getByText } = render(<SelectScheduleScreen />);
      expect(getByText('Preferred time')).toBeTruthy();
    });

    it('does not fire the available times query', () => {
      render(<SelectScheduleScreen />);
      expect(useAvailableTimesQuery).toHaveBeenCalledWith('', '');
    });
  });

  describe('with a pre-selected specialist', () => {
    beforeEach(() => {
      const { useRoute } = require('@react-navigation/native');
      (useRoute as jest.Mock).mockReturnValue({ params: { specialistId: 'sp-1' } });
      (useAppointmentsStore as unknown as jest.Mock).mockReturnValue({
        ...baseStore,
        bookingData: {
          specialist: {
            available_days: ['Monday', 'Tuesday'],
            meeting_channels: ['zoom'],
          },
        },
      });
    });

    it('shows "Available times" as the time section label', () => {
      const { getByText } = render(<SelectScheduleScreen />);
      expect(getByText('Available times')).toBeTruthy();
    });

    it('fires the available times query with the specialist id', () => {
      render(<SelectScheduleScreen />);
      expect(useAvailableTimesQuery).toHaveBeenCalledWith('sp-1', expect.any(String));
    });
  });
});
