import * as Keychain from 'react-native-keychain';
import {storage} from '../storage';

// Access the MMKV mock internals
const mmkvMock = require('react-native-mmkv');

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getToken', () => {
    it('returns token from keychain when credentials exist', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        password: 'test-jwt-token',
      });

      const token = await storage.getToken();

      expect(token).toBe('test-jwt-token');
      expect(Keychain.getGenericPassword).toHaveBeenCalledWith({
        service: 'com.rapidcapsule.auth',
      });
    });

    it('returns null when no credentials exist', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

      const token = await storage.getToken();

      expect(token).toBeNull();
    });

    it('returns null when keychain throws an error', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockRejectedValue(
        new Error('Keychain error'),
      );

      const token = await storage.getToken();

      expect(token).toBeNull();
    });
  });

  describe('setToken', () => {
    it('stores token in keychain with correct options', async () => {
      await storage.setToken('new-token');

      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'token',
        'new-token',
        {
          service: 'com.rapidcapsule.auth',
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        },
      );
    });

    it('does not store empty token', async () => {
      await storage.setToken('');

      expect(Keychain.setGenericPassword).not.toHaveBeenCalled();
    });
  });

  describe('removeToken', () => {
    it('clears keychain credentials', async () => {
      await storage.removeToken();

      expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
        service: 'com.rapidcapsule.auth',
      });
    });
  });

  describe('getUser', () => {
    it('returns parsed user from MMKV', async () => {
      const mockUser = {_id: '123', email: 'test@test.com'};
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
      const mockUser = {_id: '123', email: 'test@test.com'};
      const store = mmkvMock.createMMKV();

      await storage.setUser(mockUser);

      expect(store.set).toHaveBeenCalledWith(
        'rc_user',
        JSON.stringify(mockUser),
      );
    });

    it('does not store null user', async () => {
      const store = mmkvMock.createMMKV();
      store.set.mockClear();

      await storage.setUser(null);

      expect(store.set).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('removes keychain credentials and MMKV data', async () => {
      const store = mmkvMock.createMMKV();

      await storage.clear();

      expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
        service: 'com.rapidcapsule.auth',
      });
      expect(store.remove).toHaveBeenCalledWith('rc_user');
      expect(store.remove).toHaveBeenCalledWith('rc_remember');
    });
  });
});
