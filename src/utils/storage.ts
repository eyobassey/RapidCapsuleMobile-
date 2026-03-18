import { createMMKV } from 'react-native-mmkv';
import * as Keychain from 'react-native-keychain';

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

const KEYCHAIN_SERVICE = 'com.rapidcapsule.auth';
const KEYCHAIN_REFRESH_SERVICE = 'com.rapidcapsule.refresh';

export const storage = {
  // Secure token storage via Keychain/Keystore
  async getToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_SERVICE,
      });
      return credentials ? credentials.password : null;
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    if (token) {
      await Keychain.setGenericPassword('token', token, {
        service: KEYCHAIN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }
  },

  async removeToken(): Promise<void> {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  },

  // Refresh token — also stored in Keychain (secure)
  async getRefreshToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: KEYCHAIN_REFRESH_SERVICE,
      });
      return credentials ? credentials.password : null;
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    if (token) {
      await Keychain.setGenericPassword('refresh_token', token, {
        service: KEYCHAIN_REFRESH_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }
  },

  async removeRefreshToken(): Promise<void> {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_REFRESH_SERVICE });
  },

  // Non-sensitive data stays in MMKV
  async getUser(): Promise<any | null> {
    const data = getStore().getString(KEYS.USER);
    return data ? JSON.parse(data) : null;
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
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
    await Keychain.resetGenericPassword({ service: KEYCHAIN_REFRESH_SERVICE });
    getStore().remove(KEYS.USER);
    getStore().remove(KEYS.REMEMBER_ME);
  },
};
