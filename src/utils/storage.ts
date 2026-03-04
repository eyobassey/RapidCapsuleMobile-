import {createMMKV} from 'react-native-mmkv';

let mmkv: ReturnType<typeof createMMKV>;
function getStore() {
  if (!mmkv) {
    mmkv = createMMKV({id: 'rc-storage'});
  }
  return mmkv;
}

const KEYS = {
  TOKEN: 'rc_token',
  USER: 'rc_user',
  REMEMBER_ME: 'rc_remember',
} as const;

export const storage = {
  async getToken(): Promise<string | null> {
    return getStore().getString(KEYS.TOKEN) ?? null;
  },

  async setToken(token: string): Promise<void> {
    getStore().set(KEYS.TOKEN, token);
  },

  async removeToken(): Promise<void> {
    getStore().remove(KEYS.TOKEN);
  },

  async getUser(): Promise<any | null> {
    const data = getStore().getString(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async setUser(user: any): Promise<void> {
    getStore().set(KEYS.USER, JSON.stringify(user));
  },

  async clear(): Promise<void> {
    getStore().remove(KEYS.TOKEN);
    getStore().remove(KEYS.USER);
    getStore().remove(KEYS.REMEMBER_ME);
  },
};
