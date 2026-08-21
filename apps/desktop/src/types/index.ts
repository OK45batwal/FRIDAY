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

export interface SystemTelemetry {
  cpu_usage_percent: number;
  memory_usage_percent: number;
  memory_used_gb: number;
  memory_total_gb: number;
  battery: {
    percent: number | null;
    power_plugged: boolean;
  };
  current_time: string;
}
