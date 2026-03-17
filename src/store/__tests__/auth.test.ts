// Mock dependencies before imports
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: jest.fn(),
    setToken: jest.fn(() => Promise.resolve()),
    setUser: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../onboarding', () => ({
  useOnboardingStore: {
    getState: () => ({
      refreshFromUser: jest.fn(),
    }),
  },
}));

jest.mock('../currency', () => ({
  useCurrencyStore: {
    getState: () => ({
      initCurrency: jest.fn(),
    }),
  },
}));

import { useAuthStore } from '../auth';
import api from '../../services/api';
import { storage } from '../../utils/storage';

const mockApi = api as jest.Mocked<typeof api>;
const mockStorage = storage as jest.Mocked<typeof storage>;

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store to initial state
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,
      needsOnboarding: false,
    });
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(true);
      expect(state.needsOnboarding).toBe(false);
    });
  });

  describe('login', () => {
    it('sets user, token, and isAuthenticated on success', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { data: 'jwt-token-123' },
      });
      mockApi.get.mockResolvedValueOnce({
        data: {
          data: {
            _id: 'user1',
            email: 'test@test.com',
            profile: {
              first_name: 'John',
              last_name: 'Doe',
              date_of_birth: '1990-01-01',
            },
            emergency_contacts: [{ name: 'Jane' }],
            is_email_verified: true,
          },
        },
      });

      const result = await useAuthStore.getState().login('test@test.com', 'pass123');

      expect(result).toEqual({ requires2FA: false });
      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'pass123',
        user_type: 'Patient',
      });
      expect(mockStorage.setToken).toHaveBeenCalledWith('jwt-token-123');

      const state = useAuthStore.getState();
      expect(state.token).toBe('jwt-token-123');
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeTruthy();
      expect(state.user?.email).toBe('test@test.com');
    });

    it('returns requires2FA when backend returns non-string result (email OTP)', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: {
          message: 'OTP has been sent to your email, kindly verify',
          result: { twoFA_auth: true },
        },
      });

      const result = await useAuthStore.getState().login('test@test.com', 'pass123');

      expect(result).toEqual({ requires2FA: true, method: 'email' });
      expect(mockStorage.setToken).not.toHaveBeenCalled();
    });

    it('returns requires2FA with sms method when backend sends phone OTP', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: {
          message: 'OTP has been sent to your phone, kindly verify',
          result: { twoFA_auth: true },
        },
      });

      const result = await useAuthStore.getState().login('test@test.com', 'pass123');

      expect(result).toEqual({ requires2FA: true, method: 'sms' });
      expect(mockStorage.setToken).not.toHaveBeenCalled();
    });

    it('propagates API errors', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(useAuthStore.getState().login('test@test.com', 'wrong')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('logout', () => {
    it('clears state and storage', async () => {
      // Set some state first
      useAuthStore.setState({
        user: {
          _id: '1',
          email: 'x',
          user_type: 'Patient',
          profile: { first_name: 'A', last_name: 'B' },
          is_email_verified: true,
        },
        token: 'token',
        isAuthenticated: true,
        needsOnboarding: true,
      });

      await useAuthStore.getState().logout();

      expect(mockStorage.clear).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.needsOnboarding).toBe(false);
    });
  });

  describe('hydrate', () => {
    it('restores state from storage when token exists', async () => {
      mockStorage.getToken.mockResolvedValue('stored-token');
      mockApi.get.mockResolvedValueOnce({
        data: {
          data: {
            _id: 'user1',
            email: 'stored@test.com',
            profile: {
              first_name: 'Jane',
              last_name: 'Doe',
              date_of_birth: '1995-05-05',
            },
            emergency_contacts: [{ name: 'Bob' }],
            is_email_verified: true,
          },
        },
      });

      await useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.token).toBe('stored-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('stored@test.com');
    });

    it('sets isLoading to false when no token', async () => {
      mockStorage.getToken.mockResolvedValue(null);

      await useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('fetchUser', () => {
    it('sets needsOnboarding when profile is incomplete', async () => {
      useAuthStore.setState({ token: 'tok' });
      mockApi.get.mockResolvedValueOnce({
        data: {
          data: {
            _id: 'user1',
            email: 'new@test.com',
            profile: { first_name: 'A', last_name: 'B' },
            emergency_contacts: [],
            is_email_verified: true,
          },
        },
      });

      await useAuthStore.getState().fetchUser();

      const state = useAuthStore.getState();
      expect(state.needsOnboarding).toBe(true);
    });

    it('handles fetchUser failure gracefully', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Network error'));

      await useAuthStore.getState().fetchUser();

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      // Should not crash, user stays null
      expect(state.user).toBeNull();
    });
  });
});
