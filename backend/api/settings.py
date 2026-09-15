"""Settings API Endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from backend.config.settings import settings
from backend.database.repositories import SettingsRepository

router = APIRouter(prefix="/api/settings", tags=["settings"])


class UpdateSettingsRequest(BaseModel):
    llm_model: Optional[str] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None
    enable_memory: Optional[bool] = None
    enable_voice: Optional[bool] = None


@router.get("")
async def get_settings():
    """Get active configuration and preferences."""
    return {
        "app_name": settings.APP_NAME,
        "app_version": settings.APP_VERSION,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL,
        "ollama_base_url": settings.OLLAMA_BASE_URL,
        "temperature": settings.LLM_TEMPERATURE,
        "top_p": settings.LLM_TOP_P,
        "max_tokens": settings.LLM_MAX_TOKENS,
        "enable_memory": settings.ENABLE_MEMORY,
        "enable_voice": settings.ENABLE_VOICE,
        "enable_demo_mode": settings.ENABLE_DEMO_MODE,
    }


@router.put("")
async def update_settings(req: UpdateSettingsRequest):
    """Update runtime settings."""
    for k, val in req.model_dump(exclude_unset=True).items():
        if val is not None:
            attr = f"LLM_{k.upper()}" if hasattr(settings, f"LLM_{k.upper()}") else k.upper()
            if hasattr(settings, attr):
                setattr(settings, attr, val)
            await SettingsRepository.set(k, str(val).lower() if isinstance(val, bool) else str(val))

    return {"status": "updated", "settings": await get_settings()}
