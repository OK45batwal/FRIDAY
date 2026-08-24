from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from services.core.db.database import get_db
from services.core.core.conversation.manager import conversation_manager

router = APIRouter(prefix="/api/conversations")

# Matches the Conversation.title column width. SQLite does not enforce
# String(255), so without this an unbounded title was accepted and stored.
MAX_TITLE_CHARS = 255


class CreateConversationRequest(BaseModel):
    title: str = Field(default="New Conversation", min_length=1, max_length=MAX_TITLE_CHARS)


class RenameConversationRequest(BaseModel):
    # min_length=1 after stripping: rename_conversation calls .strip(), so a
    # whitespace-only title previously produced an untitled, unclickable entry.
    title: str = Field(min_length=1, max_length=MAX_TITLE_CHARS)


@router.get("")
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
):
    convs = await conversation_manager.list_conversations(db, limit=limit)
    return {"conversations": convs}


@router.post("")
async def create_conversation(payload: CreateConversationRequest, db: AsyncSession = Depends(get_db)):
    conv = await conversation_manager.create_conversation(db, title=payload.title)
    return conv.to_dict()


@router.get("/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    limit: int = Query(100, ge=1, le=500),
):
    conv = await conversation_manager.get_conversation(db, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    messages = await conversation_manager.get_recent_history(db, conversation_id, limit=limit)
    return {
        "conversation": conv.to_dict(),
        "messages": messages
    }


@router.patch("/{conversation_id}")
async def rename_conversation_endpoint(conversation_id: str, payload: RenameConversationRequest, db: AsyncSession = Depends(get_db)):
    if not payload.title.strip():
        raise HTTPException(status_code=422, detail="Title cannot be blank.")
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
