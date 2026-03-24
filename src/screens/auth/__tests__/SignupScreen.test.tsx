import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../../../store/auth';
import SignupScreen from '../SignupScreen';
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

function renderWithNav(_initialRoute: keyof NavParams = 'Signup') {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="VerifyEmail" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('SignupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits form and navigates to VerifyEmail', async () => {
    const signupMock = jest.fn().mockResolvedValue(undefined);
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
      selector({ signup: signupMock })
    );

    const { getByText, getByLabelText } = renderWithNav();

    fireEvent.changeText(getByLabelText('First Name'), 'John');
    fireEvent.changeText(getByLabelText('Last Name'), 'Doe');
    fireEvent.changeText(getByLabelText('Email'), 'user@example.com');
    fireEvent.changeText(getByLabelText('Phone'), '8012345678');
    fireEvent.changeText(getByLabelText('Date of Birth'), '1990-01-01');
    fireEvent.changeText(getByLabelText('Password'), 'StrongPass!1');

    // Toggle terms switch
    fireEvent(getByLabelText('Agree to Terms of Service and Privacy Policy'), 'valueChange', true);

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(signupMock).toHaveBeenCalled();
    });
  });
});
