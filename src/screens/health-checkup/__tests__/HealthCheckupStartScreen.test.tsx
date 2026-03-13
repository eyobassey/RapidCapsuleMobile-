import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HealthCheckupStartScreen from '../HealthCheckupStartScreen';
import { useHealthCheckupStore } from '../../../store/healthCheckup';

jest.mock('../../../store/healthCheckup', () => {
  const actual = jest.requireActual('../../../store/healthCheckup');
  return {
    ...actual,
    useHealthCheckupStore: jest.fn(actual.useHealthCheckupStore),
  };
});

type ParamList = {
  HealthCheckupStart: undefined;
  HealthCheckupPatientInfo: undefined;
  HealthCheckupHistory: undefined;
  HealthCheckupDetail: { id: string };
};

const Stack = createNativeStackNavigator<ParamList>();

function renderWithNav() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HealthCheckupStart" component={HealthCheckupStartScreen} />
        <Stack.Screen name="HealthCheckupPatientInfo" component={() => null} />
        <Stack.Screen name="HealthCheckupHistory" component={() => null} />
        <Stack.Screen name="HealthCheckupDetail" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('HealthCheckupStartScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches recent history on mount', async () => {
    const fetchHistory = jest.fn();
    (useHealthCheckupStore as unknown as jest.Mock).mockReturnValue({
      history: [],
      fetchHistory,
      reset: jest.fn(),
    });

    renderWithNav();

    await waitFor(() => {
      expect(fetchHistory).toHaveBeenCalledWith({ limit: 5 });
    });
  });

  it('renders hero and start button without crashing', () => {
    (useHealthCheckupStore as unknown as jest.Mock).mockReturnValue({
      history: [],
      fetchHistory: jest.fn(),
      reset: jest.fn(),
    });

    const { getByText } = renderWithNav();

    expect(getByText('AI Health Assessment')).toBeTruthy();
    expect(getByText('Start New Checkup')).toBeTruthy();
  });
});
