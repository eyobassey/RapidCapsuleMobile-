import { create } from 'zustand';
import { Passkey } from 'react-native-passkey';
import api from '../services/api';
import { securityService } from '../services/security.service';
import {
  signInWithApple,
  signInWithGoogle,
  signUpWithGoogle,
} from '../services/socialAuth.service';
import { identifyOneSignalUser, clearOneSignalUser } from '../services/onesignal.service';
import { storage } from '../utils/storage';
import { useCurrencyStore } from './currency';
import { useOnboardingStore } from './onboarding';

interface UserProfile {
  first_name: string;
  last_name: string;
  phone_number?: string;
  phone?: { country_code?: string; number?: string };
  date_of_birth?: string;
  gender?: string;
  profile_image?: string;
  profile_photo?: string;
  marital_status?: string;
  occupation?: string;
  blood_type?: string;
  genotype?: string;
  height?: { value?: number; unit?: string };
  weight?: { value?: number; unit?: string };
  basic_health_info?: {
    height?: { value?: number; unit?: string };
    weight?: { value?: number; unit?: string };
  };
  contact?: {
    phone?: { country_code?: string; number?: string };
    email?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    country?: string;
    zip_code?: string;
  };
  address1?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
}

interface User {
  _id: string;
  email: string;
  user_type: string;
  profile: UserProfile;
  emergency_contacts?: any[];
  dependants?: any[];
  delivery_addresses?: any[];
  allergies?: any;
  medical_history?: any;
  pre_existing_conditions?: any[];
  device_integration?: any;
  wallet?: any;
  patient_preferences?: any;
  onboarding_completed?: boolean;
  is_email_verified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;

  login: (
    email: string,
    password: string,
    user_type?: string
  ) => Promise<{ requires2FA: boolean; method?: string }>;
  loginWithGoogle: () => Promise<void>;
  signupWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  loginWithPasskey: (email: string) => Promise<void>;
  verify2FA: (code: string, method: string, email: string) => Promise<void>;
  resendOTP: (email: string, method?: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  setToken: (token: string) => Promise<void>;
  hydrate: () => Promise<void>;
  bootstrapForApp: (isCancelled?: () => boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  needsOnboarding: false,

  login: async (email, password, user_type = 'Patient') => {
    const res = await api.post('/auth/login', { email, password, user_type });
    const data = res.data;
    const payload = data.data || data.result;

    // Backend now returns { token, refresh_token } on successful login,
    // or an object without token when 2FA is triggered, or a plain JWT string (legacy).
    if (payload && typeof payload === 'object' && payload.token) {
      // Successful login — object with token (and optional refresh_token)
      await get().setToken(payload.token);
      if (payload.refresh_token) {
        await storage.setRefreshToken(payload.refresh_token);
      }
    } else if (payload && typeof payload === 'string') {
      // Legacy: plain JWT string
      await get().setToken(payload);
    } else {
      // No token present — 2FA is required
      const msg = (data.message || '').toLowerCase();
      const method = msg.includes('phone') ? 'sms' : msg.includes('auth app') ? 'totp' : 'email';
      return { requires2FA: true, method };
    }
    await get().fetchUser();
    useCurrencyStore.getState().initCurrency();
    return { requires2FA: false };
  },

  verify2FA: async (code, method, email) => {
    let res;
    if (method === 'sms') {
      res = await api.post('/auth/otp/phone/verify', { code, email });
    } else if (method === 'totp') {
      res = await api.post('/auth/2fa/verify', { code, email });
    } else {
      res = await api.post('/auth/otp/verify', { token: code, email });
    }
    const result = res.data?.result || res.data?.data;
    const jwtToken = typeof result === 'string' ? result : result?.token;
    const refreshToken = typeof result === 'object' ? result?.refresh_token : undefined;
    await get().setToken(jwtToken);
    if (refreshToken) {
      await storage.setRefreshToken(refreshToken);
    }
    await get().fetchUser();
    useCurrencyStore.getState().initCurrency();
  },

  resendOTP: async (email, method = 'email') => {
    if (method === 'sms') {
      await api.post('/auth/resend-phone-otp', { email });
    } else {
      await api.post('/auth/resend-email-otp', { email });
    }
  },

  loginWithGoogle: async () => {
    const result = await signInWithGoogle();
    await get().setToken(result.token);
    if (result.refresh_token) {
      await storage.setRefreshToken(result.refresh_token);
    }
    await get().fetchUser();
    useCurrencyStore.getState().initCurrency();
  },

  signupWithGoogle: async () => {
    const result = await signUpWithGoogle();
    await get().setToken(result.token);
    if (result.refresh_token) {
      await storage.setRefreshToken(result.refresh_token);
    }
    await get().fetchUser();
    useCurrencyStore.getState().initCurrency();
  },

  loginWithApple: async () => {
    const result = await signInWithApple();
    await get().setToken(result.token);
    if (result.refresh_token) {
      await storage.setRefreshToken(result.refresh_token);
    }
    await get().fetchUser();
    useCurrencyStore.getState().initCurrency();
  },

  loginWithPasskey: async (email: string) => {
    const options = await securityService.getPasskeyLoginOptions();
    const credential = await Passkey.get(options);
    const result = await securityService.verifyPasskeyLogin(email, credential);
    await get().setToken(result.token);
    if (result.refreshToken) {
      await storage.setRefreshToken(result.refreshToken);
    }
    await get().fetchUser();
    useCurrencyStore.getState().initCurrency();
  },

  signup: async (data) => {
    await api.post('/users', data);
  },

  forgotPassword: async (email) => {
    await api.post('/auth/forgot-password', { email });
  },

  fetchUser: async () => {
    try {
      const res = await api.get('/users/me');
      const user = res.data.data || res.data.result;

      // Sync onboarding store with latest user data
      useOnboardingStore.getState().refreshFromUser(user);

      // Required sections: personalDetails + addressEmergency
      const profile = user?.profile;
      const hasPersonal = !!(profile?.first_name && profile?.last_name && profile?.date_of_birth);
      const hasEmergency = !!(user?.emergency_contacts?.length > 0);
      const needsOnboarding = !hasPersonal || !hasEmergency;

      await storage.setUser(user);
      set({ user, isAuthenticated: true, needsOnboarding, isLoading: false });

      // Associate this user with their OneSignal push subscription
      if (user?._id) {
        identifyOneSignalUser(user._id);
      }
    } catch (err: any) {
      const msg = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || 'Unknown';
      console.warn('fetchUser failed:', msg);
      set({ isLoading: false });
    }
  },

  logout: async () => {
    // Attempt to revoke the server session; don't block logout on failure.
    try {
      const refreshToken = await storage.getRefreshToken();
      await api.post('/auth/logout', refreshToken ? { refresh_token: refreshToken } : {});
    } catch {
      // Server call failed — continue with local cleanup.
    }
    clearOneSignalUser();
    await storage.clear();
    set({ user: null, token: null, isAuthenticated: false, needsOnboarding: false });
  },

  deleteAccount: async (password) => {
    await api.delete('/users/me', { data: { password } });
    // Clear all local auth state — server has already invalidated all sessions.
    await storage.clear();
    set({ user: null, token: null, isAuthenticated: false, needsOnboarding: false });
  },

  setToken: async (token) => {
    await storage.setToken(token);
    set({ token });
  },

  hydrate: async () => {
    const token = await storage.getToken();
    if (token) {
      set({ token });
      await get().fetchUser();
      useCurrencyStore.getState().initCurrency();
    } else {
      set({ isLoading: false });
    }
  },

  bootstrapForApp: async (isCancelled) => {
    if (__DEV__) {
      try {
        // Keep all E2E bypass data out of production bundles.

        const mod =
          require('../testing/e2eAuthBootstrap') as typeof import('../testing/e2eAuthBootstrap');
        const skipAuth = await mod.shouldSkipAuthForE2E();
        if (isCancelled?.()) return;
        if (skipAuth) {
          set(mod.getE2EAuthState());
          useCurrencyStore.getState().initCurrency();
          return;
        }
      } catch {
        // ignore and continue to normal hydrate
      }
    }

    await get().hydrate();
  },
}));
