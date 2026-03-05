import api from './api';
import {storage} from '../utils/storage';
import type {SSEChunk, EkaConversation} from '../types/eka.types';

const API_BASE = 'https://api.rapidcapsule.com/api';

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
    await api.patch(`/eka/conversations/${id}`, {title});
  },

  // ─── File Upload (axios multipart) ───────────────
  async uploadPrescription(formData: FormData): Promise<{uploadId: string; filename: string}> {
    const res = await api.post('/eka/upload-prescription', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
      timeout: 60000,
    });
    const data = unwrap(res);
    return {uploadId: data.uploadId, filename: data.filename};
  },

  // ─── SSE Streaming Chat (raw fetch) ──────────────
  streamChat(
    payload: {
      message: string;
      conversation_id?: string;
      language?: string;
      tags?: string[];
    },
    onChunk: (chunk: SSEChunk) => void,
  ): AbortController {
    const controller = new AbortController();

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

        const response = await fetch(`${API_BASE}/eka/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          onChunk({
            type: 'error',
            message: `Server error (${response.status})`,
          });
          return;
        }

        const reader = (response as any).body.getReader();
        const decoder = new (globalThis as any).TextDecoder();
        let sseBuffer = '';

        while (true) {
          const {done, value} = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, {stream: true});
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() || '';

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
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          onChunk({
            type: 'error',
            message: 'Connection lost. Please try again.',
          });
        }
      }
    })();

    return controller;
  },
};
