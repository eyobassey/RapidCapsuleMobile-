import {create} from 'zustand';
import {notificationsService} from '../services/notifications.service';

interface NotificationsState {
  notifications: any[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({isLoading: true, error: null});
    try {
      const data = await notificationsService.list();
      set({notifications: data || [], isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch notifications',
        isLoading: false,
      });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await notificationsService.getUnreadCount();
      set({unreadCount: typeof data === 'number' ? data : data?.count || 0});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch unread count',
      });
    }
  },

  markAsRead: async (id: string) => {
    set({isLoading: true, error: null});
    try {
      await notificationsService.markAsRead(id);
      const notifications = get().notifications.map((n: any) =>
        n._id === id ? {...n, is_read: true} : n,
      );
      set({
        notifications,
        unreadCount: Math.max(0, get().unreadCount - 1),
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to mark as read',
        isLoading: false,
      });
    }
  },

  markAllRead: async () => {
    set({isLoading: true, error: null});
    try {
      await notificationsService.markAllRead();
      const notifications = get().notifications.map((n: any) => ({...n, is_read: true}));
      set({notifications, unreadCount: 0, isLoading: false});
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to mark all as read',
        isLoading: false,
      });
    }
  },

  removeNotification: async (id: string) => {
    set({isLoading: true, error: null});
    try {
      await notificationsService.remove(id);
      const removed = get().notifications.find((n: any) => n._id === id);
      const notifications = get().notifications.filter((n: any) => n._id !== id);
      set({
        notifications,
        unreadCount: removed && !removed.is_read ? Math.max(0, get().unreadCount - 1) : get().unreadCount,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to remove notification',
        isLoading: false,
      });
    }
  },
}));
