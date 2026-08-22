import type { AssistantState, SystemTelemetry } from '../types';

type MessageHandler = (data: any) => void;
type StateHandler = (state: AssistantState) => void;
type TelemetryHandler = (data: SystemTelemetry) => void;
type ConnectionHandler = (connected: boolean) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnecting: boolean = false;
  private onMessageResponse: MessageHandler | null = null;
  private onStateChange: StateHandler | null = null;
  private onTelemetry: TelemetryHandler | null = null;
  private onConnectionChange: ConnectionHandler | null = null;
  private reconnectInterval: number = 2500;
  private reconnectTimeout: any = null;

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

    this.isConnecting = true;
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const wsUrl = `ws://${host || 'localhost'}:8000/ws`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
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
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.isConnecting = false;
        this.onConnectionChange?.(false);
      };
    } catch (err) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = null;
        this.connect({
          onMessageResponse: this.onMessageResponse || undefined,
          onStateChange: this.onStateChange || undefined,
          onTelemetry: this.onTelemetry || undefined,
          onConnectionChange: this.onConnectionChange || undefined
        });
      }, this.reconnectInterval);
    }
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
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnecting = false;
  }
}

export const socketService = new WebSocketService();
