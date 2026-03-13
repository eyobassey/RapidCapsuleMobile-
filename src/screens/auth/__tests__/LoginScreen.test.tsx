import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../../../store/auth';
import LoginScreen from '../LoginScreen';
import type { AuthStackParamList } from '../../../navigation/AuthStack';

jest.mock('../../../store/auth', () => {
  const actual = jest.requireActual('../../../store/auth');
  return {
    ...actual,
    useAuthStore: jest.fn(actual.useAuthStore),
  };
});

type NavParams = AuthStackParamList;

const Stack = createNativeStackNavigator<NavParams>();

function renderWithNav(initialRoute: keyof NavParams = 'Login') {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Otp" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits valid credentials and calls login', async () => {
    const loginMock = jest.fn().mockResolvedValue({ requires2FA: false });
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
      selector({ login: loginMock })
    );

    const { getByLabelText, getByText } = renderWithNav();

    fireEvent.changeText(getByLabelText('Email Address'), 'user@example.com');
    fireEvent.changeText(getByLabelText('Password'), 'StrongPass!1');

    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('user@example.com', 'StrongPass!1');
    });
  });

  it('navigates to Otp when requires2FA is true', async () => {
    const loginMock = jest.fn().mockResolvedValue({ requires2FA: true });
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
      selector({ login: loginMock })
    );

    const { getByLabelText, getByText, queryByText } = renderWithNav();

    fireEvent.changeText(getByLabelText('Email Address'), 'user@example.com');
    fireEvent.changeText(getByLabelText('Password'), 'StrongPass!1');

    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      // When Otp is shown, Login title should no longer be visible
      expect(queryByText('Welcome Back')).toBeNull();
    });
  });
});
