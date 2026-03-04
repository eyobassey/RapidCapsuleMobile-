import {MMKV} from 'react-native-mmkv';

const mmkv = new MMKV({id: 'rc-storage'});

const KEYS = {
  TOKEN: 'rc_token',
  USER: 'rc_user',
  REMEMBER_ME: 'rc_remember',
} as const;

export const storage = {
  async getToken(): Promise<string | null> {
    return mmkv.getString(KEYS.TOKEN) ?? null;
  },

  async setToken(token: string): Promise<void> {
    mmkv.set(KEYS.TOKEN, token);
  },

  async removeToken(): Promise<void> {
    mmkv.delete(KEYS.TOKEN);
  },

  async getUser(): Promise<any | null> {
    const data = mmkv.getString(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async setUser(user: any): Promise<void> {
    mmkv.set(KEYS.USER, JSON.stringify(user));
  },

  async clear(): Promise<void> {
    mmkv.delete(KEYS.TOKEN);
    mmkv.delete(KEYS.USER);
    mmkv.delete(KEYS.REMEMBER_ME);
  },
};
