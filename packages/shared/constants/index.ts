export const APP_NAME = 'FRIDAY';
export const APP_VERSION = '0.1.0';
export const DEFAULT_AI_NAME = 'FRIDAY';

export const API_ENDPOINTS = {
  HEALTH: '/health',
  CHAT: '/api/chat',
  CONVERSATIONS: '/api/conversations',
  TRANSCRIBE: '/api/voice/transcribe',
  SPEAK: '/api/voice/speak',
  WS: '/ws'
} as const;

export const ASSISTANT_STATES = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  THINKING: 'THINKING',
  SPEAKING: 'SPEAKING',
  PROCESSING: 'PROCESSING',
  ERROR: 'ERROR',
  OFFLINE: 'OFFLINE'
} as const;
