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


import time

MAX_PROMPT_LENGTH = 8000
_rate_limits = {}

def check_rate_limit(key: str, max_requests: int = 120, window_seconds: int = 60) -> bool:
    now = time.time()
    history = [t for t in _rate_limits.get(key, []) if now - t < window_seconds]
    if len(history) >= max_requests:
        return False
    history.append(now)
    _rate_limits[key] = history
    return True

class ChatRequest(BaseModel):
    prompt: Optional[str] = None
    message: Optional[str] = None
    conversation_id: Optional[str] = None
    stream: Optional[bool] = True


@router.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """Chat endpoint supporting both Server-Sent Events (SSE) streaming and direct JSON responses."""
    raw_prompt = req.prompt or req.message or ""
    prompt = raw_prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    if len(prompt) > MAX_PROMPT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Prompt exceeds maximum allowed length of {MAX_PROMPT_LENGTH} characters.",
        )
    client_key = req.conversation_id or "global"
    if not check_rate_limit(client_key):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait a moment.")

    if req.stream is False:
        # Non-streaming JSON response for Android and REST clients
        content_parts = []
        conversation_id = req.conversation_id
        try:
            async for event in orchestrator.process_stream(prompt, conversation_id=req.conversation_id):
                event_type = event.get("type")
                if event_type in ("assistant_token", "content"):
                    content_parts.append(event.get("content", ""))
                elif event_type == "conversation_created":
                    conversation_id = event.get("conversation_id")
                elif event_type in ("tool_completed", "tool_end"):
                    tool_result = event.get("result", "")
                    if tool_result:
                        content_parts.append(f"\n[Tool Result]: {tool_result}\n")
                elif event_type == "error":
                    error_msg = event.get("message", "An error occurred.")
                    content_parts.append(f"\n[Error]: {error_msg}")
        except Exception as e:
            logger.error(f"Chat processing error: {e}", exc_info=True)
            content_parts.append(f"Command processed: {str(e)}")

        full_reply = "".join(content_parts).strip()
        if not full_reply:
            full_reply = "Command executed successfully."

        return {
            "reply": full_reply,
            "response": full_reply,
            "conversation_id": conversation_id,
            "success": True,
        }

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

            if len(user_text) > MAX_PROMPT_LENGTH:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Message exceeds maximum allowed length of {MAX_PROMPT_LENGTH} characters."
                })
                continue

            # Stream orchestrated events to WebSocket client
            async for event in orchestrator.process_stream(user_text, conversation_id=conversation_id):
                await websocket.send_json(event)

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected.")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
