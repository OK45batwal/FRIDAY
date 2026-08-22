from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, AsyncGenerator
import json
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from services.core.db.database import get_db
from services.core.core.assistant.orchestrator import orchestrator
from services.core.core.learning.feedback_engine import learning_engine

router = APIRouter(prefix="/api")

class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    input_type: str = "text"
    agent_mode: Optional[str] = "general"

class FeedbackRequest(BaseModel):
    prompt: str
    response: str
    feedback: str  # "like" | "dislike"
    correction: Optional[str] = None

@router.post("/chat")
async def chat_endpoint(payload: ChatRequest, db: AsyncSession = Depends(get_db)):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    
    result = await orchestrator.process_request(
        db=db,
        conversation_id=payload.conversation_id,
        message=payload.message,
        input_type=payload.input_type,
        agent_mode=payload.agent_mode
    )
    return result

@router.post("/chat/stream")
async def chat_stream_endpoint(payload: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    ChatGPT & Gemini style Token Streaming Endpoint (Server-Sent Events / SSE).
    Fix C-2: Fully resolves database transaction and commits before streaming begins,
    preventing DB connection pool exhaustion.
    """
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # 1. Process request and commit to DB *before* entering long-lived streaming generator
    result = await orchestrator.process_request(
        db=db,
        conversation_id=payload.conversation_id,
        message=payload.message,
        input_type=payload.input_type,
        agent_mode=payload.agent_mode
    )

    full_text = result["response"]
    executed_tool = result.get("executed_tool")
    message_id = result.get("message_id")

    async def token_generator() -> AsyncGenerator[str, None]:
        # 1. Yield Thinking / Thought event
        yield f"data: {json.dumps({'type': 'thought', 'content': 'Analyzing intent & searching neural memory...'})}\n\n"
        await asyncio.sleep(0.04)

        # 2. Yield Tool Call if tool was executed
        if executed_tool:
            yield f"data: {json.dumps({'type': 'tool_call', 'tool': executed_tool})}\n\n"
            await asyncio.sleep(0.04)

        # 3. Stream text progressively in word chunks
        words = full_text.split(" ")
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
            await asyncio.sleep(0.015)  # 65 tokens/sec typing cadence

        # 4. Final Completion Event
        yield f"data: {json.dumps({'type': 'done', 'message_id': message_id, 'full_response': full_text})}\n\n"

    return StreamingResponse(token_generator(), media_type="text/event-stream")

@router.post("/feedback")
async def feedback_endpoint(payload: FeedbackRequest):
    """
    Continuous Learning API: Records positive rewards or negative penalties
    and updates FRIDAY 1.0 experience memory in real-time.
    """
    result = learning_engine.record_feedback(
        prompt=payload.prompt,
        response=payload.response,
        feedback=payload.feedback,
        correction=payload.correction
    )
    return result

@router.get("/learning/stats")
async def learning_stats_endpoint():
    """Returns continuous learning and reinforcement statistics."""
    return learning_engine.get_stats()
