from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from services.core.db.database import get_db
from services.core.core.assistant.orchestrator import orchestrator

router = APIRouter(prefix="/api")

class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    input_type: str = "text"

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
