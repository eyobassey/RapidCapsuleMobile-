import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfileScreen from '../ProfileScreen';
import { useAuthStore } from '../../../store/auth';
import { useCurrencyStore } from '../../../store/currency';

jest.mock('../../../store/auth', () => {
  const actual = jest.requireActual('../../../store/auth');
  return {
    ...actual,
    useAuthStore: jest.fn(actual.useAuthStore),
  };
});

jest.mock('../../../store/currency', () => {
  const actual = jest.requireActual('../../../store/currency');
  return {
    ...actual,
    useCurrencyStore: jest.fn(actual.useCurrencyStore),
  };
});

type ParamList = {
  Profile: undefined;
};

const Stack = createNativeStackNavigator<ParamList>();

function renderWithNav() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens currency modal when Currency row is pressed', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: null,
      logout: jest.fn(),
    });

    (useCurrencyStore as unknown as jest.Mock).mockReturnValue({
      currencyCode: 'USD',
      setCurrency: jest.fn(),
    });

    const { getByText } = renderWithNav();

    fireEvent.press(getByText('Display Currency'));

    expect(getByText('Select Currency')).toBeTruthy();
  });
});
