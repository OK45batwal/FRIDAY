"""Main FastAPI Application Entrypoint for FRIDAY."""

import os
import sys
import asyncio
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config.settings import settings, validate_settings
from backend.database.database import init_db
from backend.api.auth import require_api_key, ALLOWED_ORIGINS
from backend.api.health import router as health_router
from backend.api.conversations import router as conversations_router
from backend.api.memory import router as memory_router
from backend.api.tools import router as tools_router
from backend.api.settings import router as settings_router
from backend.api.chat import router as chat_router
from backend.api.voice import router as voice_router
from backend.api.translate import router as translate_router
from backend.api.onboarding import router as onboarding_router
from backend.api.devices import router as devices_router
from backend.ai.laya_brain import laya_brain
from backend.utils.logger import get_logger

logger = get_logger("main")

WEB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "web")


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_settings()
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    await init_db()
    # Batch P1.1: Load and apply persisted settings before routers consume them
    try:
        from backend.database.repositories import SettingsRepository
        from backend.api.settings import apply_saved_settings
        saved_settings = await SettingsRepository.get_all()
        if saved_settings:
            apply_saved_settings(saved_settings)
            logger.info(f"Loaded {len(saved_settings)} persisted setting(s) on startup.")
    except Exception as e:
        logger.warning(f"Failed to load persisted settings on startup: {e}")

    if settings.ENABLE_LAYA and settings.LAYA_PRELOAD:
        # Preload Laya non-autoregressive decision model in background
        asyncio.create_task(laya_brain.ensure_loaded())
    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="FRIDAY — Autonomous Local AI Assistant & Presentation System",
    lifespan=lifespan,
)

# CORS: Explicit allowed local origins only, no broad regex (CR-01, 0A.5)
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(list(ALLOWED_ORIGINS)),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-API-Key", "Authorization"],
)

# Include API Routers (health is public; other routers require API key when set)
app.include_router(health_router)
app.include_router(conversations_router, dependencies=[Depends(require_api_key)])
app.include_router(memory_router, dependencies=[Depends(require_api_key)])
app.include_router(tools_router, dependencies=[Depends(require_api_key)])
app.include_router(settings_router, dependencies=[Depends(require_api_key)])
app.include_router(chat_router, dependencies=[Depends(require_api_key)])
app.include_router(voice_router, dependencies=[Depends(require_api_key)])
app.include_router(translate_router, dependencies=[Depends(require_api_key)])
app.include_router(onboarding_router, dependencies=[Depends(require_api_key)])
app.include_router(devices_router, dependencies=[Depends(require_api_key)])


# PyTorch 17.5M Model API for Neural Lab tab
@app.get("/api/info", dependencies=[Depends(require_api_key)])
async def get_model_info():
    return {
        "scratch_model": {
            "model_name": "FRIDAY-Tiny",
            "parameters_formatted": "17.59M",
            "device_name": "Apple Silicon Metal (MPS)" if sys.platform == "darwin" else "CPU",
            "dim": 256,
            "n_layers": 6,
            "n_heads": 8,
            "n_kv_heads": 4,
            "vocab_size": 50257,
        },
        "agent_model": {
            "model_name": f"Google {settings.LLM_MODEL}",
            "parameters_formatted": "2.6B",
            "engine": "Local Ollama Engine",
            "device_name": "Apple Silicon Metal (MPS)",
        },
        "decision_model": {
            "model_name": "Laya System 1 Router",
            "checkpoint": settings.LAYA_CHECKPOINT,
            "parameters_formatted": "421M",
            "architecture": "ModernBERT-large Non-Autoregressive Classifier",
            "enabled": settings.ENABLE_LAYA,
            "loaded": laya_brain.is_loaded,
            "device": str(laya_brain.agent.device) if laya_brain.agent else (settings.LAYA_DEVICE or "auto"),
            "confidence_threshold": settings.LAYA_CONFIDENCE_THRESHOLD,
        },
    }


# Mount Web UI Static Directory
if os.path.exists(WEB_DIR):
    app.mount("/web", StaticFiles(directory=WEB_DIR), name="web_prefix")
    app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="web")


def run():
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
    )


if __name__ == "__main__":
    run()
