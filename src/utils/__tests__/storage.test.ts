import * as SecureStore from 'expo-secure-store';
import { storage } from '../storage';

const mmkvMock = require('react-native-mmkv');

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getToken', () => {
    it('returns token from secure store when it exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-jwt-token');

      const token = await storage.getToken();

      expect(token).toBe('test-jwt-token');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
        'rc.auth.token',
        expect.objectContaining({ keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY })
      );
    });

    it('returns null when no token exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const token = await storage.getToken();

      expect(token).toBeNull();
    });

    it('returns null when secure store throws', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('SecureStore error'));

      const token = await storage.getToken();

      expect(token).toBeNull();
    });
  });

  describe('setToken', () => {
    it('stores token with correct key and options', async () => {
      await storage.setToken('new-token');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'rc.auth.token',
        'new-token',
        expect.objectContaining({ keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY })
      );
    });

    it('does not store empty token', async () => {
      await storage.setToken('');

      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });
  });

  describe('removeToken', () => {
    it('deletes the token from secure store', async () => {
      await storage.removeToken();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('rc.auth.token', expect.any(Object));
    });
  });

  describe('getUser', () => {
    it('returns parsed user from MMKV', async () => {
      const mockUser = { _id: '123', email: 'test@test.com' };
      const store = mmkvMock.createMMKV();
      store.getString.mockReturnValue(JSON.stringify(mockUser));

      const user = await storage.getUser();

      expect(user).toEqual(mockUser);
    });

    it('returns null when no user data exists', async () => {
      const store = mmkvMock.createMMKV();
      store.getString.mockReturnValue(undefined);

      const user = await storage.getUser();

      expect(user).toBeNull();
    });
  });

  describe('setUser', () => {
    it('stores stringified user in MMKV', async () => {
      const mockUser = { _id: '123', email: 'test@test.com' };
      const store = mmkvMock.createMMKV();

      await storage.setUser(mockUser);

      expect(store.set).toHaveBeenCalledWith('rc_user', JSON.stringify(mockUser));
    });

    it('does not store null user', async () => {
      const store = mmkvMock.createMMKV();
      store.set.mockClear();

      await storage.setUser(null);

      expect(store.set).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('removes both tokens and MMKV data', async () => {
      const store = mmkvMock.createMMKV();

      await storage.clear();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('rc.auth.token', expect.any(Object));
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        'rc.auth.refresh_token',
        expect.any(Object)
      );
      expect(store.remove).toHaveBeenCalledWith('rc_user');
      expect(store.remove).toHaveBeenCalledWith('rc_remember');
    });
  });
});
