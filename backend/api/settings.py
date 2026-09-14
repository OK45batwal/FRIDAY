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
    if req.llm_model is not None:
        settings.LLM_MODEL = req.llm_model
        await SettingsRepository.set("llm_model", str(req.llm_model))
    if req.temperature is not None:
        settings.LLM_TEMPERATURE = req.temperature
        await SettingsRepository.set("temperature", str(req.temperature))
    if req.top_p is not None:
        settings.LLM_TOP_P = req.top_p
        await SettingsRepository.set("top_p", str(req.top_p))
    if req.max_tokens is not None:
        settings.LLM_MAX_TOKENS = req.max_tokens
        await SettingsRepository.set("max_tokens", str(req.max_tokens))
    if req.enable_memory is not None:
        settings.ENABLE_MEMORY = req.enable_memory
        await SettingsRepository.set("enable_memory", str(req.enable_memory).lower())
    if req.enable_voice is not None:
        settings.ENABLE_VOICE = req.enable_voice
        await SettingsRepository.set("enable_voice", str(req.enable_voice).lower())

    return {"status": "updated", "settings": await get_settings()}
