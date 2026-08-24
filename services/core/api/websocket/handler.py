import asyncio
import datetime
import json
import logging

import psutil
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.core.api.websocket.protocol import coerce_client_payload
from services.core.app.security import TOKEN_QUERY_PARAM, is_authorized
from services.core.core.ai.manager import ai_manager
from services.core.core.assistant.orchestrator import orchestrator
from services.core.db.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

ws_router = APIRouter()

# Any single connection that grows past this is a client bug or an attack.
MAX_MESSAGE_CHARS = 32_000
MAX_ACTIVE_CONNECTIONS = 64


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> bool:
        if len(self.active_connections) >= MAX_ACTIVE_CONNECTIONS:
            logger.warning("Refusing WebSocket: %d connections already active", len(self.active_connections))
            await websocket.close(code=1013)  # try again later
            return False
        await websocket.accept()
        self.active_connections.append(websocket)
        return True

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_json(self, websocket: WebSocket, data: dict):
        try:
            await websocket.send_json(data)
        except Exception:
            # Peer vanished mid-write; the receive loop's disconnect handling
            # is authoritative, so there is nothing useful to do here.
            logger.debug("Dropped frame to a closed WebSocket", exc_info=True)

    async def close_all(self):
        """Close every live socket. Called from the app's shutdown hook."""
        for websocket in list(self.active_connections):
            try:
                await websocket.close(code=1001)  # going away
            except Exception:
                logger.debug("Error closing WebSocket during shutdown", exc_info=True)
        self.active_connections.clear()


manager = ConnectionManager()


def get_system_telemetry() -> dict:
    cpu_pct = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()
    battery = None
    power_plugged = True
    try:
        bat = psutil.sensors_battery()
        if bat:
            battery = bat.percent
            power_plugged = bat.power_plugged
    except Exception:
        logger.debug("Battery sensor unavailable", exc_info=True)

    return {
        "cpu_usage_percent": cpu_pct,
        "memory_usage_percent": mem.percent,
        "memory_used_gb": round(mem.used / (1024**3), 2),
        "memory_total_gb": round(mem.total / (1024**3), 2),
        # None rather than a fabricated 100 — desktops have no battery, and the
        # client should render "n/a" instead of a made-up reading.
        "battery": {"percent": battery, "power_plugged": power_plugged},
        "current_time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


@ws_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Browsers do not apply CORS to WebSocket handshakes, so CORSMiddleware
    # cannot protect this endpoint. Without an explicit check, any page could
    # open a socket and drive the OS tools (cross-site WebSocket hijacking).
    origin = websocket.headers.get("origin")
    token = websocket.query_params.get(TOKEN_QUERY_PARAM)
    if not is_authorized(origin, token):
        logger.warning("Rejected WebSocket handshake from origin=%r", origin)
        await websocket.close(code=1008)  # policy violation
        return

    if not await manager.connect(websocket):
        return

    try:
        await manager.send_json(
            websocket,
            {
                "type": "connection_established",
                "data": {
                    "message": "FRIDAY core online. Neural link active.",
                    "telemetry": get_system_telemetry(),
                    "ai_provider": ai_manager.get_active_provider().name,
                },
            },
        )

        while True:
            raw_text = await websocket.receive_text()

            # One malformed message must not end the session. Everything from
            # here down is per-message; only receive_text failures break the loop.
            try:
                payload = coerce_client_payload(raw_text)
                msg_type = payload["type"]

                if msg_type == "chat_message":
                    text = payload["message"][:MAX_MESSAGE_CHARS]
                    if not text:
                        continue

                    await manager.send_json(websocket, {"type": "state_change", "state": "THINKING"})

                    async with AsyncSessionLocal() as db:
                        result = await orchestrator.process_request(
                            db=db,
                            conversation_id=payload["conversation_id"],
                            message=text,
                            input_type=payload["input_type"],
                            agent_mode=payload["agent_mode"],
                        )

                    await manager.send_json(websocket, {"type": "state_change", "state": "SPEAKING"})
                    await manager.send_json(
                        websocket,
                        {
                            "type": "assistant_response",
                            "conversation_id": result["conversation_id"],
                            "message_id": result["message_id"],
                            "response": result["response"],
                            "created_at": result["created_at"],
                            "executed_tool": result.get("executed_tool"),
                        },
                    )
                    await manager.send_json(websocket, {"type": "state_change", "state": "IDLE"})

                elif msg_type == "ping":
                    await manager.send_json(
                        websocket,
                        {"type": "system_telemetry", "data": get_system_telemetry()},
                    )

            except (WebSocketDisconnect, asyncio.CancelledError):
                raise
            except Exception:
                # Log it (previously swallowed silently), tell the client, and
                # return to IDLE so the UI does not hang in THINKING forever.
                logger.exception("Error handling WebSocket message")
                await manager.send_json(
                    websocket,
                    {"type": "error", "message": "FRIDAY could not process that request."},
                )
                await manager.send_json(websocket, {"type": "state_change", "state": "IDLE"})

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception:
        logger.exception("WebSocket terminated unexpectedly")
    finally:
        # In a finally block so an exception during the handshake send cannot
        # leak a permanently-registered connection.
        manager.disconnect(websocket)
