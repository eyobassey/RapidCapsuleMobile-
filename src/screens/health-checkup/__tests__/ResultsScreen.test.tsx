import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ResultsScreen from '../ResultsScreen';
import { useHealthCheckupStore } from '../../../store/healthCheckup';
import { useAuthStore } from '../../../store/auth';

jest.mock('../../../store/healthCheckup', () => {
  const actual = jest.requireActual('../../../store/healthCheckup');
  return {
    ...actual,
    useHealthCheckupStore: jest.fn(actual.useHealthCheckupStore),
  };
});

jest.mock('../../../store/auth', () => {
  const actual = jest.requireActual('../../../store/auth');
  return {
    ...actual,
    useAuthStore: jest.fn(actual.useAuthStore),
  };
});

type ParamList = {
  HealthCheckupResults: undefined;
};

const Stack = createNativeStackNavigator<ParamList>();

function renderWithNav() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HealthCheckupResults" component={ResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('ResultsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders triage card and conditions list', () => {
    (useHealthCheckupStore as jest.Mock).mockReturnValue({
      checkupId: 'chk-1',
      conditions: [{ id: 'c1', name: 'Flu', probability: 0.8 }],
      triageLevel: 'consultation',
      hasEmergency: false,
      claudeSummary: null,
      summaryLoading: false,
      summaryCredits: null,
      fetchClaudeSummary: jest.fn(),
      generateClaudeSummary: jest.fn(),
      fetchSummaryStatus: jest.fn(),
      sex: 'female',
      age: 30,
      reset: jest.fn(),
    });
    (useAuthStore as jest.Mock).mockReturnValue({ user: null });

    const { getByText } = renderWithNav();

    expect(getByText('See a Doctor')).toBeTruthy();
    expect(getByText(/Possible Conditions/)).toBeTruthy();
    expect(getByText('Flu')).toBeTruthy();
  });

  it('renders self-care triage when no triage level is set', () => {
    (useHealthCheckupStore as jest.Mock).mockReturnValue({
      checkupId: 'chk-1',
      conditions: [],
      triageLevel: null,
      hasEmergency: false,
      claudeSummary: null,
      summaryLoading: false,
      summaryCredits: null,
      fetchClaudeSummary: jest.fn(),
      generateClaudeSummary: jest.fn(),
      fetchSummaryStatus: jest.fn(),
      sex: '',
      age: 0,
      reset: jest.fn(),
    });
    (useAuthStore as jest.Mock).mockReturnValue({ user: null });

    const { getByText } = renderWithNav();

    expect(getByText('Self-Care')).toBeTruthy();
  });
});
