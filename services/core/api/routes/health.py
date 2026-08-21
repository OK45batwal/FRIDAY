from fastapi import APIRouter
from services.core.core.ai.manager import ai_manager

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "friday-core",
        "version": "0.1.0",
        "ai_provider": ai_manager.get_active_provider().name
    }
