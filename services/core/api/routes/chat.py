from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from services.core.db.database import get_db
from services.core.core.assistant.orchestrator import orchestrator
from services.core.core.learning.feedback_engine import learning_engine

router = APIRouter(prefix="/api")

class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    input_type: str = "text"

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
        input_type=payload.input_type
    )
    return result

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
