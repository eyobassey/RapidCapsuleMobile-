import {create} from 'zustand';
import {ekaService} from '../services/eka.service';
import {storage} from '../utils/storage';
import type {
  EkaMessage,
  EkaArtifact,
  CheckupQuestion,
  Suggestion,
  EkaConversation,
  SSEChunk,
} from '../types/eka.types';

interface EkaState {
  conversations: EkaConversation[];
  currentConversationId: string | null;
  messages: EkaMessage[];
  isStreaming: boolean;
  artifact: EkaArtifact | null;
  checkupQuestion: CheckupQuestion | null;
  suggestions: Suggestion[];
  loadingTool: string | null;
  language: string;

  // Internal
  _abortHandle: {abort: () => void} | null;

  // Actions
  initLanguage: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  sendMessage: (text: string) => void;
  answerCheckupQuestion: (answer: string) => void;
  newConversation: () => void;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  setLanguage: (lang: string) => void;
  cancelStream: () => void;
  clearArtifact: () => void;
}

export const useEkaStore = create<EkaState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  isStreaming: false,
  artifact: null,
  checkupQuestion: null,
  suggestions: [],
  loadingTool: null,
  language: 'English',
  _abortHandle: null,

  initLanguage: async () => {
    const lang = await storage.getEkaLanguage();
    set({language: lang});
  },

  fetchConversations: async () => {
    try {
      const convos = await ekaService.getConversations();
      set({conversations: Array.isArray(convos) ? convos : []});
    } catch {
      // silent
    }
  },

  loadConversation: async (id: string) => {
    try {
      const convo = await ekaService.getConversation(id);
      const msgs: EkaMessage[] = (convo.messages || []).map((m, i) => ({
        id: `${convo._id}-${i}`,
        role: m.role,
        content: m.content,
        tools_used: m.tools_used,
        created_at: m.created_at || convo.created_at,
      }));
      set({
        currentConversationId: convo._id,
        messages: msgs,
        artifact: null,
        checkupQuestion: null,
        suggestions: [],
        loadingTool: null,
      });
    } catch {
      // silent
    }
  },

  sendMessage: (text: string) => {
    const state = get();

    // Cancel any existing stream
    if (state._abortHandle) {
      state._abortHandle.abort();
    }

    // Clear interactive UI
    set({checkupQuestion: null, suggestions: []});

    // Add user message
    const userMsg: EkaMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    // Add empty assistant placeholder
    const assistantMsg: EkaMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    set(s => ({
      messages: [...s.messages, userMsg, assistantMsg],
      isStreaming: true,
      loadingTool: null,
    }));

    let gotContent = false;

    const onChunk = (chunk: SSEChunk) => {
      const s = get();
      const msgs = [...s.messages];
      const lastIdx = msgs.length - 1;
      const lastMsg = msgs[lastIdx];
      if (!lastMsg || lastMsg.role !== 'assistant') return;

      switch (chunk.type) {
        case 'text':
          gotContent = true;
          msgs[lastIdx] = {...lastMsg, content: lastMsg.content + (chunk.content || '')};
          set({messages: msgs});
          break;

        case 'tool_start':
          set({loadingTool: chunk.tool || null});
          break;

        case 'tool_done':
          set({loadingTool: null});
          break;

        case 'artifact':
          if (chunk.artifact_type && chunk.data) {
            const art: EkaArtifact = {type: chunk.artifact_type, data: chunk.data};
            msgs[lastIdx] = {...lastMsg, artifact: art};
            set({messages: msgs, artifact: art});
          }
          break;

        case 'checkup_question':
          if (chunk.question) {
            msgs[lastIdx] = {...lastMsg, checkup_question: chunk.question};
            set({messages: msgs, checkupQuestion: chunk.question});
          }
          break;

        case 'suggestions':
          if (chunk.suggestions) {
            set({suggestions: chunk.suggestions});
          }
          break;

        case 'clear_loading':
          // Clear the loading text from last message
          if (lastMsg.content && !gotContent) {
            msgs[lastIdx] = {...lastMsg, content: ''};
            set({messages: msgs, loadingTool: null});
          } else {
            set({loadingTool: null});
          }
          break;

        case 'clear_artifact':
          set({artifact: null});
          break;

        case 'done':
          if (chunk.conversation_id) {
            set({currentConversationId: chunk.conversation_id});
          }
          set({isStreaming: false, loadingTool: null, _abortHandle: null});
          // Refresh conversation list
          get().fetchConversations();

          // Show fallback if no content was received
          if (!gotContent) {
            const updatedMsgs = [...get().messages];
            const idx = updatedMsgs.length - 1;
            if (updatedMsgs[idx]?.role === 'assistant' && !updatedMsgs[idx].content) {
              updatedMsgs[idx] = {
                ...updatedMsgs[idx],
                content: "I wasn't able to respond just now. Please try again in a moment.",
              };
              set({messages: updatedMsgs});
            }
          }
          break;

        case 'error':
          gotContent = true;
          const errorText = chunk.content || chunk.message || 'Something went wrong. Please try again.';
          msgs[lastIdx] = {...lastMsg, content: lastMsg.content + errorText};
          set({messages: msgs, isStreaming: false, loadingTool: null, _abortHandle: null});
          break;
      }
    };

    const handle = ekaService.streamChat(
      {
        message: text,
        conversation_id: state.currentConversationId || undefined,
        language: state.language,
      },
      onChunk,
    );

    set({_abortHandle: handle});
  },

  answerCheckupQuestion: (answer: string) => {
    set({checkupQuestion: null});
    get().sendMessage(answer);
  },

  newConversation: () => {
    const state = get();
    if (state._abortHandle) {
      state._abortHandle.abort();
    }
    set({
      currentConversationId: null,
      messages: [],
      isStreaming: false,
      artifact: null,
      checkupQuestion: null,
      suggestions: [],
      loadingTool: null,
      _abortHandle: null,
    });
  },

  deleteConversation: async (id: string) => {
    try {
      await ekaService.deleteConversation(id);
      const state = get();
      set({
        conversations: state.conversations.filter(c => c._id !== id),
      });
      if (state.currentConversationId === id) {
        get().newConversation();
      }
    } catch {
      // silent
    }
  },

  renameConversation: async (id: string, title: string) => {
    try {
      await ekaService.renameConversation(id, title);
      set(s => ({
        conversations: s.conversations.map(c =>
          c._id === id ? {...c, title} : c,
        ),
      }));
    } catch {
      // silent
    }
  },

  setLanguage: (lang: string) => {
    set({language: lang});
    storage.setEkaLanguage(lang);
  },

  cancelStream: () => {
    const state = get();
    if (state._abortHandle) {
      state._abortHandle.abort();
    }
    set({isStreaming: false, loadingTool: null, _abortHandle: null});
  },

  clearArtifact: () => {
    set({artifact: null});
  },
}));
