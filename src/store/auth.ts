import { create } from 'zustand';
import api from '../services/api';
import {
  signInWithGoogle,
  signInWithApple,
  signUpWithGoogle,
} from '../services/socialAuth.service';
import { storage } from '../utils/storage';
import { useOnboardingStore } from './onboarding';
import { useCurrencyStore } from './currency';

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

  login: (email: string, password: string, user_type?: string) => Promise<{ requires2FA: boolean }>;
  loginWithGoogle: () => Promise<void>;
  signupWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  verify2FA: (code: string, method: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
<<<<<<< HEAD
  forgotPassword: (email: string) => Promise<void>;
=======
  googleLogin: (idToken: string, user_type?: string) => Promise<void>;
  appleLogin: (identityToken: string, authorizationCode: string, user_type?: string, fullName?: {givenName?: string | null; familyName?: string | null} | null, email?: string | null) => Promise<void>;
>>>>>>> 2301e5f (Implement Google and Apple Sign-In authentication)
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  hydrate: () => Promise<void>;
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
    if (data.requires_2fa) {
      return { requires2FA: true };
    }
    const token = data.data || data.result || data.token;
    if (!token || typeof token !== 'string') {
      throw new Error(
        `Login succeeded but no token found. Response keys: ${Object.keys(data).join(', ')}`
      );
    }
    await get().setToken(token);
    await get().fetchUser();
    useCurrencyStore.getState().initCurrency();
    return { requires2FA: false };
  },

  verify2FA: async (code, _method) => {
    const res = await api.post('/auth/2fa/verify', { code });
    await get().setToken(res.data.data || res.data.result);
    await get().fetchUser();
    useCurrencyStore.getState().initCurrency();
  },

  loginWithGoogle: async () => {
    const token = await signInWithGoogle();
    await get().setToken(token);
    await get().fetchUser();
    useCurrencyStore.getState().initCurrency();
  },

  signupWithGoogle: async () => {
    const token = await signUpWithGoogle();
    await get().setToken(token);
    await get().fetchUser();
    useCurrencyStore.getState().initCurrency();
  },

  loginWithApple: async () => {
    const token = await signInWithApple();
    await get().setToken(token);
    await get().fetchUser();
    useCurrencyStore.getState().initCurrency();
  },

  signup: async (data) => {
    await api.post('/users', data);
  },

<<<<<<< HEAD
  forgotPassword: async (email) => {
    await api.post('/auth/forgot-password', { email });
=======
  googleLogin: async (idToken, user_type = 'Patient') => {
    const res = await api.post('/auth/google/alt-login', {token: idToken, user_type});
    const token = res.data?.data || res.data?.result || res.data?.token;
    if (!token || typeof token !== 'string') {
      throw new Error('Google login succeeded but no token received');
    }
    await get().setToken(token);
    await get().fetchUser();
    useCurrencyStore.getState().initCurrency();
  },

  appleLogin: async (identityToken, authorizationCode, user_type = 'Patient', fullName, email) => {
    const payload: any = {
      authorization: {
        id_token: identityToken,
        code: authorizationCode,
        state: user_type,
      },
    };
    if (fullName?.givenName || email) {
      payload.user = {
        email: email || '',
        name: {
          firstName: fullName?.givenName || '',
          lastName: fullName?.familyName || '',
        },
      };
    }
    const res = await api.post('/auth/apple', payload);
    const token = res.data?.data || res.data?.result || res.data?.token;
    if (!token || typeof token !== 'string') {
      throw new Error('Apple login succeeded but no token received');
    }
    await get().setToken(token);
    await get().fetchUser();
    useCurrencyStore.getState().initCurrency();
>>>>>>> 2301e5f (Implement Google and Apple Sign-In authentication)
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
    } catch (err: any) {
      const msg = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || 'Unknown';
      console.warn('fetchUser failed:', msg);
      set({ isLoading: false });
    }
  },

  logout: async () => {
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
}));
