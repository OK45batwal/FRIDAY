import type { AssistantState, SystemTelemetry } from '../types';

export class FridaySocketService {
  private ws: WebSocket | null = null;
  private pingTimer: any = null;

  connect(callbacks: {
    onStateChange: (state: AssistantState) => void;
    onTelemetry: (telemetry: SystemTelemetry) => void;
    onMessageResponse: (data: any) => void;
    onConnectionChange: (connected: boolean) => void;
  }) {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const wsUrl = `ws://${host || 'localhost'}:8000/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      callbacks.onConnectionChange(true);
      this.pingTimer = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 4000);
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'state_change') {
          callbacks.onStateChange(payload.state);
        } else if (payload.type === 'telemetry') {
          callbacks.onTelemetry(payload.data);
        } else if (payload.type === 'connection_established') {
          if (payload.data?.telemetry) {
            callbacks.onTelemetry(payload.data.telemetry);
          }
        } else if (payload.type === 'chat_response') {
          callbacks.onMessageResponse(payload.data);
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    this.ws.onclose = () => {
      callbacks.onConnectionChange(false);
      clearInterval(this.pingTimer);
    };

    this.ws.onerror = () => {
      callbacks.onConnectionChange(false);
    };
  }

  sendChatMessage(conversationId: string, message: string, inputType: string = 'text') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'chat_message',
        conversation_id: conversationId,
        message,
        input_type: inputType
      }));
    }
  }

  disconnect() {
    clearInterval(this.pingTimer);
    this.ws?.close();
  }
}

export const socketService = new FridaySocketService();
