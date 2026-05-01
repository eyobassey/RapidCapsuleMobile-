import { createMMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';

let mmkv: ReturnType<typeof createMMKV>;
function getStore() {
  if (!mmkv) {
    mmkv = createMMKV({ id: 'rc-storage' });
  }
  return mmkv;
}

const KEYS = {
  USER: 'rc_user',
  REMEMBER_ME: 'rc_remember',
  EKA_LANGUAGE: 'eka_language',
} as const;

const SECURE_KEY_TOKEN = 'rc.auth.token';
const SECURE_KEY_REFRESH = 'rc.auth.refresh_token';

const SECURE_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const storage = {
  // Secure token storage via Keychain (iOS) / Keystore (Android)
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SECURE_KEY_TOKEN, SECURE_OPTS);
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    if (token) {
      await SecureStore.setItemAsync(SECURE_KEY_TOKEN, token, SECURE_OPTS);
    }
  },

  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync(SECURE_KEY_TOKEN, SECURE_OPTS);
  },

  // Refresh token — also stored securely
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SECURE_KEY_REFRESH, SECURE_OPTS);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    if (token) {
      await SecureStore.setItemAsync(SECURE_KEY_REFRESH, token, SECURE_OPTS);
    }
  },

  async removeRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync(SECURE_KEY_REFRESH, SECURE_OPTS);
  },

  // Non-sensitive data stays in MMKV
  async getUser(): Promise<any | null> {
    const data = getStore().getString(KEYS.USER);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  async setUser(user: any): Promise<void> {
    if (user != null) {
      getStore().set(KEYS.USER, JSON.stringify(user));
    }
  },

  async getEkaLanguage(): Promise<string> {
    return getStore().getString(KEYS.EKA_LANGUAGE) ?? 'English';
  },

  async setEkaLanguage(lang: string): Promise<void> {
    getStore().set(KEYS.EKA_LANGUAGE, lang);
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(SECURE_KEY_TOKEN, SECURE_OPTS);
    await SecureStore.deleteItemAsync(SECURE_KEY_REFRESH, SECURE_OPTS);
    getStore().remove(KEYS.USER);
    getStore().remove(KEYS.REMEMBER_ME);
  },
};
