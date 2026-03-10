/**
 * Social auth (Google, Apple) - obtains tokens and exchanges with backend
 */
import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth, appleAuthAndroid } from '@invertase/react-native-apple-authentication';
import api from './api';
import ENV from '../config/env';

/** User cancelled the sign-in flow - no alert should be shown */
export const USER_CANCELLED = 'USER_CANCELLED';

function isAppleCancelError(e: unknown): boolean {
  const code = (e as { code?: number | string })?.code;
  const msg = e instanceof Error ? e.message : String(e);
  return (
    code === 1001 ||
    code === '1001' ||
    (typeof msg === 'string' && (msg.includes('1001') || msg.includes('cancel')))
  );
}

/** Check if Apple Sign-In is available (iOS 13+, or Android with config) */
export function isAppleAuthAvailable(): boolean {
  if (Platform.OS === 'ios') return true;
  if (Platform.OS === 'android') return !!appleAuthAndroid?.isSupported;
  return false;
}

/**
 * Sign in with Google and exchange token with backend
 */
export async function signInWithGoogle(): Promise<string> {
  if (Platform.OS === 'android' && !ENV.GOOGLE_WEB_CLIENT_ID) {
    throw new Error(
      'Google Sign-In requires GOOGLE_WEB_CLIENT_ID in env. Add your Web client ID from Google Cloud Console.'
    );
  }

  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  let res;
  try {
    res = await GoogleSignin.signIn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes('cancel')) {
      throw new Error(USER_CANCELLED);
    }
    throw e;
  }
  if (res.type !== 'success' || !res.data) {
    if (res.type === 'cancelled') {
      throw new Error(USER_CANCELLED);
    }
    throw new Error('Google Sign-In failed');
  }

  const { idToken } = await GoogleSignin.getTokens();
  if (!idToken) {
    throw new Error('No ID token from Google');
  }

  const apiRes = await api.post('/auth/google/alt-login', { idToken });
  const token = apiRes.data?.data || apiRes.data?.result || apiRes.data?.token;
  if (!token || typeof token !== 'string') {
    throw new Error('Backend did not return auth token');
  }

  return token;
}

/**
 * Sign in with Apple and exchange token with backend
 */
export async function signInWithApple(): Promise<string> {
  if (Platform.OS === 'ios') {
    let requestResponse;
    try {
      requestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });
    } catch (e) {
      if (isAppleCancelError(e)) {
        throw new Error(USER_CANCELLED);
      }
      throw e;
    }

    const idToken = requestResponse.identityToken;
    if (!idToken) {
      throw new Error('No identity token from Apple');
    }

    const userPayload =
      requestResponse.fullName?.givenName || requestResponse.email
        ? {
            email: requestResponse.email ?? undefined,
            fullName: requestResponse.fullName
              ? {
                  givenName: requestResponse.fullName.givenName ?? undefined,
                  familyName: requestResponse.fullName.familyName ?? undefined,
                }
              : undefined,
          }
        : undefined;

    const apiRes = await api.post('/auth/apple', {
      id_token: idToken,
      user: userPayload,
    });
    const token = apiRes.data?.data || apiRes.data?.result || apiRes.data?.token;
    if (!token || typeof token !== 'string') {
      throw new Error('Backend did not return auth token');
    }

    return token;
  }

  if (Platform.OS === 'android' && appleAuthAndroid?.isSupported) {
    // Android requires configure() before signIn - needs Service ID, redirect URI from Apple dev console
    const rawNonce = String(Math.random()).slice(2);
    const state = String(Math.random()).slice(2);

    appleAuthAndroid.configure({
      clientId: ENV.APPLE_CLIENT_ID,
      redirectUri: ENV.APPLE_REDIRECT_URI,
      responseType: appleAuthAndroid.ResponseType.ALL,
      scope: appleAuthAndroid.Scope.ALL,
      nonce: rawNonce,
      state,
    });

    let response;
    try {
      response = await appleAuthAndroid.signIn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes('cancel')) {
        throw new Error(USER_CANCELLED);
      }
      throw e;
    }
    const idToken = response.id_token;
    if (!idToken) {
      throw new Error('No identity token from Apple');
    }

    const apiRes = await api.post('/auth/apple', { id_token: idToken });
    const token = apiRes.data?.data || apiRes.data?.result || apiRes.data?.token;
    if (!token || typeof token !== 'string') {
      throw new Error('Backend did not return auth token');
    }

    return token;
  }

  throw new Error('Apple Sign-In is not available on this device');
}
