import { useState, useEffect, useCallback } from 'react';
import type { Conversation, Message, AssistantState, SystemTelemetry } from '../types';
import { api, getBaseUrl, getToken } from '../services/api';
import { socketService } from '../services/websocket';
import { SSEParser, splitSentence } from '../services/stream';

export const useFriday = (
  onMessageComplete?: (content: string) => void,
  onSentenceChunk?: (chunk: string) => void
) => {
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
      id: `user_${Date.now()}`,
      conversation_id: convId,
      role: 'user',
      content,
      input_type: inputType,
      created_at: new Date().toISOString()
    };

    const tempAssistantMsgId = `asst_${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: tempAssistantMsgId,
      conversation_id: convId,
      role: 'assistant',
      content: '',
      input_type: 'text',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg, initialAssistantMsg]);
    setState('THINKING');

    try {
      // ChatGPT / Gemini style Token Streaming with Sub-250ms Sentence Boundaries
      const res = await fetch(`${getBaseUrl()}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(getToken() ? { 'X-FRIDAY-Token': getToken() } : {}) },
        body: JSON.stringify({
          conversation_id: convId,
          message: content,
          input_type: inputType,
          agent_mode: agentMode
        })
      });

      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let unspokenBuffer = '';
      // SSEParser holds any incomplete trailing line between reads. A network
      // chunk can split an SSE frame anywhere — including mid-JSON — and the
      // previous code parsed each chunk in isolation, so a split frame was
      // silently dropped and its tokens lost from the response.
      const parser = new SSEParser();
      let streamCompleted = false;

      if (reader) {
        setState('SPEAKING');
        let done = false;
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (!value) continue;

          for (const event of parser.push(decoder.decode(value, { stream: true }))) {
            if (event.type === 'token') {
              accumulatedText += (event as any).content;
              unspokenBuffer += (event as any).content;

              // Sentence boundary split for <250ms Time-To-First-Audio (TTFA)
              const split = splitSentence(unspokenBuffer);
              if (split) {
                unspokenBuffer = split.rest;
                onSentenceChunk?.(split.sentence);
              }

              setMessages(prev =>
                prev.map(m =>
                  m.id === tempAssistantMsgId
                    ? { ...m, content: accumulatedText }
                    : m
                )
              );
            } else if (event.type === 'done') {
              streamCompleted = true;
              const finalReply = (event as any).full_response || accumulatedText;

              // Dispatch any remaining unspoken tail
              if (unspokenBuffer.trim().length > 0) {
                onSentenceChunk?.(unspokenBuffer.trim());
                unspokenBuffer = '';
              }

              setMessages(prev =>
                prev.map(m =>
                  m.id === tempAssistantMsgId
                    ? { ...m, content: finalReply, id: (event as any).message_id || tempAssistantMsgId }
                    : m
                )
              );
              if (finalReply) {
                onMessageComplete?.(finalReply);
              }
            }
          }
        }
      }

      setState('IDLE');
      // The server already persisted this turn. Only retry over REST if the
      // stream produced nothing at all — otherwise the REST call would run the
      // whole request a second time and store a duplicate exchange.
      if (!streamCompleted && !accumulatedText) {
        throw new Error('Stream closed without producing a response');
      }
      loadConversations();
    } catch (err) {
      console.warn("SSE Stream fallback, invoking standard REST:", err);
      try {
        const res = await api.sendMessage(convId, content, inputType, agentMode);
        setMessages(prev =>
          prev.map(m =>
            m.id === tempAssistantMsgId
              ? { ...m, content: res.response, id: res.message_id }
              : m
          )
        );
        setState('IDLE');
        if (res.response) {
          onSentenceChunk?.(res.response);
          onMessageComplete?.(res.response);
        }
      } catch (restErr) {
        console.error("REST fallback also failed:", restErr);
        setState('IDLE');
      }
    }
  }, [activeConversationId, loadConversations, onMessageComplete, onSentenceChunk]);

  useEffect(() => {
    loadConversations();

    socketService.connect({
      onStateChange: (newState) => setState(newState),
      onTelemetry: (data) => setTelemetry(data),
      onConnectionChange: (connected) => setIsConnected(connected),
      onMessageResponse: () => {}
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
