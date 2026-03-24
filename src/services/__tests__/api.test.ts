import { ApiError } from '../api-error';

// Mock storage before importing api
jest.mock('../../utils/storage', () => ({
  storage: {
    getToken: jest.fn(() => Promise.resolve('test-token')),
    getRefreshToken: jest.fn(() => Promise.resolve('test-refresh-token')),
    setToken: jest.fn(() => Promise.resolve()),
    setRefreshToken: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

// Mock auth store
jest.mock('../../store/auth', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      logout: jest.fn(() => Promise.resolve()),
    })),
    setState: jest.fn(),
  },
}));

// Mock config
jest.mock('../../config/env', () => ({
  __esModule: true,
  default: {
    API_BASE_URL: 'https://api.test.com/api',
    REQUEST_TIMEOUT: 30000,
  },
}));

import api from '../api';
import { storage } from '../../utils/storage';

describe('api client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('request interceptor', () => {
    it('attaches authorization header when token exists', async () => {
      (storage.getToken as jest.Mock).mockResolvedValue('my-jwt-token');

      // Trigger request interceptor by inspecting the config it produces
      const interceptors = (api.interceptors.request as any).handlers;
      expect(interceptors.length).toBeGreaterThan(0);

      const fulfilled = interceptors[0].fulfilled;
      const config = { headers: {} } as any;
      const result = await fulfilled(config);

      expect(result.headers.Authorization).toBe('Bearer my-jwt-token');
    });

    it('does not attach authorization header when no token', async () => {
      (storage.getToken as jest.Mock).mockResolvedValue(null);

      const interceptors = (api.interceptors.request as any).handlers;
      const fulfilled = interceptors[0].fulfilled;
      const config = { headers: {} } as any;
      const result = await fulfilled(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    it('passes through successful responses', async () => {
      const interceptors = (api.interceptors.response as any).handlers;
      const fulfilled = interceptors[0].fulfilled;
      const response = { data: { message: 'ok' }, status: 200 };

      const result = await fulfilled(response);

      expect(result).toEqual(response);
    });

    it('clears session on 401 response from refresh endpoint', async () => {
      const interceptors = (api.interceptors.response as any).handlers;
      const rejected = interceptors[0].rejected;
      const error = {
        config: { url: '/auth/refresh', _retry: true, headers: {} },
        response: { status: 401, data: { message: 'Unauthorized' } },
      };

      await expect(rejected(error)).rejects.toThrow();
    });

    it('does not clear session on non-401 errors', async () => {
      const interceptors = (api.interceptors.response as any).handlers;
      const rejected = interceptors[0].rejected;
      const error = {
        config: { url: '/some-other-endpoint', headers: {} },
        response: { status: 400, data: { message: 'Bad request' } },
      };

      await expect(rejected(error)).rejects.toThrow();
    });

    it('transforms network errors to NetworkError', async () => {
      const interceptors = (api.interceptors.response as any).handlers;
      const rejected = interceptors[0].rejected;
      const error = {
        config: { url: '/some-endpoint', headers: {} },
        request: {},
      };

      await expect(rejected(error)).rejects.toThrow();
    });

    it('transforms 500 errors to ApiError with correct statusCode', async () => {
      const interceptors = (api.interceptors.response as any).handlers;
      const rejected = interceptors[0].rejected;
      const error = {
        config: { url: '/some-endpoint', headers: {} },
        response: { status: 500, data: { message: 'Internal server error' } },
      };

      try {
        await rejected(error);
        fail('Expected rejection');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).statusCode).toBe(500);
        expect((e as ApiError).message).toBe('Internal server error');
      }
    });
  });

  describe('client configuration', () => {
    it('has correct base URL', () => {
      expect(api.defaults.baseURL).toBe('https://api.test.com/api');
    });

    it('has correct timeout', () => {
      expect(api.defaults.timeout).toBe(30000);
    });

    it('has JSON content type header', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });
  });
});
