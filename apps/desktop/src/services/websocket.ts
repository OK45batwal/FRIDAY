import type { AssistantState, SystemTelemetry } from '../types';
import { getBaseUrl, getToken } from './api';

type MessageHandler = (data: any) => void;
type StateHandler = (state: AssistantState) => void;
type TelemetryHandler = (data: SystemTelemetry) => void;
type ConnectionHandler = (connected: boolean) => void;

const BASE_RECONNECT_MS = 2500;
const MAX_RECONNECT_MS = 30000;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnecting: boolean = false;
  private onMessageResponse: MessageHandler | null = null;
  private onStateChange: StateHandler | null = null;
  private onTelemetry: TelemetryHandler | null = null;
  private onConnectionChange: ConnectionHandler | null = null;
  private reconnectTimeout: any = null;
  // Exponential backoff with a ceiling. A fixed 2.5s retry hammered an
  // unreachable backend forever; attempts now back off to at most 30s.
  private reconnectAttempts: number = 0;
  // Set when disconnect() is called so an intentional close does not immediately
  // schedule a reconnect.
  private manualClose: boolean = false;

  connect(handlers: {
    onMessageResponse?: MessageHandler;
    onStateChange?: StateHandler;
    onTelemetry?: TelemetryHandler;
    onConnectionChange?: ConnectionHandler;
  }) {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) return;

    this.onMessageResponse = handlers.onMessageResponse || null;
    this.onStateChange = handlers.onStateChange || null;
    this.onTelemetry = handlers.onTelemetry || null;
    this.onConnectionChange = handlers.onConnectionChange || null;
    this.manualClose = false;

    this.isConnecting = true;
    const httpUrl = getBaseUrl();
    // The WS handshake carries no Origin for native clients, so authenticate
    // with the token as a query param (browsers cannot set WS headers).
    const token = getToken();
    const wsBase = `${httpUrl.replace(/^http/, 'ws')}/ws`;
    const wsUrl = token ? `${wsBase}?token=${encodeURIComponent(token)}` : wsBase;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.onConnectionChange?.(true);
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'assistant_response' || data.type === 'chat_response') {
            const payload = data.data ? { ...data.data, ...data } : data;
            this.onMessageResponse?.(payload);
          } else if (data.type === 'state_change') {
            this.onStateChange?.(data.state);
          } else if (data.type === 'system_telemetry' || data.type === 'telemetry') {
            this.onTelemetry?.(data.data);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      this.socket.onclose = () => {
        this.isConnecting = false;
        this.onConnectionChange?.(false);
        if (!this.manualClose) this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.isConnecting = false;
        this.onConnectionChange?.(false);
        // Do not schedule here: onerror is always followed by onclose, and
        // scheduling in both produced two overlapping reconnect timers.
      };
    } catch (err) {
      this.isConnecting = false;
      if (!this.manualClose) this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    const delay = Math.min(
      BASE_RECONNECT_MS * 2 ** this.reconnectAttempts,
      MAX_RECONNECT_MS
    );
    this.reconnectAttempts += 1;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect({
        onMessageResponse: this.onMessageResponse || undefined,
        onStateChange: this.onStateChange || undefined,
        onTelemetry: this.onTelemetry || undefined,
        onConnectionChange: this.onConnectionChange || undefined
      });
    }, delay);
  }

  sendChatMessage(conversationId: string, message: string, inputType: string = 'text', agentMode: string = 'general'): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'chat_message',
        conversation_id: conversationId,
        message,
        input_type: inputType,
        agent_mode: agentMode
      }));
      return true;
    }
    return false;
  }

  disconnect() {
    this.manualClose = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.reconnectAttempts = 0;
    if (this.socket) {
      // Drop handlers before close so the onclose above does not fire a
      // reconnect or a spurious disconnected event after teardown.
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      this.socket.onopen = null;
      this.socket.close();
      this.socket = null;
    }
    this.isConnecting = false;
  }
}

export const socketService = new WebSocketService();

