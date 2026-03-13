import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingDashboardScreen from '../OnboardingDashboardScreen';
import { useOnboardingStore } from '../../../store/onboarding';
import { useAuthStore } from '../../../store/auth';

jest.mock('../../../store/onboarding', () => {
  const actual = jest.requireActual('../../../store/onboarding');
  return {
    ...actual,
    useOnboardingStore: jest.fn(actual.useOnboardingStore),
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
  OnboardingDashboard: undefined;
};

const Stack = createNativeStackNavigator<ParamList>();

function renderWithNav() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="OnboardingDashboard" component={OnboardingDashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('OnboardingDashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile setup header and sections', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: null });
    (useOnboardingStore as unknown as jest.Mock).mockReturnValue({
      completedSections: {},
      progress: 0,
      summaryData: {},
      refreshFromUser: jest.fn(),
    });

    const { getByText } = renderWithNav();

    expect(getByText('Profile Setup')).toBeTruthy();
    expect(getByText('Required')).toBeTruthy();
    expect(getByText('Optional')).toBeTruthy();
  });
});
