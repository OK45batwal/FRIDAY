export type AssistantState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'PROCESSING'
  | 'ERROR'
  | 'OFFLINE';

export type InputType = 'text' | 'voice' | 'system';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  input_type: InputType;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface ChatRequest {
  conversation_id: string;
  message: string;
  input_type?: InputType;
}

export interface ChatResponse {
  conversation_id: string;
  message_id: string;
  response: string;
  created_at: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  ai_provider: string;
}
