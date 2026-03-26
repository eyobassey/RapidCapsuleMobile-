import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ConsentScreen from '../ConsentScreen';

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

describe('ConsentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all 4 consent items', () => {
    const { getByText } = render(<ConsentScreen />);
    expect(getByText('Telemedicine Consent')).toBeTruthy();
    expect(getByText('Privacy Policy')).toBeTruthy();
    expect(getByText('Doctor Matching Data Sharing')).toBeTruthy();
    expect(getByText('Prescription Verification')).toBeTruthy();
  });

  it('renders the step indicator and header', () => {
    const { getByText } = render(<ConsentScreen />);
    expect(getByText('Agreement & Consent')).toBeTruthy();
    expect(getByText('Step 2 of 6')).toBeTruthy();
  });

  it('shows REQUIRED badge on each item', () => {
    const { getAllByText } = render(<ConsentScreen />);
    expect(getAllByText('REQUIRED')).toHaveLength(4);
  });

  it('does not navigate when Continue is pressed without checking all items', () => {
    const { getByText } = render(<ConsentScreen />);
    fireEvent.press(getByText('Continue'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to SelectSpecialty after selecting all items', async () => {
    const { getByText } = render(<ConsentScreen />);
    fireEvent.press(getByText('Select all agreements'));
    fireEvent.press(getByText('Continue'));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('SelectSpecialty', expect.any(Object));
    });
  });

  it('navigates with no params when there is no linked health checkup', async () => {
    const { getByText } = render(<ConsentScreen />);
    fireEvent.press(getByText('Select all agreements'));
    fireEvent.press(getByText('Continue'));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('SelectSpecialty', {});
    });
  });

  it('opens the detail sheet when "View details" is pressed', async () => {
    const { getAllByText, getByText } = render(<ConsentScreen />);
    fireEvent.press(getAllByText('View details')[0]);
    await waitFor(() => {
      expect(getByText('I Understand & Accept')).toBeTruthy();
    });
  });

  it('closes the detail sheet and checks the item after accepting', async () => {
    const { getAllByText, getByText, queryByText } = render(<ConsentScreen />);
    fireEvent.press(getAllByText('View details')[0]);
    await waitFor(() => expect(getByText('I Understand & Accept')).toBeTruthy());
    fireEvent.press(getByText('I Understand & Accept'));
    await waitFor(() => {
      expect(queryByText('I Understand & Accept')).toBeNull();
    });
  });
});
