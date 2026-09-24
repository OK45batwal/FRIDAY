"""Memory API Endpoints for inspecting and managing persistent memories."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from backend.database.repositories import MemoryRepository

router = APIRouter(prefix="/api/memory", tags=["memory"])


class AddMemoryRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="Memory content")
    category: Optional[str] = Field("general", max_length=100, description="Memory category")
    importance: Optional[float] = Field(default=1.0, ge=0.0, le=1.0, description="Importance score [0.0 - 1.0]")


@router.get("")
async def list_memories():
    """List all stored long-term memories."""
    return await MemoryRepository.list_all()


@router.post("")
async def add_memory(req: AddMemoryRequest):
    """Manually add a memory item with validated bounds."""
    content_clean = req.content.strip()
    if not content_clean:
        raise HTTPException(status_code=400, detail="Memory content cannot be empty")

    # WR-02: Explicit None check so importance=0.0 is preserved and not coerced to 1.0
    final_importance = 1.0 if req.importance is None else req.importance

    return await MemoryRepository.add(
        content=content_clean,
        category=(req.category or "general").strip(),
        importance=final_importance,
    )


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str):
    """Delete a memory item by ID."""
    success = await MemoryRepository.delete(memory_id)
    if not success:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"status": "deleted", "id": memory_id}
