import json
import psutil
import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.core.db.database import AsyncSessionLocal
from services.core.core.assistant.orchestrator import orchestrator
from services.core.core.ai.manager import ai_manager

ws_router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_json(self, websocket: WebSocket, data: dict):
        try:
            await websocket.send_json(data)
        except Exception:
            pass

manager = ConnectionManager()

def get_system_telemetry() -> dict:
    cpu_pct = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()
    battery_pct = 100
    try:
        bat = psutil.sensors_battery()
        if bat:
            battery_pct = bat.percent
    except Exception:
        pass

    return {
        "cpu_usage_percent": cpu_pct,
        "memory_usage_percent": mem.percent,
        "memory_used_gb": round(mem.used / (1024**3), 2),
        "memory_total_gb": round(mem.total / (1024**3), 2),
        "battery": {"percent": battery_pct, "power_plugged": True},
        "current_time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

@ws_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    # Initial handshake
    await manager.send_json(websocket, {
        "type": "connection_established",
        "data": {
            "message": "FRIDAY core online. Neural link active.",
            "telemetry": get_system_telemetry(),
            "ai_provider": ai_manager.get_active_provider().name
        }
    })

    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                payload = json.loads(raw_text)
            except Exception:
                payload = {"type": "chat_message", "message": raw_text, "conversation_id": "default"}

            msg_type = payload.get("type", "chat_message")

            if msg_type == "chat_message":
                conv_id = payload.get("conversation_id", "default")
                text = payload.get("message", "").strip()
                input_type = payload.get("input_type", "text")
                agent_mode = payload.get("agent_mode", "general")

                if not text:
                    continue

                # 1. State: THINKING
                await manager.send_json(websocket, {"type": "state_change", "state": "THINKING"})

                # 2. Process through DB session & Assistant Orchestrator
                async with AsyncSessionLocal() as db:
                    result = await orchestrator.process_request(
                        db=db,
                        conversation_id=conv_id,
                        message=text,
                        input_type=input_type,
                        agent_mode=agent_mode
                    )

                # 3. State: SPEAKING
                await manager.send_json(websocket, {"type": "state_change", "state": "SPEAKING"})

                # 4. Return formatted response (matches frontend listener exactly)
                await manager.send_json(websocket, {
                    "type": "assistant_response",
                    "conversation_id": result["conversation_id"],
                    "message_id": result["message_id"],
                    "response": result["response"],
                    "created_at": result["created_at"],
                    "executed_tool": result.get("executed_tool")
                })

                # 5. State: IDLE
                await manager.send_json(websocket, {"type": "state_change", "state": "IDLE"})

            elif msg_type == "ping":
                await manager.send_json(websocket, {
                    "type": "system_telemetry",
                    "data": get_system_telemetry()
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
