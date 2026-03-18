import axios, { AxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import ENV from '../config/env';
import { parseApiError } from './api-error';

const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor — attach JWT ─────────────────────────────────────────

api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Token-refresh state ──────────────────────────────────────────────────────

// True while a /auth/refresh call is already in-flight
let isRefreshing = false;

// Callbacks queued while a refresh is in progress.
// Each entry resolves/rejects when the refresh settles.
type QueueEntry = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};
let refreshQueue: QueueEntry[] = [];

function drainQueue(newToken: string) {
  refreshQueue.forEach((entry) => entry.resolve(newToken));
  refreshQueue = [];
}

function rejectQueue(err: unknown) {
  refreshQueue.forEach((entry) => entry.reject(err));
  refreshQueue = [];
}

// Lazy-imported so we avoid a circular dependency at module load time.
// auth store → api → auth store would cause issues if imported at top level.
async function forceLogout() {
  const { useAuthStore } = await import('../store/auth');
  await useAuthStore.getState().logout();
}

// ─── Response interceptor — handle 401 with token refresh ─────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh for 401s that haven't already been retried
    // and aren't the refresh endpoint itself (avoids infinite loop).
    const is401 = error.response?.status === 401;
    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh');

    if (!is401 || originalRequest._retry || isRefreshEndpoint) {
      if (is401 && isRefreshEndpoint) {
        // The refresh call itself got a 401 — session is fully expired.
        rejectQueue(error);
        await forceLogout();
      }
      return Promise.reject(parseApiError(error));
    }

    // Mark so we don't retry this request twice.
    originalRequest._retry = true;

    if (isRefreshing) {
      // Another refresh is already in flight — queue this request.
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return api(originalRequest);
      });
    }

    // Start a fresh refresh flow.
    isRefreshing = true;

    try {
      const refreshToken = await storage.getRefreshToken();

      if (!refreshToken) {
        // No refresh token stored — cannot recover.
        rejectQueue(error);
        await forceLogout();
        return Promise.reject(parseApiError(error));
      }

      // POST /auth/refresh — no Authorization header needed on this call.
      const { data } = await axios.post(
        `${ENV.API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { 'Content-Type': 'application/json' }, timeout: ENV.REQUEST_TIMEOUT }
      );

      const newToken: string = data.data.token;
      const newRefreshToken: string = data.data.refresh_token;

      // Persist both tokens (refresh token is rotated on every call).
      await storage.setToken(newToken);
      await storage.setRefreshToken(newRefreshToken);

      // Let the auth store know about the updated access token.
      const { useAuthStore } = await import('../store/auth');
      useAuthStore.setState({ token: newToken });

      // Unblock all queued requests.
      drainQueue(newToken);

      // Retry the original request with the fresh token.
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${newToken}`,
      };
      return api(originalRequest);
    } catch (refreshError) {
      rejectQueue(refreshError);
      await forceLogout();
      return Promise.reject(parseApiError(refreshError));
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
