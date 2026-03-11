import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Appearance, StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaystackProvider } from 'react-native-paystack-webview';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import ErrorBoundary from './src/components/ui/ErrorBoundary';
import OfflineBanner from './src/components/ui/OfflineBanner';
import ENV from './src/config/env';
import { queryClient } from './src/config/queryClient';
import RootNavigator from './src/navigation/RootNavigator';

Appearance.setColorScheme('dark');

if (ENV.GOOGLE_WEB_CLIENT_ID) {
  GoogleSignin.configure({
    webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
    // Use iOS client when set; fallback to web avoids configure crash but causes "Custom scheme" error on sign-in
    iosClientId: ENV.GOOGLE_IOS_CLIENT_ID || ENV.GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
  });
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <PaystackProvider publicKey={ENV.PAYSTACK_PUBLIC_KEY}>
          <SafeAreaProvider>
            <ErrorBoundary>
              <StatusBar barStyle="light-content" backgroundColor="#151c2c" />
              <OfflineBanner />
              <RootNavigator />
            </ErrorBoundary>
          </SafeAreaProvider>
        </PaystackProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
