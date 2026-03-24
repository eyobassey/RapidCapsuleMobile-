import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { socketService } from '../services/socket.service';
import { useMessagingStore } from '../store/messaging';
import { useAuthStore } from '../store/auth';
import type { Message, Conversation, PresenceStatus } from '../types/messaging.types';

/**
 * Hook that manages the Socket.IO lifecycle and syncs events to the messaging store.
 * Mount this once at the messaging root (ConversationsListScreen).
 */
export function useSocket() {
  const myUserId = useAuthStore((s) => s.user?._id);
  const addIncomingMessage = useMessagingStore((s) => s.addIncomingMessage);
  const setTyping = useMessagingStore((s) => s.setTyping);
  const updatePresence = useMessagingStore((s) => s.updatePresence);
  const updateMessageRead = useMessagingStore((s) => s.updateMessageRead);
  const deleteMessageLocal = useMessagingStore((s) => s.deleteMessageLocal);
  const updateMessageLocal = useMessagingStore((s) => s.updateMessageLocal);
  const computeUnreadTotal = useMessagingStore((s) => s.computeUnreadTotal);
  const cleanupRefs = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!myUserId) return;

    const setup = async () => {
      await socketService.connect();

      cleanupRefs.current = [
        // Connected — set initial presence
        socketService.on('connected', (data: any) => {
          if (data?.presence) {
            Object.entries(data.presence).forEach(([uid, status]) => {
              updatePresence(uid, status as PresenceStatus);
            });
          }
        }),

        // New message
        socketService.on(
          'new_message',
          (data: { message: Message; conversation: Conversation }) => {
            addIncomingMessage(data.message, data.conversation);
            computeUnreadTotal(myUserId);
          }
        ),

        // Typing indicator
        socketService.on(
          'user_typing',
          (data: { conversationId: string; userId: string; isTyping: boolean }) => {
            if (data.userId !== myUserId) {
              setTyping(data.conversationId, data.userId, data.isTyping);
            }
          }
        ),

        // Presence updates
        socketService.on('presence_update', (data: { userId: string; status: PresenceStatus }) => {
          updatePresence(data.userId, data.status);
        }),

        // Read receipts
        socketService.on('messages_read', (data: { conversationId: string; readBy: string }) => {
          if (data.readBy !== myUserId) {
            updateMessageRead(data.conversationId);
          }
        }),
        socketService.on('message_read', (data: { conversationId: string; readBy: string }) => {
          if (data.readBy !== myUserId) {
            updateMessageRead(data.conversationId);
          }
        }),

        // Message deleted
        socketService.on(
          'message_deleted',
          (data: { messageId: string; conversationId: string }) => {
            deleteMessageLocal(data.conversationId, data.messageId);
          }
        ),

        // Message updated (link previews)
        socketService.on(
          'message_updated',
          (data: { message: Message; conversationId: string }) => {
            updateMessageLocal(data.conversationId, data.message);
          }
        ),
      ];
    };

    void setup();

    // Handle app state changes — reconnect on foreground
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !socketService.connected) {
        void socketService.connect();
      }
    });

    return () => {
      cleanupRefs.current.forEach((unsub) => unsub());
      cleanupRefs.current = [];
      subscription.remove();
      socketService.disconnect();
    };
  }, [
    myUserId,
    addIncomingMessage,
    computeUnreadTotal,
    deleteMessageLocal,
    setTyping,
    updateMessageLocal,
    updateMessageRead,
    updatePresence,
  ]);
}
