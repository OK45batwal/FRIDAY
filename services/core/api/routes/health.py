from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from pathlib import Path
import json
import logging
from services.core.core.ai.manager import ai_manager
from services.core.app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"
MANIFEST_FILE = MODELS_DIR / "model_manifest.json"


class UpdateConfigRequest(BaseModel):
    # Bounded so an oversized body cannot be parsed into settings.
    provider: Optional[str] = Field(default="local_llm", max_length=64)
    api_key: Optional[str] = Field(default=None, max_length=256)
    model: Optional[str] = Field(default=None, max_length=128)

@router.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "friday-core",
        "version": "1.0.0",
        "ai_provider": settings.AI_PROVIDER,
        "active_model": settings.OPENROUTER_MODEL if settings.AI_PROVIDER == "openrouter" else settings.MODEL_NAME
    }

@router.get("/api/models")
async def get_available_models():
    """Returns available local and cloud models."""
    custom_slm_info = {
        "model_id": "friday-1.0",
        "name": "FRIDAY 1.0",
        "parameters": "1.1 Billion Parameters (1.1B)",
        "quantization": "Q4_K_M (4-bit)",
        "ram_required_mb": 780,
        "format": "GGUF",
        "status": "active_primary"
    }

    if MANIFEST_FILE.exists():
        try:
            with open(MANIFEST_FILE, "r") as f:
                custom_slm_info = json.load(f)
        except Exception:
            logger.warning("Could not read model manifest at %s", MANIFEST_FILE, exc_info=True)

    return {
        "active_provider": settings.AI_PROVIDER,
        "active_model": settings.OPENROUTER_MODEL if settings.AI_PROVIDER == "openrouter" else "FRIDAY 1.0",
        "has_cloud_key": bool(settings.OPENROUTER_API_KEY),
        "custom_slm": custom_slm_info,
        "cloud_models": [
            {"id": "meta-llama/llama-3.3-70b-instruct:free", "name": "Meta: Llama 3.3 (70B - Free Cloud Frontier)", "provider": "OpenRouter"},
            {"id": "openai/gpt-4o-mini", "name": "OpenAI: ChatGPT (GPT-4o Mini)", "provider": "OpenRouter"},
            {"id": "google/gemini-2.0-flash-exp:free", "name": "Google: Gemini 2.0 Flash (Free)", "provider": "OpenRouter"},
            {"id": "anthropic/claude-3.5-sonnet", "name": "Anthropic: Claude 3.5 Sonnet", "provider": "OpenRouter"},
            {"id": "deepseek/deepseek-r1", "name": "DeepSeek: R1 (Reasoning Master)", "provider": "OpenRouter"}
        ],
        "supported_local_presets": [
            {"id": "friday-1.0", "name": "⭐ FRIDAY 1.0 (1.1B Parameters - Custom On-Device SLM)", "size": "780 MB"}
        ],
        "providers": ["local_llm", "openrouter"]
    }

@router.post("/api/config")
async def update_config(payload: UpdateConfigRequest):
    try:
        ai_manager.update_config(
            provider=payload.provider or "local_llm",
            api_key=payload.api_key,
            model=payload.model
        )
    except ValueError as e:
        # Reject bad input instead of reporting success for a config change that
        # silently broke routing.
        raise HTTPException(status_code=422, detail=str(e))
    return {
        "status": "success",
        "active_provider": settings.AI_PROVIDER,
        # Never echo the key back, not even masked.
        "has_cloud_key": bool(settings.OPENROUTER_API_KEY),
        "model": settings.OPENROUTER_MODEL if settings.AI_PROVIDER == "openrouter" else "FRIDAY 1.0"
    }
