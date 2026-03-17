import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../../../store/auth';
import OtpScreen from '../OtpScreen';
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

function renderWithNav(initialParams?: Partial<NavParams['Otp']>) {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Otp" component={OtpScreen} initialParams={initialParams as any} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('OtpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls verify2FA when 6-digit code is entered and button pressed', async () => {
    const verifyMock = jest.fn().mockResolvedValue(undefined);
    const resendMock = jest.fn().mockResolvedValue(undefined);
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) =>
      selector({ verify2FA: verifyMock, resendOTP: resendMock })
    );

    const { getByText, getAllByDisplayValue } = renderWithNav({ email: 'user@example.com' });

    // OtpInput renders multiple TextInput fields with single characters; we can
    // just find them by placeholder or use getAllByA11yState if customized.
    const cells = getAllByDisplayValue('');
    const code = '123456';
    code.split('').forEach((digit, idx) => {
      fireEvent.changeText(cells[idx], digit);
    });

    const button = getByText('Verify Code');
    fireEvent.press(button);

    await waitFor(() => {
      expect(verifyMock).toHaveBeenCalledWith('123456', 'email', 'user@example.com');
    });
  });
});
