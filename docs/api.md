# FRIDAY Core API Reference

## Health Check
- **Endpoint**: `GET /health`
- **Response**:
```json
{
  "status": "online",
  "service": "friday-core",
  "version": "0.1.0",
  "ai_provider": "mock"
}
```

## Chat Message
- **Endpoint**: `POST /api/chat`
- **Payload**:
```json
{
  "conversation_id": "0de6cdce-95bf-445e-b059-f73093479c23",
  "message": "Hello Friday, help me plan my project.",
  "input_type": "text"
}
```
- **Response**:
```json
{
  "conversation_id": "0de6cdce-95bf-445e-b059-f73093479c23",
  "message_id": "848e42ff-ca91-4475-be70-f599723ec0fe",
  "response": "Good evening, Omkar. FRIDAY core is online and all systems are operational.",
  "created_at": "2026-08-21T17:29:49.824213"
}
```

## Conversations List & Detail
- **List**: `GET /api/conversations`
- **Create**: `POST /api/conversations` (`{ "title": "Session Alpha" }`)
- **Messages**: `GET /api/conversations/{id}/messages`

## Real-Time WebSocket
- **Endpoint**: `ws://localhost:8000/ws`
- **Client Packets**:
  - Chat: `{ "type": "chat_message", "conversation_id": "...", "message": "...", "input_type": "voice" | "text" }`
  - Heartbeat: `{ "type": "ping" }`
- **Server Packets**:
  - State: `{ "type": "state_change", "state": "THINKING" | "SPEAKING" | "IDLE" }`
  - Response: `{ "type": "chat_response", "data": { ... } }`
  - Telemetry: `{ "type": "telemetry", "data": { "cpu_usage_percent": 15.2, ... } }`
