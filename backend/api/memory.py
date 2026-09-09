"""Memory API Endpoints for inspecting and managing persistent memories."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from backend.database.repositories import MemoryRepository

router = APIRouter(prefix="/api/memory", tags=["memory"])


class AddMemoryRequest(BaseModel):
    content: str
    category: Optional[str] = "general"
    importance: Optional[float] = 1.0


@router.get("")
async def list_memories():
    """List all stored long-term memories."""
    return await MemoryRepository.list_all()


@router.post("")
async def add_memory(req: AddMemoryRequest):
    """Manually add a memory item."""
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Memory content cannot be empty")
    return await MemoryRepository.add(
        content=req.content.strip(),
        category=req.category or "general",
        importance=req.importance or 1.0,
    )


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str):
    """Delete a memory item by ID."""
    success = await MemoryRepository.delete(memory_id)
    if not success:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"status": "deleted", "id": memory_id}
