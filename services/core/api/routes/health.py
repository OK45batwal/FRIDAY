from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
from pathlib import Path
import json
from services.core.core.ai.manager import ai_manager
from services.core.app.config import settings

router = APIRouter()

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"
MANIFEST_FILE = MODELS_DIR / "model_manifest.json"

class UpdateConfigRequest(BaseModel):
    provider: Optional[str] = "local_llm"
    api_key: Optional[str] = None
    model: Optional[str] = None

@router.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "friday-core",
        "version": "1.0.0",
        "ai_provider": settings.AI_PROVIDER,
        "model_name": settings.OPENROUTER_MODEL if settings.AI_PROVIDER == "openrouter" else settings.MODEL_NAME,
        "parameters": "Frontier Cloud" if settings.AI_PROVIDER != "local_llm" else settings.MODEL_PARAMETERS,
        "active_model": settings.OPENROUTER_MODEL if settings.AI_PROVIDER == "openrouter" else "FRIDAY 1.0 (1.1B Parameters)"
    }

@router.get("/api/models")
async def get_available_models():
    """Returns available local and cloud frontier models."""
    custom_slm_info = {
        "model_id": "friday-1.0",
        "name": "FRIDAY 1.0",
        "parameters": "1.1 Billion Parameters (1.1B)",
        "quantization": "Q4_K_M (4-bit)",
        "ram_required_mb": 780,
        "format": "GGUF",
        "status": "active"
    }

    if MANIFEST_FILE.exists():
        try:
            with open(MANIFEST_FILE, "r") as f:
                custom_slm_info = json.load(f)
        except Exception:
            pass

    return {
        "active_provider": settings.AI_PROVIDER,
        "active_model": settings.OPENROUTER_MODEL if settings.AI_PROVIDER == "openrouter" else settings.MODEL_NAME,
        "custom_slm": custom_slm_info,
        "has_openrouter_key": bool(settings.OPENROUTER_API_KEY),
        "has_gemini_key": bool(settings.GEMINI_API_KEY),
        "cloud_models": [
            {"id": "google/gemini-2.0-flash-001", "name": "⚡ Google: Gemini 2.0 Flash (Fast & Smart)"},
            {"id": "anthropic/claude-3.5-sonnet", "name": "🧠 Anthropic: Claude 3.5 Sonnet (State-of-the-Art Reasoning)"},
            {"id": "openai/gpt-4o-mini", "name": "🔥 OpenAI: GPT-4o Mini (ChatGPT Intelligence)"},
            {"id": "meta-llama/llama-3.3-70b-instruct", "name": "🦙 Meta: Llama 3.3 (70B Instruct)"}
        ],
        "providers": ["local_llm", "openrouter", "gemini"]
    }

@router.post("/api/config")
async def update_config(payload: UpdateConfigRequest):
    ai_manager.update_config(
        provider=payload.provider or "local_llm",
        api_key=payload.api_key,
        model=payload.model
    )
    return {
        "status": "success",
        "active_provider": settings.AI_PROVIDER,
        "model": settings.OPENROUTER_MODEL if settings.AI_PROVIDER == "openrouter" else settings.MODEL_NAME
    }
