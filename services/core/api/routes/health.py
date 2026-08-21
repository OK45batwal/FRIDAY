from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.core.core.ai.manager import ai_manager
from services.core.app.config import settings

router = APIRouter()

class UpdateConfigRequest(BaseModel):
    provider: str
    api_key: Optional[str] = None
    model: Optional[str] = None

@router.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "friday-core",
        "version": "0.1.0",
        "ai_provider": ai_manager.get_active_provider().name,
        "openrouter_model": settings.OPENROUTER_MODEL if ai_manager.get_active_provider().name == "openrouter" else None
    }

@router.post("/api/config")
async def update_config(payload: UpdateConfigRequest):
    ai_manager.update_config(
        provider=payload.provider,
        api_key=payload.api_key,
        model=payload.model
    )
    return {
        "status": "success",
        "active_provider": ai_manager.get_active_provider().name,
        "model": payload.model
    }
