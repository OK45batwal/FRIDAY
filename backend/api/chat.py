"""Chat API Endpoints supporting both SSE streaming and WebSocket communication."""

import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from backend.ai.orchestrator import orchestrator
from backend.utils.logger import get_logger

logger = get_logger("chat_api")

router = APIRouter(prefix="", tags=["chat"])


class ChatRequest(BaseModel):
    prompt: str
    conversation_id: Optional[str] = None


@router.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """Server-Sent Events (SSE) chat streaming endpoint."""
    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    async def event_generator():
        try:
            async for event in orchestrator.process_stream(prompt, conversation_id=req.conversation_id):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error(f"SSE stream error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """Real-time bidirectional WebSocket endpoint."""
    await websocket.accept()
    logger.info("WebSocket client connected.")

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
            except Exception:
                data = {"content": raw_data}

            user_text = data.get("content", data.get("prompt", "")).strip()
            conversation_id = data.get("conversation_id")

            if not user_text:
                await websocket.send_json({"type": "error", "message": "Message content cannot be empty."})
                continue

            # Stream orchestrated events to WebSocket client
            async for event in orchestrator.process_stream(user_text, conversation_id=conversation_id):
                await websocket.send_json(event)

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected.")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
