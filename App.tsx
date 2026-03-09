import './global.css';
import React from 'react';
import {StatusBar, Text} from 'react-native';

// Force Text module initialization to prevent ReadOnlyText class error (RN 0.84)
// See: https://github.com/facebook/react-native/issues/54832
Text; // eslint-disable-line no-unused-expressions
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PaystackProvider} from 'react-native-paystack-webview';
import RootNavigator from './src/navigation/RootNavigator';
import ENV from './src/config/env';
import ErrorBoundary from './src/components/ui/ErrorBoundary';

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <PaystackProvider publicKey={ENV.PAYSTACK_PUBLIC_KEY}>
        <SafeAreaProvider>
          <ErrorBoundary>
            <StatusBar barStyle="light-content" backgroundColor="#151c2c" />
            <RootNavigator />
          </ErrorBoundary>
        </SafeAreaProvider>
      </PaystackProvider>
    </GestureHandlerRootView>
  );
}
