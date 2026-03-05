import api from './api';
import type {
  Conversation,
  ConversationsPaginated,
  Message,
  MessagesCursorPage,
  MessageType,
  UserSnippet,
  MessagingRestriction,
} from '../types/messaging.types';

const unwrap = (res: any) => res.data.data ?? res.data.result ?? res.data;

export const messagingService = {
  // ─── Consent ────────────────────────────────────
  async checkConsent(): Promise<{has_consent: boolean}> {
    return unwrap(await api.get('/messaging/consent'));
  },

  async giveConsent(): Promise<void> {
    await api.post('/messaging/consent');
  },

  // ─── Conversations ──────────────────────────────
  async getConversations(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ConversationsPaginated> {
    return unwrap(await api.get('/messaging/conversations', {params}));
  },

  async getConversation(id: string): Promise<Conversation> {
    return unwrap(await api.get(`/messaging/conversations/${id}`));
  },

  async createConversation(participantId: string): Promise<Conversation> {
    return unwrap(
      await api.post('/messaging/conversations', {participant_id: participantId}),
    );
  },

  async archiveConversation(id: string): Promise<Conversation> {
    return unwrap(await api.patch(`/messaging/conversations/${id}/archive`));
  },

  // ─── Messages ───────────────────────────────────
  async getMessages(
    conversationId: string,
    params?: {before?: string; limit?: number},
  ): Promise<MessagesCursorPage> {
    return unwrap(
      await api.get(`/messaging/conversations/${conversationId}/messages`, {params}),
    );
  },

  async sendMessage(
    conversationId: string,
    data: {type: MessageType; content: string; reply_to?: string},
  ): Promise<Message> {
    return unwrap(
      await api.post(`/messaging/conversations/${conversationId}/messages`, data),
    );
  },

  async sendAttachment(
    conversationId: string,
    formData: FormData,
  ): Promise<Message> {
    return unwrap(
      await api.post(
        `/messaging/conversations/${conversationId}/messages/attachment`,
        formData,
        {headers: {'Content-Type': 'multipart/form-data'}},
      ),
    );
  },

  async markRead(conversationId: string): Promise<void> {
    await api.patch(`/messaging/conversations/${conversationId}/read`);
  },

  async deleteMessage(messageId: string): Promise<{conversation_id: string}> {
    return unwrap(await api.delete(`/messaging/messages/${messageId}`));
  },

  // ─── Downloads ──────────────────────────────────
  async getDownloadUrl(
    conversationId: string,
    messageId: string,
  ): Promise<{url: string; original_name: string; mime_type: string; size_bytes: number}> {
    return unwrap(
      await api.get(
        `/messaging/conversations/${conversationId}/messages/${messageId}/download`,
      ),
    );
  },

  // ─── Users & Contacts ──────────────────────────
  async searchUsers(q: string): Promise<UserSnippet[]> {
    return unwrap(await api.get('/messaging/users/search', {params: {q}}));
  },

  async getContacts(): Promise<UserSnippet[]> {
    return unwrap(await api.get('/messaging/contacts'));
  },

  // ─── Restrictions ──────────────────────────────
  async getMyRestrictions(): Promise<MessagingRestriction> {
    return unwrap(await api.get('/messaging/my-restrictions'));
  },
};
