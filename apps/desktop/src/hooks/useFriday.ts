import { useState, useEffect, useCallback } from 'react';
import type { Conversation, Message, AssistantState, SystemTelemetry } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/websocket';

export const useFriday = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<AssistantState>('IDLE');
  const [isConnected, setIsConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);

  const selectConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    try {
      const data = await api.getConversationMessages(id);
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const list = await api.listConversations();
      setConversations(list);
      if (list.length > 0 && !activeConversationId) {
        selectConversation(list[0].id);
      } else if (list.length === 0) {
        const newConv = await api.createConversation("Session Alpha");
        setConversations([newConv]);
        selectConversation(newConv.id);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }, [activeConversationId, selectConversation]);

  const startNewConversation = useCallback(async () => {
    try {
      const conv = await api.createConversation(`Session #${conversations.length + 1}`);
      setConversations(prev => [conv, ...prev]);
      setActiveConversationId(conv.id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  }, [conversations.length]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await api.deleteConversation(id);
      const remaining = conversations.filter(c => c.id !== id);
      setConversations(remaining);
      if (activeConversationId === id) {
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          startNewConversation();
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  }, [conversations, activeConversationId, selectConversation, startNewConversation]);

  const sendMessage = useCallback(async (content: string, inputType: 'text' | 'voice' = 'text', agentMode: string = 'general') => {
    if (!content.trim()) return;

    let convId = activeConversationId;
    if (!convId) {
      const conv = await api.createConversation(content.slice(0, 30));
      setConversations(prev => [conv, ...prev]);
      convId = conv.id;
      setActiveConversationId(convId);
    }

    const tempUserMsg: Message = {
      id: String(Date.now()),
      conversation_id: convId,
      role: 'user',
      content,
      input_type: inputType,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setState('THINKING');

    // Try WebSocket first
    const sentViaWs = socketService.sendChatMessage(convId, content, inputType, agentMode);
    
    // Automatic REST fallback if WebSocket is offline or not yet connected
    if (!sentViaWs) {
      try {
        const res = await api.sendMessage(convId, content, inputType);
        const assistantMsg: Message = {
          id: res.message_id || String(Date.now()),
          conversation_id: res.conversation_id,
          role: 'assistant',
          content: res.response,
          input_type: 'text',
          created_at: res.created_at || new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);
        setState('IDLE');
        loadConversations();
      } catch (err) {
        console.error("REST fallback error:", err);
        setState('ERROR');
      }
    }
  }, [activeConversationId, loadConversations]);

  useEffect(() => {
    loadConversations();

    socketService.connect({
      onStateChange: (newState) => setState(newState),
      onTelemetry: (data) => setTelemetry(data),
      onConnectionChange: (connected) => setIsConnected(connected),
      onMessageResponse: (data) => {
        const assistantMsg: Message = {
          id: data.message_id || String(Date.now()),
          conversation_id: data.conversation_id,
          role: 'assistant',
          content: data.response,
          input_type: 'text',
          created_at: data.created_at || new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);
        setState('IDLE');
        loadConversations();
      }
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  return {
    conversations,
    activeConversationId,
    messages,
    state,
    isConnected,
    telemetry,
    selectConversation,
    startNewConversation,
    deleteConversation,
    sendMessage
  };
};
