import api from './api';
import { storage } from '../utils/storage';
import type { SSEChunk, EkaConversation } from '../types/eka.types';
import ENV from '../config/env';

const API_BASE = ENV.API_BASE_URL;

const unwrap = (res: any) => res.data.data ?? res.data.result ?? res.data;

export const ekaService = {
  // ─── Conversations (axios) ────────────────────────
  async getConversations(): Promise<EkaConversation[]> {
    const res = unwrap(await api.get('/eka/conversations'));
    return Array.isArray(res) ? res : res?.data || [];
  },

  async getConversation(id: string): Promise<EkaConversation> {
    return unwrap(await api.get(`/eka/conversations/${id}`));
  },

  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/eka/conversations/${id}`);
  },

  async renameConversation(id: string, title: string): Promise<void> {
    await api.patch(`/eka/conversations/${id}`, { title });
  },

  // ─── File Upload (axios multipart) ───────────────
  async uploadPrescription(formData: FormData): Promise<{ uploadId: string; filename: string }> {
    const res = await api.post('/eka/upload-prescription', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    const data = unwrap(res);
    return { uploadId: data.uploadId, filename: data.filename };
  },

  // ─── SSE Streaming Chat (XMLHttpRequest) ─────────
  // React Native's fetch doesn't support ReadableStream.
  // XMLHttpRequest with onprogress gives us incremental SSE data.
  streamChat(
    payload: {
      message: string;
      conversation_id?: string;
      language?: string;
      tags?: string[];
    },
    onChunk: (chunk: SSEChunk) => void
  ): { abort: () => void } {
    const xhr = new XMLHttpRequest();
    let lastIndex = 0;
    let sseBuffer = '';
    let aborted = false;

    const parseSSE = (raw: string) => {
      sseBuffer += raw;
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop() || ''; // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const chunk: SSEChunk = JSON.parse(data);
          onChunk(chunk);
        } catch {
          // skip malformed JSON
        }
      }
    };

    (async () => {
      try {
        const token = await storage.getToken();

        const body: any = {
          message: payload.message,
          language: payload.language || 'English',
        };
        if (payload.conversation_id) {
          body.conversation_id = payload.conversation_id;
        }
        if (payload.tags && payload.tags.length > 0) {
          body.tags = payload.tags;
        }

        xhr.open('POST', `${API_BASE}/eka/chat`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.onprogress = () => {
          if (aborted) return;
          const newData = xhr.responseText.slice(lastIndex);
          lastIndex = xhr.responseText.length;
          if (newData) {
            parseSSE(newData);
          }
        };

        xhr.onloadend = () => {
          if (aborted) return;
          // Process any remaining data in responseText
          const remaining = xhr.responseText.slice(lastIndex);
          if (remaining) {
            parseSSE(remaining);
          }
          // Flush any leftover buffer
          if (sseBuffer.trim()) {
            parseSSE('\n');
          }
        };

        xhr.onerror = () => {
          if (aborted) return;
          onChunk({
            type: 'error',
            message: 'Connection lost. Please try again.',
          });
        };

        xhr.ontimeout = () => {
          if (aborted) return;
          onChunk({
            type: 'error',
            message: 'Request timed out. Please try again.',
          });
        };

        xhr.timeout = 120000; // 2 min timeout for long AI responses
        xhr.send(JSON.stringify(body));
      } catch {
        if (!aborted) {
          onChunk({
            type: 'error',
            message: 'Failed to connect. Please try again.',
          });
        }
      }
    })();

    return {
      abort: () => {
        aborted = true;
        xhr.abort();
      },
    };
  },
};
