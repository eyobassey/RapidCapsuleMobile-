import {create} from 'zustand';
import {messagingService} from '../services/messaging.service';
import type {
  Conversation,
  Message,
  PresenceStatus,
} from '../types/messaging.types';

interface MessagingState {
  // Data
  conversations: Conversation[];
  hasMoreConversations: boolean;
  currentPage: number;
  messages: Record<string, Message[]>; // conversationId -> messages
  hasMoreMessages: Record<string, boolean>;
  cursors: Record<string, string | null>; // conversationId -> cursor

  // Presence & typing
  presenceMap: Record<string, PresenceStatus>;
  typingMap: Record<string, string[]>; // conversationId -> userIds typing

  // State
  unreadTotal: number;
  hasConsent: boolean | null;
  isLoading: boolean;

  // Actions
  checkConsent: () => Promise<boolean>;
  giveConsent: () => Promise<void>;
  fetchConversations: (page?: number, search?: string) => Promise<void>;
  fetchMessages: (conversationId: string, loadMore?: boolean) => Promise<void>;
  addIncomingMessage: (message: Message, conversation: Conversation) => void;
  markConversationRead: (conversationId: string) => Promise<void>;
  updatePresence: (userId: string, status: PresenceStatus) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  updateMessageRead: (conversationId: string) => void;
  deleteMessageLocal: (conversationId: string, messageId: string) => void;
  updateMessageLocal: (conversationId: string, message: Message) => void;
  computeUnreadTotal: (myUserId: string) => void;
  reset: () => void;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  conversations: [],
  hasMoreConversations: true,
  currentPage: 1,
  messages: {},
  hasMoreMessages: {},
  cursors: {},
  presenceMap: {},
  typingMap: {},
  unreadTotal: 0,
  hasConsent: null,
  isLoading: false,

  checkConsent: async () => {
    try {
      const res = await messagingService.checkConsent();
      const has = res.has_consent ?? false;
      set({hasConsent: has});
      return has;
    } catch {
      set({hasConsent: false});
      return false;
    }
  },

  giveConsent: async () => {
    await messagingService.giveConsent();
    set({hasConsent: true});
  },

  fetchConversations: async (page = 1, search) => {
    set({isLoading: true});
    try {
      const res = await messagingService.getConversations({page, limit: 20, search});
      const raw = Array.isArray(res.data || res) ? (res.data || res) : [];
      // Deduplicate by _id in case backend returns duplicates
      const seen = new Set<string>();
      const list = raw.filter((c: Conversation) => {
        if (seen.has(c._id)) return false;
        seen.add(c._id);
        return true;
      });
      const pagination = (res as any).pagination;
      if (page === 1) {
        set({conversations: list, currentPage: 1});
      } else {
        set(s => {
          const existingIds = new Set(s.conversations.map(c => c._id));
          const newItems = list.filter((c: Conversation) => !existingIds.has(c._id));
          return {
            conversations: [...s.conversations, ...newItems],
            currentPage: page,
          };
        });
      }
      set({
        hasMoreConversations: pagination
          ? pagination.page < pagination.pages
          : false,
      });
    } catch {
      // silently fail
    } finally {
      set({isLoading: false});
    }
  },

  fetchMessages: async (conversationId, loadMore = false) => {
    const state = get();
    const cursor = loadMore ? state.cursors[conversationId] : undefined;

    try {
      const res = await messagingService.getMessages(conversationId, {
        before: cursor ?? undefined,
        limit: 50,
      });
      const msgs: Message[] = res.data || [];
      // API returns oldest→newest; inverted FlatList needs newest→oldest (index 0 = bottom)
      const reversed = [...msgs].reverse();
      set(s => {
        let merged: Message[];
        if (loadMore) {
          const existing = s.messages[conversationId] || [];
          const existingIds = new Set(existing.map(m => m._id));
          const newMsgs = reversed.filter(m => !existingIds.has(m._id));
          // Append older messages after existing (shows at top of inverted list)
          merged = [...existing, ...newMsgs];
        } else {
          merged = reversed;
        }
        return {
          messages: {
            ...s.messages,
            [conversationId]: merged,
          },
          hasMoreMessages: {
            ...s.hasMoreMessages,
            [conversationId]: res.has_more ?? false,
          },
          cursors: {
            ...s.cursors,
            [conversationId]: res.cursor ?? null,
          },
        };
      });
    } catch {
      // silently fail
    }
  },

  addIncomingMessage: (message, conversation) => {
    const convId =
      typeof message.conversation === 'string'
        ? message.conversation
        : (message.conversation as any)?._id || conversation._id;

    set(s => {
      // Add message to the front (newest first in inverted list)
      const existing = s.messages[convId] || [];
      const alreadyExists = existing.some(m => m._id === message._id);
      const updatedMessages = alreadyExists
        ? existing
        : [message, ...existing];

      // Update conversation in list
      const updatedConversations = s.conversations.map(c =>
        c._id === conversation._id ? {...c, ...conversation} : c,
      );
      // If conversation doesn't exist, prepend it
      const hasConv = updatedConversations.some(c => c._id === conversation._id);
      const finalConversations = hasConv
        ? updatedConversations
        : [conversation, ...updatedConversations];

      // Sort conversations by last_message.sent_at desc
      finalConversations.sort((a, b) => {
        const aTime = a.last_message?.sent_at || a.updated_at;
        const bTime = b.last_message?.sent_at || b.updated_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      return {
        messages: {...s.messages, [convId]: updatedMessages},
        conversations: finalConversations,
      };
    });
  },

  markConversationRead: async (conversationId) => {
    try {
      await messagingService.markRead(conversationId);
      set(s => ({
        conversations: s.conversations.map(c =>
          c._id === conversationId
            ? {...c, unread_counts: {...c.unread_counts}}
            : c,
        ),
      }));
    } catch {
      // silently fail
    }
  },

  updatePresence: (userId, status) => {
    set(s => ({
      presenceMap: {...s.presenceMap, [userId]: status},
    }));
  },

  setTyping: (conversationId, userId, isTyping) => {
    set(s => {
      const current = s.typingMap[conversationId] || [];
      const updated = isTyping
        ? current.includes(userId)
          ? current
          : [...current, userId]
        : current.filter(id => id !== userId);
      return {typingMap: {...s.typingMap, [conversationId]: updated}};
    });
  },

  updateMessageRead: (conversationId) => {
    set(s => ({
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] || []).map(m => ({
          ...m,
          status: {...m.status, read_at: m.status.read_at || new Date().toISOString()},
        })),
      },
    }));
  },

  deleteMessageLocal: (conversationId, messageId) => {
    set(s => ({
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] || []).map(m =>
          m._id === messageId ? {...m, is_deleted: true, content: ''} : m,
        ),
      },
    }));
  },

  updateMessageLocal: (conversationId, message) => {
    set(s => ({
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] || []).map(m =>
          m._id === message._id ? message : m,
        ),
      },
    }));
  },

  computeUnreadTotal: (myUserId) => {
    const total = get().conversations.reduce((sum, c) => {
      return sum + (c.unread_counts?.[myUserId] || 0);
    }, 0);
    set({unreadTotal: total});
  },

  reset: () => {
    set({
      conversations: [],
      hasMoreConversations: true,
      currentPage: 1,
      messages: {},
      hasMoreMessages: {},
      cursors: {},
      presenceMap: {},
      typingMap: {},
      unreadTotal: 0,
      hasConsent: null,
      isLoading: false,
    });
  },
}));
