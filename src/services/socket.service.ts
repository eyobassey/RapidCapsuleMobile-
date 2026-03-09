import {io, Socket} from 'socket.io-client';
import {storage} from '../utils/storage';
import ENV from '../config/env';

const API_URL = ENV.SOCKET_URL;

type EventHandler = (...args: any[]) => void;

class SocketService {
  private socket: Socket | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Map<string, Set<EventHandler>>();

  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    const token = await storage.getToken();
    if (!token) return;

    this.socket = io(`${API_URL}/messaging`, {
      transports: ['websocket', 'polling'],
      auth: {token},
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    // Re-register all existing listeners on the new socket
    this.listeners.forEach((handlers, event) => {
      handlers.forEach(handler => {
        this.socket?.on(event, handler);
      });
    });

    // Heartbeat every 30s
    this.socket.on('connect', () => {
      this.startHeartbeat();
    });

    this.socket.on('disconnect', () => {
      this.stopHeartbeat();
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    this.socket?.on(event, handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
      this.socket?.off(event, handler);
    };
  }

  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  joinConversations(conversationIds: string[]): void {
    this.emit('join_conversations', {conversationIds});
  }

  typingStart(conversationId: string): void {
    this.emit('typing_start', {conversationId});
  }

  typingStop(conversationId: string): void {
    this.emit('typing_stop', {conversationId});
  }

  markRead(conversationId: string, messageId: string): void {
    this.emit('mark_read', {conversationId, messageId});
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.emit('heartbeat');
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

export const socketService = new SocketService();
