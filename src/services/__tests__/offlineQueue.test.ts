// Mock MMKV before importing offlineQueue
const mockStore = new Map<string, string>();

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn((key: string) => mockStore.get(key)),
    set: jest.fn((key: string, value: string) => mockStore.set(key, value)),
    delete: jest.fn((key: string) => mockStore.delete(key)),
    remove: jest.fn((key: string) => mockStore.delete(key)),
    clearAll: jest.fn(() => mockStore.clear()),
  })),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({isConnected: true})),
}));

jest.mock('../api', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import {offlineQueue} from '../offlineQueue';
import api from '../api';

const mockApi = api as jest.MockedFunction<typeof api>;

describe('offlineQueue', () => {
  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
  });

  describe('enqueue', () => {
    it('adds a request to the queue', () => {
      offlineQueue.enqueue('/vitals', 'POST', {type: 'pulse', value: 72});

      const raw = mockStore.get('pending_requests');
      expect(raw).toBeTruthy();
      const queue = JSON.parse(raw!);
      expect(queue).toHaveLength(1);
      expect(queue[0].endpoint).toBe('/vitals');
      expect(queue[0].method).toBe('POST');
      expect(queue[0].data).toEqual({type: 'pulse', value: 72});
      expect(queue[0].id).toBeTruthy();
      expect(queue[0].createdAt).toBeTruthy();
    });

    it('appends to existing queue', () => {
      offlineQueue.enqueue('/vitals', 'POST', {a: 1});
      offlineQueue.enqueue('/appointments', 'PATCH', {b: 2});

      const queue = JSON.parse(mockStore.get('pending_requests')!);
      expect(queue).toHaveLength(2);
    });
  });

  describe('getPendingCount', () => {
    it('returns 0 for empty queue', () => {
      expect(offlineQueue.getPendingCount()).toBe(0);
    });

    it('returns correct count', () => {
      offlineQueue.enqueue('/a', 'POST', {});
      offlineQueue.enqueue('/b', 'POST', {});
      offlineQueue.enqueue('/c', 'PUT', {});

      expect(offlineQueue.getPendingCount()).toBe(3);
    });
  });

  describe('flush', () => {
    it('returns zeros for empty queue', async () => {
      const result = await offlineQueue.flush();

      expect(result).toEqual({succeeded: 0, failed: 0});
    });

    it('processes queued requests successfully', async () => {
      mockApi.mockResolvedValue({data: {}} as any);

      offlineQueue.enqueue('/vitals', 'POST', {value: 72});
      offlineQueue.enqueue('/appointments', 'PATCH', {id: '1'});

      const result = await offlineQueue.flush();

      expect(result).toEqual({succeeded: 2, failed: 0});
      expect(mockApi).toHaveBeenCalledTimes(2);
      expect(mockApi).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/vitals',
          method: 'POST',
          data: {value: 72},
        }),
      );

      // Queue should be empty after flush
      expect(offlineQueue.getPendingCount()).toBe(0);
    });

    it('retries failed requests under 24 hours', async () => {
      // Enqueue a request (created now, so within 24h)
      offlineQueue.enqueue('/vitals', 'POST', {value: 72});

      mockApi.mockRejectedValue(new Error('Server error'));

      const result = await offlineQueue.flush();

      expect(result).toEqual({succeeded: 0, failed: 1});
      // Request should still be in queue since it is under 24h
      expect(offlineQueue.getPendingCount()).toBe(1);
    });

    it('drops expired requests over 24 hours', async () => {
      // Manually insert an expired request
      const expiredRequest = {
        id: 'expired-1',
        endpoint: '/vitals',
        method: 'POST',
        data: {value: 72},
        createdAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };
      mockStore.set('pending_requests', JSON.stringify([expiredRequest]));

      mockApi.mockRejectedValue(new Error('Server error'));

      const result = await offlineQueue.flush();

      expect(result).toEqual({succeeded: 0, failed: 1});
      // Expired request should be dropped
      expect(offlineQueue.getPendingCount()).toBe(0);
    });

    it('handles mixed success and failure', async () => {
      offlineQueue.enqueue('/a', 'POST', {x: 1});
      offlineQueue.enqueue('/b', 'POST', {x: 2});

      mockApi
        .mockResolvedValueOnce({data: {}} as any)
        .mockRejectedValueOnce(new Error('fail'));

      const result = await offlineQueue.flush();

      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(1);
      // One failed request retained (under 24h)
      expect(offlineQueue.getPendingCount()).toBe(1);
    });
  });

  describe('clear', () => {
    it('removes all queued requests', () => {
      offlineQueue.enqueue('/a', 'POST', {});
      offlineQueue.enqueue('/b', 'POST', {});

      offlineQueue.clear();

      expect(offlineQueue.getPendingCount()).toBe(0);
    });
  });
});
