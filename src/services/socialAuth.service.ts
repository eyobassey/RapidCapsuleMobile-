/**
 * Social auth (Google, Apple) - obtains tokens and exchanges with backend
 */
import { appleAuth, appleAuthAndroid } from '@invertase/react-native-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import ENV from '../config/env';
import api from './api';

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

  const apiRes = await api.post('/auth/google/alt-login', {
    token: idToken,
    user_type: 'Patient',
  });
  const token = apiRes.data?.data || apiRes.data?.result || apiRes.data?.token;
  if (!token || typeof token !== 'string') {
    throw new Error('Backend did not return auth token');
  }

  return token;
}

/**
 * Sign up with Google - payload { token, user_type: "Patient" }
 */
export async function signUpWithGoogle(): Promise<string> {
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

  const apiRes = await api.post('/auth/google/alt-login', {
    token: idToken,
    user_type: 'Patient',
  });
  const token = apiRes.data?.data || apiRes.data?.result || apiRes.data?.token;
  if (!token || typeof token !== 'string') {
    throw new Error('Backend did not return auth token');
  }

  return token;
}

/** Backend Apple auth payload format */
interface AppleAuthPayload {
  authorization: {
    id_token: string;
    code: string;
    state: string;
  };
  user?: {
    email?: string;
    name?: { firstName?: string; lastName?: string };
  };
}

function buildAppleAuthPayload(params: {
  idToken: string;
  code: string;
  state: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): AppleAuthPayload {
  const { idToken, code, state, email, firstName, lastName } = params;
  const payload: AppleAuthPayload = {
    authorization: { id_token: idToken, code, state },
  };
  if (email || firstName || lastName) {
    payload.user = {};
    if (email) payload.user.email = email;
    if (firstName || lastName) {
      payload.user.name = {
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
      };
    }
  }
  return payload;
}

/**
 * Sign in with Apple and exchange token with backend
 */
export async function signInWithApple(): Promise<string> {
  const STATE = 'Patient';

  if (Platform.OS === 'ios') {
    let requestResponse;
    try {
      requestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
        state: STATE,
      });
    } catch (e) {
      if (isAppleCancelError(e)) {
        throw new Error(USER_CANCELLED);
      }
      throw e;
    }

    const idToken = requestResponse.identityToken;
    const code = requestResponse.authorizationCode;
    if (!idToken || !code) {
      throw new Error('No identity token or authorization code from Apple');
    }

    const payload = buildAppleAuthPayload({
      idToken,
      code,
      state: requestResponse.state ?? STATE,
      email: requestResponse.email,
      firstName: requestResponse.fullName?.givenName,
      lastName: requestResponse.fullName?.familyName,
    });

    const apiRes = await api.post('/auth/apple', payload);
    const token = apiRes.data?.data || apiRes.data?.result || apiRes.data?.token;
    if (!token || typeof token !== 'string') {
      throw new Error('Backend did not return auth token');
    }

    return token;
  }

  if (Platform.OS === 'android' && appleAuthAndroid?.isSupported) {
    appleAuthAndroid.configure({
      clientId: ENV.APPLE_CLIENT_ID,
      redirectUri: ENV.APPLE_REDIRECT_URI,
      responseType: appleAuthAndroid.ResponseType.ALL,
      scope: appleAuthAndroid.Scope.ALL,
      nonce: String(Math.random()).slice(2),
      state: STATE,
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
    const code = response.code;
    if (!idToken || !code) {
      throw new Error('No identity token or authorization code from Apple');
    }

    const payload = buildAppleAuthPayload({
      idToken,
      code,
      state: response.state,
      email: response.user?.email,
      firstName: response.user?.name?.firstName,
      lastName: response.user?.name?.lastName,
    });

    const apiRes = await api.post('/auth/apple', payload);
    const token = apiRes.data?.data || apiRes.data?.result || apiRes.data?.token;
    if (!token || typeof token !== 'string') {
      throw new Error('Backend did not return auth token');
    }

    return token;
  }

  throw new Error('Apple Sign-In is not available on this device');
}
