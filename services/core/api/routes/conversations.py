from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from services.core.db.database import get_db
from services.core.core.conversation.manager import conversation_manager

router = APIRouter(prefix="/api/conversations")

class CreateConversationRequest(BaseModel):
    title: str = "New Conversation"

class RenameConversationRequest(BaseModel):
    title: str

@router.get("")
async def list_conversations(db: AsyncSession = Depends(get_db)):
    convs = await conversation_manager.list_conversations(db)
    return {"conversations": convs}

@router.post("")
async def create_conversation(payload: CreateConversationRequest, db: AsyncSession = Depends(get_db)):
    conv = await conversation_manager.create_conversation(db, title=payload.title)
    return conv.to_dict()

@router.get("/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, db: AsyncSession = Depends(get_db)):
    conv = await conversation_manager.get_conversation(db, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    messages = await conversation_manager.get_recent_history(db, conversation_id, limit=100)
    return {
        "conversation": conv.to_dict(),
        "messages": messages
    }

@router.patch("/{conversation_id}")
async def rename_conversation_endpoint(conversation_id: str, payload: RenameConversationRequest, db: AsyncSession = Depends(get_db)):
    conv = await conversation_manager.rename_conversation(db, conversation_id, payload.title)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conv.to_dict()

@router.delete("/{conversation_id}")
async def delete_conversation_endpoint(conversation_id: str, db: AsyncSession = Depends(get_db)):
    success = await conversation_manager.delete_conversation(db, conversation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return {"status": "success", "message": "Conversation deleted successfully."}
