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
    model: Optional[str] = "friday-1.0"

@router.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "friday-core",
        "version": "1.0.0",
        "ai_provider": "friday-1.0",
        "model_name": settings.MODEL_NAME,
        "parameters": settings.MODEL_PARAMETERS,
        "active_model": "FRIDAY 1.0 (1.1B Parameters)"
    }

@router.get("/api/models")
async def get_available_models():
    """Returns the dedicated FRIDAY 1.0 SLM details."""
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
            pass

    return {
        "active_provider": "friday-1.0",
        "active_model": "FRIDAY 1.0",
        "parameters": "1.1B Parameters",
        "custom_slm": custom_slm_info,
        "supported_local_presets": [
            {"id": "friday-1.0", "name": "⭐ FRIDAY 1.0 (1.1B Parameters - Custom SLM)", "size": "780 MB"}
        ],
        "providers": ["friday_1_0"]
    }

@router.post("/api/config")
async def update_config(payload: UpdateConfigRequest):
    ai_manager.update_config()
    return {
        "status": "success",
        "active_provider": "friday-1.0",
        "model": "FRIDAY 1.0",
        "parameters": "1.1B"
    }
