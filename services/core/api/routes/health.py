from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from services.core.core.ai.manager import ai_manager
from services.core.core.ai.providers.ollama_provider import OllamaProvider
from services.core.app.config import settings

router = APIRouter()

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
        "active_model": settings.OLLAMA_MODEL if ai_manager.get_active_provider().name == "ollama" else settings.OPENROUTER_MODEL
    }

@router.get("/api/models")
async def get_available_models():
    """Discover installed local models and registered providers."""
    ollama_provider = ai_manager._providers.get("ollama")
    local_models = []
    if isinstance(ollama_provider, OllamaProvider):
        local_models = await ollama_provider.list_local_models()

    return {
        "active_provider": ai_manager.get_active_provider().name,
        "local_models": local_models,
        "supported_local_presets": [
            {"id": "llama3.2:3b", "name": "Meta: Llama 3.2 (3B - Recommended for Mac & Android)", "size": "1.8 GB"},
            {"id": "llama3.2:1b", "name": "Meta: Llama 3.2 (1B - Ultra-Lightweight)", "size": "0.8 GB"},
            {"id": "qwen2.5:3b", "name": "Alibaba: Qwen 2.5 (3B - Code & Math)", "size": "1.9 GB"},
            {"id": "deepseek-r1:1.5b", "name": "DeepSeek: R1 Distill (1.5B - Reasoning)", "size": "1.1 GB"},
            {"id": "gemma2:2b", "name": "Google: Gemma 2 (2.6B - Mobile Optimized)", "size": "1.6 GB"}
        ],
        "providers": ai_manager.list_providers()
    }

@router.post("/api/config")
async def update_config(payload: UpdateConfigRequest):
    if payload.base_url and payload.provider == "ollama":
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
        "base_url": settings.OLLAMA_BASE_URL if payload.provider == "ollama" else None
    }
