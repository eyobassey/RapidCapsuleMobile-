import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConversationsListScreen from '../ConversationsListScreen';
import { useAuthStore } from '../../../store/auth';
import { useMessagingStore } from '../../../store/messaging';

jest.mock('../../../store/auth', () => {
  const actual = jest.requireActual('../../../store/auth');
  return {
    ...actual,
    useAuthStore: jest.fn(actual.useAuthStore),
  };
});

jest.mock('../../../store/messaging', () => {
  const actual = jest.requireActual('../../../store/messaging');
  return {
    ...actual,
    useMessagingStore: jest.fn(actual.useMessagingStore),
  };
});

type ParamList = {
  Conversations: undefined;
  NewConversation: undefined;
  Chat: { conversationId: string };
};

const Stack = createNativeStackNavigator<ParamList>();

function renderWithNav() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Conversations" component={ConversationsListScreen} />
        <Stack.Screen name="NewConversation" component={() => null} />
        <Stack.Screen name="Chat" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('ConversationsListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header and empty state title', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { _id: 'user-1' } });
    (useMessagingStore as unknown as jest.Mock).mockImplementation((selector: any) =>
      selector({
        conversations: [],
        hasMoreConversations: false,
        currentPage: 1,
        isLoading: false,
        presenceMap: {},
        fetchConversations: jest.fn(),
        computeUnreadTotal: jest.fn(),
      })
    );

    const { getByText } = renderWithNav();

    expect(getByText('Messages')).toBeTruthy();
    expect(getByText('No conversations yet')).toBeTruthy();
  });
});
