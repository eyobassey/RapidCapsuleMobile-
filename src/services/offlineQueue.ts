import {createMMKV} from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';
import api from './api';

const store = createMMKV({id: 'rc-offline-queue'});
const QUEUE_KEY = 'pending_requests';

interface QueuedRequest {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  data: any;
  createdAt: number;
}

function getQueue(): QueuedRequest[] {
  const raw = store.getString(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveQueue(queue: QueuedRequest[]): void {
  store.set(QUEUE_KEY, JSON.stringify(queue));
}

export const offlineQueue = {
  /**
   * Add a request to the offline queue
   */
  enqueue(
    endpoint: string,
    method: 'POST' | 'PUT' | 'PATCH',
    data: any,
  ): void {
    const queue = getQueue();
    queue.push({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      endpoint,
      method,
      data,
      createdAt: Date.now(),
    });
    saveQueue(queue);
  },

  /**
   * Get count of pending requests
   */
  getPendingCount(): number {
    return getQueue().length;
  },

  /**
   * Process all queued requests (call when back online)
   */
  async flush(): Promise<{succeeded: number; failed: number}> {
    const queue = getQueue();
    if (queue.length === 0) {
      return {succeeded: 0, failed: 0};
    }

    let succeeded = 0;
    let failed = 0;
    const remaining: QueuedRequest[] = [];

    for (const request of queue) {
      try {
        await api({
          url: request.endpoint,
          method: request.method,
          data: request.data,
        });
        succeeded++;
      } catch {
        // Keep failed requests that are less than 24 hours old
        if (Date.now() - request.createdAt < 24 * 60 * 60 * 1000) {
          remaining.push(request);
        }
        failed++;
      }
    }

    saveQueue(remaining);
    return {succeeded, failed};
  },

  /**
   * Clear all queued requests
   */
  clear(): void {
    store.delete(QUEUE_KEY);
  },
};

// Auto-flush when coming back online
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    offlineQueue.flush().then(result => {
      if (result.succeeded > 0) {
        console.log(
          `[OfflineQueue] Synced ${result.succeeded} pending requests`,
        );
      }
    });
  }
});
