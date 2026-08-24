import type { Conversation, Message } from '../types';
import { sanitizeBaseUrl } from './stream';

// Native clients (packaged Electron, Capacitor) do not have an allowlisted
// browser Origin, so they authenticate with a shared token. Electron's main
// process reads it from the server's token file and injects it via preload;
// a user can also paste one into localStorage for a remote/LAN backend.
export const getToken = (): string => {
  const injected = (typeof window !== 'undefined' && (window as any).electronAPI?.apiToken) || '';
  if (injected) return injected;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('FRIDAY_API_TOKEN') || '';
  }
  return '';
};

const DEFAULT_BASE = 'http://localhost:8000';

export const getBaseUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const custom = sanitizeBaseUrl(localStorage.getItem('FRIDAY_SERVER_URL'));
    if (custom) return custom;
    const host = window.location.hostname;
    return envUrl || `http://${host || 'localhost'}:8000`;
  }
  return envUrl || DEFAULT_BASE;
};

// Every request carries the token when we have one. Origin-allowlisted browser
// requests do not need it, so an empty header is harmless.
const authHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const token = getToken();
  return token ? { ...extra, 'X-FRIDAY-Token': token } : extra;
};

const jsonHeaders = () => authHeaders({ 'Content-Type': 'application/json' });

export const api = {
  async getHealth() {
    const res = await fetch(`${getBaseUrl()}/health`, { headers: authHeaders() });
    return res.json();
  },

  async getModels() {
    const res = await fetch(`${getBaseUrl()}/api/models`, { headers: authHeaders() });
    return res.json();
  },

  async getLearningStats() {
    const res = await fetch(`${getBaseUrl()}/api/learning/stats`, { headers: authHeaders() });
    return res.json();
  },

  // Feedback now references the stored assistant message by id; the server
  // reconstructs the prompt/response pair. The client can no longer inject
  // arbitrary text into the learned-response store.
  async sendFeedback(messageId: string, feedback: 'like' | 'dislike', correction?: string) {
    const res = await fetch(`${getBaseUrl()}/api/feedback`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ message_id: messageId, feedback, correction })
    });
    return res.json();
  },

  async updateConfig(provider: string, apiKey?: string, model?: string) {
    const res = await fetch(`${getBaseUrl()}/api/config`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ provider, api_key: apiKey, model })
    });
    return res.json();
  },

  async listConversations(): Promise<Conversation[]> {
    const res = await fetch(`${getBaseUrl()}/api/conversations`, { headers: authHeaders() });
    const data = await res.json();
    return data.conversations || [];
  },

  async createConversation(title: string = "New Conversation"): Promise<Conversation> {
    const res = await fetch(`${getBaseUrl()}/api/conversations`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ title })
    });
    return res.json();
  },

  async renameConversation(id: string, title: string): Promise<Conversation> {
    const res = await fetch(`${getBaseUrl()}/api/conversations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ title })
    });
    return res.json();
  },

  async deleteConversation(id: string): Promise<boolean> {
    const res = await fetch(`${getBaseUrl()}/api/conversations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return res.ok;
  },

  async getConversationMessages(conversationId: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const res = await fetch(`${getBaseUrl()}/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
      headers: authHeaders()
    });
    return res.json();
  },

  async sendMessage(conversationId: string, message: string, inputType: string = 'text', agentMode: string = 'general') {
    const res = await fetch(`${getBaseUrl()}/api/chat`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        conversation_id: conversationId,
        message,
        input_type: inputType,
        agent_mode: agentMode
      })
    });
    return res.json();
  }
};
