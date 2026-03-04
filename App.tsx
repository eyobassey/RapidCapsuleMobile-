import './global.css';
import React from 'react';
import {StatusBar, Text} from 'react-native';

// Force Text module initialization to prevent ReadOnlyText class error (RN 0.84)
// See: https://github.com/facebook/react-native/issues/54832
Text; // eslint-disable-line no-unused-expressions
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#151c2c" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
