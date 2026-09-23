"""Conversations API Endpoints."""

import re
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
async def list_conversations(limit: Optional[int] = None, offset: int = 0):
    """List all saved conversations ordered by recency with optional pagination."""
    all_convs = await ConversationRepository.list_all()
    if limit is not None:
        return all_convs[offset : offset + limit]
    return all_convs


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


@router.get("/{conv_id}/export")
async def export_conversation(conv_id: str, format: str = "markdown"):
    """Export conversation history as Markdown or JSON."""
    conv = await ConversationRepository.get_by_id(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = await MessageRepository.get_by_conversation(conv_id)

    title = getattr(conv, "title", None) or (conv.get("title") if isinstance(conv, dict) else "Conversation")
    updated_at = getattr(conv, "updated_at", None) or (conv.get("updated_at") if isinstance(conv, dict) else None)

    if format == "json":
        return {
            "title": title,
            "exported_at": str(updated_at) if updated_at else None,
            "messages": [m.model_dump() if hasattr(m, "model_dump") else m for m in messages],
        }

    # Markdown format
    lines = [f"# {title}", ""]
    lines.append("> Exported from FRIDAY Local AI Assistant\n")
    for m in messages:
        role = getattr(m, "role", None) or (m.get("role") if isinstance(m, dict) else "")
        content = getattr(m, "content", "") or (m.get("content", "") if isinstance(m, dict) else "")
        sender = "👤 You" if role == "user" else "✦ FRIDAY"
        lines.append(f"### {sender}\n\n{str(content).strip()}\n")
    safe_filename = re.sub(r'[^\w\-_.]+', '_', (title or "").lower()).strip('_') or "conversation"
    return {
        "format": "markdown",
        "title": title,
        "filename": f"{safe_filename}.md",
        "content": "\n".join(lines),
    }


@router.patch("/{conv_id}")
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
