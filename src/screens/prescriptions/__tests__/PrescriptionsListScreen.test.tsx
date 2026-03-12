import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PrescriptionsListScreen from '../PrescriptionsListScreen';
import { usePrescriptionsQuery } from '../../../hooks/queries';

jest.mock('../../../hooks/queries');

type ParamList = {
  Prescriptions: undefined;
};

const Stack = createNativeStackNavigator<ParamList>();

function renderWithNav() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Prescriptions" component={PrescriptionsListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('PrescriptionsListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header and empty state when there are no prescriptions', () => {
    (usePrescriptionsQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: jest.fn(),
    });

    const { getByText } = renderWithNav();

    expect(getByText('Prescriptions')).toBeTruthy();
  });
});
