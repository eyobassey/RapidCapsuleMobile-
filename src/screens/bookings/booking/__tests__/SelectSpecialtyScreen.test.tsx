import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import SelectSpecialtyScreen from '../SelectSpecialtyScreen';
import { useAppointmentsStore } from '../../../../store/appointments';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
  SafeAreaView: require('react-native').View,
}));

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
}));

jest.mock('../../../../store/appointments', () => ({
  useAppointmentsStore: jest.fn(),
}));

const baseStore = {
  categories: [],
  recentCheckups: [],
  isLoading: false,
  fetchCategories: jest.fn(),
  fetchRecentCheckups: jest.fn(),
  setBookingData: jest.fn(),
};

describe('SelectSpecialtyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAppointmentsStore as jest.Mock).mockReturnValue(baseStore);
  });

  it('renders the header and step indicator', () => {
    const { getByText } = render(<SelectSpecialtyScreen />);
    expect(getByText('Select Specialty')).toBeTruthy();
    expect(getByText('Step 3 of 6')).toBeTruthy();
  });

  it('renders category tiles when categories are available', () => {
    (useAppointmentsStore as jest.Mock).mockReturnValue({
      ...baseStore,
      categories: [
        { _id: 'cat-1', name: 'Cardiology' },
        { _id: 'cat-2', name: 'Dermatology' },
      ],
    });
    const { getByText } = render(<SelectSpecialtyScreen />);
    expect(getByText('Cardiology')).toBeTruthy();
    expect(getByText('Dermatology')).toBeTruthy();
  });

  it('shows AI Suggestion tile when recentCheckups has conditions', () => {
    (useAppointmentsStore as jest.Mock).mockReturnValue({
      ...baseStore,
      categories: [{ _id: 'cat-1', name: 'Cardiology', professional_category: 'Specialist' }],
      recentCheckups: [
        {
          _id: 'hc-1',
          response: {
            data: {
              conditions: [{ common_name: 'chest pain', specialist: 'cardiologist' }],
            },
          },
        },
      ],
    });
    const { getByText } = render(<SelectSpecialtyScreen />);
    expect(getByText('AI Suggestion')).toBeTruthy();
  });

  it('hides AI Suggestion tile and shows checkup prompt when no recent checkups', async () => {
    (useAppointmentsStore as jest.Mock).mockReturnValue({
      ...baseStore,
      categories: [{ _id: 'cat-1', name: 'General Practice' }],
      recentCheckups: [],
    });
    const { queryByText, getByText } = render(<SelectSpecialtyScreen />);
    await waitFor(() => {
      expect(queryByText('AI Suggestion')).toBeNull();
      expect(getByText('Get better care with a quick health checkup')).toBeTruthy();
    });
  });

  it('does not show both AI tile and checkup prompt simultaneously', async () => {
    // Regression test for the bug where showSuggestion stayed true after checkups loaded
    (useAppointmentsStore as jest.Mock).mockReturnValue({
      ...baseStore,
      categories: [{ _id: 'cat-1', name: 'Cardiology' }],
      recentCheckups: [
        {
          _id: 'hc-1',
          response: { data: { conditions: [{ common_name: 'chest pain' }] } },
        },
      ],
    });
    const { queryByText } = render(<SelectSpecialtyScreen />);
    await waitFor(() => {
      expect(queryByText('Get better care with a quick health checkup')).toBeNull();
    });
  });

  it('stores booking data and navigates to SelectSchedule when a category is selected', () => {
    const setBookingData = jest.fn();
    (useAppointmentsStore as jest.Mock).mockReturnValue({
      ...baseStore,
      setBookingData,
      categories: [{ _id: 'cat-1', name: 'Cardiology', professional_category: 'Specialist' }],
    });
    const { getByText } = render(<SelectSpecialtyScreen />);
    fireEvent.press(getByText('Cardiology'));
    expect(setBookingData).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'cat-1', categoryName: 'Cardiology' })
    );
    expect(mockNavigate).toHaveBeenCalledWith('SelectSchedule');
  });
});
