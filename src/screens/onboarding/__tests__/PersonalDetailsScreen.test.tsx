import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PersonalDetailsScreen from '../PersonalDetailsScreen';
import { useAuthStore } from '../../../store/auth';
import { useOnboardingStore } from '../../../store/onboarding';

jest.mock('../../../store/auth', () => {
  const actual = jest.requireActual('../../../store/auth');
  return {
    ...actual,
    useAuthStore: jest.fn(actual.useAuthStore),
  };
});

jest.mock('../../../store/onboarding', () => {
  const actual = jest.requireActual('../../../store/onboarding');
  return {
    ...actual,
    useOnboardingStore: jest.fn(actual.useOnboardingStore),
  };
});

type ParamList = {
  PersonalDetails: undefined;
};

const Stack = createNativeStackNavigator<ParamList>();

function renderWithNav() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('PersonalDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields without crashing', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      user: null,
      fetchUser: jest.fn(),
    });
    (useOnboardingStore as jest.Mock).mockReturnValue({
      clearDraft: jest.fn(),
    });

    const { getByText } = renderWithNav();

    expect(getByText('Personal Details')).toBeTruthy();
  });
});
