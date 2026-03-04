import {create} from 'zustand';
import api from '../services/api';
import {storage} from '../utils/storage';

interface User {
  _id: string;
  email: string;
  user_type: string;
  profile: {
    first_name: string;
    last_name: string;
    phone_number?: string;
    date_of_birth?: string;
    gender?: string;
    profile_image?: string;
  };
  emergency_contacts?: any[];
  is_email_verified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;

  login: (email: string, password: string, user_type?: string) => Promise<{requires2FA: boolean}>;
  verify2FA: (code: string, method: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
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
    const res = await api.post('/auth/login', {email, password, user_type});
    const data = res.data;
    if (data.requires_2fa) {
      return {requires2FA: true};
    }
    await get().setToken(data.result);
    await get().fetchUser();
    return {requires2FA: false};
  },

  verify2FA: async (code, _method) => {
    const res = await api.post('/auth/2fa/verify', {code});
    await get().setToken(res.data.result);
    await get().fetchUser();
  },

  signup: async data => {
    await api.post('/users', data);
  },

  fetchUser: async () => {
    try {
      const res = await api.get('/users/me');
      const user = res.data.result;
      const needsOnboarding = false; // TODO: restore !user?.profile?.emergency_contacts?.length
      await storage.setUser(user);
      set({user, isAuthenticated: true, needsOnboarding, isLoading: false});
    } catch (err: any) {
      const msg = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || 'Unknown';
      console.warn('fetchUser failed:', msg);
      set({isLoading: false});
    }
  },

  logout: async () => {
    await storage.clear();
    set({user: null, token: null, isAuthenticated: false, needsOnboarding: false});
  },

  setToken: async token => {
    await storage.setToken(token);
    set({token});
  },

  hydrate: async () => {
    const token = await storage.getToken();
    if (token) {
      set({token});
      await get().fetchUser();
    } else {
      set({isLoading: false});
    }
  },
}));
