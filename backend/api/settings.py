"""Settings API Endpoints."""

from typing import Optional, Dict
from fastapi import APIRouter
from pydantic import BaseModel, Field
from backend.config.settings import settings
from backend.database.repositories import SettingsRepository
from backend.utils.logger import get_logger

logger = get_logger("settings_api")

router = APIRouter(prefix="/api/settings", tags=["settings"])


class UpdateSettingsRequest(BaseModel):
    llm_model: Optional[str] = Field(None, max_length=100)
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    top_p: Optional[float] = Field(None, ge=0.0, le=1.0)
    max_tokens: Optional[int] = Field(None, ge=1, le=32768)
    enable_memory: Optional[bool] = None
    enable_voice: Optional[bool] = None


def apply_saved_settings(saved: Dict[str, str]):
    """Apply persisted key-value database settings to the settings singleton (Batch P1.1)."""
    for k, val_str in saved.items():
        attr = f"LLM_{k.upper()}" if hasattr(settings, f"LLM_{k.upper()}") else k.upper()
        if hasattr(settings, attr):
            cur = getattr(settings, attr)
            try:
                if isinstance(cur, bool):
                    setattr(settings, attr, val_str.lower() in ("true", "1", "yes"))
                elif isinstance(cur, int):
                    setattr(settings, attr, int(val_str))
                elif isinstance(cur, float):
                    setattr(settings, attr, float(val_str))
                else:
                    setattr(settings, attr, val_str)
                logger.debug(f"Loaded persisted setting {attr}={getattr(settings, attr)}")
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to cast persisted setting {k}='{val_str}': {e}")


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
    """Update runtime settings and persist to database."""
    for k, val in req.model_dump(exclude_unset=True).items():
        if val is not None:
            attr = f"LLM_{k.upper()}" if hasattr(settings, f"LLM_{k.upper()}") else k.upper()
            if hasattr(settings, attr):
                setattr(settings, attr, val)
            await SettingsRepository.set(k, str(val).lower() if isinstance(val, bool) else str(val))

    return {"status": "updated", "settings": await get_settings()}
