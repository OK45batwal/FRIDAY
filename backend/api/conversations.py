"""Conversations API Endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from backend.database.repositories import ConversationRepository, MessageRepository

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


class CreateConversationRequest(BaseModel):
    title: Optional[str] = "New Conversation"


class UpdateConversationRequest(BaseModel):
    title: str


@router.get("")
async def list_conversations():
    """List all saved conversations ordered by recency."""
    return await ConversationRepository.list_all()


@router.post("")
async def create_conversation(req: CreateConversationRequest):
    """Create a new conversation."""
    return await ConversationRepository.create(title=req.title or "New Conversation")


@router.get("/{conv_id}")
async def get_conversation(conv_id: str):
    """Get conversation details and messages."""
    conv = await ConversationRepository.get_by_id(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = await MessageRepository.get_by_conversation(conv_id)
    return {
        "conversation": conv,
        "messages": messages,
    }


@router.put("/{conv_id}")
async def update_conversation(conv_id: str, req: UpdateConversationRequest):
    """Rename a conversation."""
    success = await ConversationRepository.update_title(conv_id, req.title)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "updated", "id": conv_id, "title": req.title}


@router.delete("/{conv_id}")
async def delete_conversation(conv_id: str):
    """Delete a conversation and its messages."""
    success = await ConversationRepository.delete(conv_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "deleted", "id": conv_id}
