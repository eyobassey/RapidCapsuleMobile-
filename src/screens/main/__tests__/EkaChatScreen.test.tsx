import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EkaChatScreen from '../EkaChatScreen';
import { useEkaStore } from '../../../store/eka';
import { useAuthStore } from '../../../store/auth';

jest.mock('../../../store/eka', () => {
  const actual = jest.requireActual('../../../store/eka');
  return {
    ...actual,
    useEkaStore: jest.fn(actual.useEkaStore),
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
  EkaChat: undefined;
};

const Stack = createNativeStackNavigator<ParamList>();

function renderWithNav() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="EkaChat" component={EkaChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('EkaChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mounts without crashing with minimal store state', () => {
    (useAuthStore as jest.Mock).mockReturnValue({ user: null });

    (useEkaStore as jest.Mock).mockImplementation((selector: any) =>
      selector({
        messages: [],
        isStreaming: false,
        checkupQuestion: null,
        suggestions: [],
        loadingTool: null,
        conversations: [],
        currentConversationId: null,
        language: 'en',
        sendMessage: jest.fn(),
        answerCheckupQuestion: jest.fn(),
        newConversation: jest.fn(),
        loadConversation: jest.fn(),
        fetchConversations: jest.fn(),
        deleteConversation: jest.fn(),
        renameConversation: jest.fn(),
        setLanguage: jest.fn(),
        initLanguage: jest.fn(),
        artifacts: [],
        activeArtifact: null,
        setActiveArtifact: jest.fn(),
        clearArtifacts: jest.fn(),
      })
    );

    renderWithNav();
  });
});
