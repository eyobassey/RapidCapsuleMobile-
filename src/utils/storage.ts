import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@rc_token',
  USER: '@rc_user',
  REMEMBER_ME: '@rc_remember',
} as const;

export const storage = {
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.TOKEN);
  },

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
  },

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.TOKEN);
  },

  async getUser(): Promise<any | null> {
    const data = await AsyncStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.TOKEN);
    await AsyncStorage.removeItem(KEYS.USER);
    await AsyncStorage.removeItem(KEYS.REMEMBER_ME);
  },
};
