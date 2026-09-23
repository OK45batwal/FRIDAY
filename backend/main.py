"""Main FastAPI Application Entrypoint for FRIDAY."""

import os
import sys
import asyncio
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config.settings import settings, validate_settings
from backend.database.database import init_db
from backend.api.health import router as health_router
from backend.api.conversations import router as conversations_router
from backend.api.memory import router as memory_router
from backend.api.tools import router as tools_router
from backend.api.settings import router as settings_router
from backend.api.chat import router as chat_router
from backend.api.voice import router as voice_router
from backend.api.translate import router as translate_router
from backend.api.onboarding import router as onboarding_router
from backend.ai.laya_brain import laya_brain
from backend.utils.logger import get_logger

# Import PyTorch model runner for legacy/testing tab
from model.generate import generate_stream
from tokenizer.tokenizer import Tokenizer
from train.checkpoint import load_checkpoint
import torch

logger = get_logger("main")

WEB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "web")

PYTORCH_MODEL = None
PYTORCH_TOKENIZER = None
DEVICE = None


def init_pytorch_model():
    """Optionally load the 17.5M PyTorch transformer for the research lab tab."""
    global PYTORCH_MODEL, PYTORCH_TOKENIZER, DEVICE
    if torch.backends.mps.is_available():
        DEVICE = torch.device("mps")
    elif torch.cuda.is_available():
        DEVICE = torch.device("cuda")
    else:
        DEVICE = torch.device("cpu")

    ckpt_path = "checkpoints/best_model.pt"
    if os.path.exists(ckpt_path):
        try:
            PYTORCH_MODEL, _ = load_checkpoint(ckpt_path, DEVICE)
            PYTORCH_MODEL.eval()
            PYTORCH_TOKENIZER = Tokenizer("gpt2")
            logger.info(f"Loaded PyTorch 17.5M model on {DEVICE}")
        except Exception as e:
            logger.warning(f"Could not load PyTorch checkpoint: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_settings()
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    await init_db()
    init_pytorch_model()
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

# CORS: Allow all local development interfaces and common web ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:8080",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:4173",
        "http://localhost:4173",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health_router)
app.include_router(conversations_router)
app.include_router(memory_router)
app.include_router(tools_router)
app.include_router(settings_router)
app.include_router(chat_router)
app.include_router(voice_router)
app.include_router(translate_router)
app.include_router(onboarding_router)


# PyTorch 17.5M Model API for Neural Lab tab
@app.get("/api/info")
async def get_model_info():
    return {
        "scratch_model": {
            "model_name": "FRIDAY-Tiny",
            "parameters_formatted": "17.59M",
            "device_name": f"Apple Silicon Metal ({DEVICE})" if DEVICE else "CPU",
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
