import type { Conversation, Message } from '../types';

const getBaseUrl = () => {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host || 'localhost'}:8000`;
};

export const api = {
  async getHealth() {
    const res = await fetch(`${getBaseUrl()}/health`);
    return res.json();
  },

  async getModels() {
    const res = await fetch(`${getBaseUrl()}/api/models`);
    return res.json();
  },

  async updateConfig(provider: string, apiKey?: string, model?: string, baseUrl?: string) {
    const res = await fetch(`${getBaseUrl()}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, api_key: apiKey, model, base_url: baseUrl })
    });
    return res.json();
  },

  async listConversations(): Promise<Conversation[]> {
    const res = await fetch(`${getBaseUrl()}/api/conversations`);
    const data = await res.json();
    return data.conversations || [];
  },

  async createConversation(title: string = "New Conversation"): Promise<Conversation> {
    const res = await fetch(`${getBaseUrl()}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    return res.json();
  },

  async renameConversation(id: string, title: string): Promise<Conversation> {
    const res = await fetch(`${getBaseUrl()}/api/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    return res.json();
  },

  async deleteConversation(id: string): Promise<boolean> {
    const res = await fetch(`${getBaseUrl()}/api/conversations/${id}`, {
      method: 'DELETE'
    });
    return res.ok;
  },

  async getConversationMessages(conversationId: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const res = await fetch(`${getBaseUrl()}/api/conversations/${conversationId}/messages`);
    return res.json();
  },

  async sendMessage(conversationId: string, message: string, inputType: string = 'text') {
    const res = await fetch(`${getBaseUrl()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        message,
        input_type: inputType
      })
    });
    return res.json();
  }
};
