from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from pathlib import Path
import json
from services.core.core.ai.manager import ai_manager
from services.core.app.config import settings

router = APIRouter()

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"
MANIFEST_FILE = MODELS_DIR / "model_manifest.json"

class UpdateConfigRequest(BaseModel):
    provider: str
    api_key: Optional[str] = None
    model: Optional[str] = None
    base_url: Optional[str] = None

@router.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "friday-core",
        "version": "0.1.0",
        "ai_provider": ai_manager.get_active_provider().name,
        "active_model": settings.OLLAMA_MODEL if ai_manager.get_active_provider().name in ["local_llm", "ollama"] else settings.OPENROUTER_MODEL
    }

@router.get("/api/models")
async def get_available_models():
    """Discover installed local models, custom SLM, and registered providers."""
    custom_slm_info = None
    if MANIFEST_FILE.exists():
        try:
            with open(MANIFEST_FILE, "r") as f:
                custom_slm_info = json.load(f)
        except Exception:
            pass

    return {
        "active_provider": ai_manager.get_active_provider().name,
        "custom_slm": custom_slm_info,
        "supported_local_presets": [
            {"id": "friday-1b-custom", "name": "⭐ FRIDAY-1B (Our Custom SLM - Trained for Mac & Android)", "size": "780 MB"},
            {"id": "llama3.2:3b", "name": "Meta: Llama 3.2 (3B - Fast)", "size": "1.8 GB"},
            {"id": "llama3.2:1b", "name": "Meta: Llama 3.2 (1B - Ultra-Lightweight)", "size": "0.8 GB"},
            {"id": "qwen2.5:3b", "name": "Alibaba: Qwen 2.5 (3B - Code & Math)", "size": "1.9 GB"},
            {"id": "deepseek-r1:1.5b", "name": "DeepSeek: R1 Distill (1.5B - Reasoning)", "size": "1.1 GB"}
        ],
        "providers": ai_manager.list_providers()
    }

@router.post("/api/config")
async def update_config(payload: UpdateConfigRequest):
    if payload.base_url and payload.provider in ["ollama", "local", "local_llm"]:
        settings.OLLAMA_BASE_URL = payload.base_url

    ai_manager.update_config(
        provider=payload.provider,
        api_key=payload.api_key,
        model=payload.model
    )
    return {
        "status": "success",
        "active_provider": ai_manager.get_active_provider().name,
        "model": payload.model,
        "base_url": settings.OLLAMA_BASE_URL if payload.provider in ["ollama", "local", "local_llm"] else None
    }
