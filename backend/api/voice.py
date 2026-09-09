"""Voice Synthesis & Recognition API Endpoints."""

from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Response
from backend.voice.voice_service import voice_service

router = APIRouter(prefix="/api/voice", tags=["voice"])


class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "aria"
    rate: Optional[str] = "+0%"
    pitch: Optional[str] = "+0Hz"


@router.get("/voices")
async def get_available_voices():
    """Return list of free high-fidelity neural voices."""
    return {"voices": voice_service.get_voices()}


@router.post("/tts")
async def synthesize_speech(req: TTSRequest):
    """Synthesize text into high-fidelity neural MP3 audio."""
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    audio_bytes = await voice_service.synthesize_speech(
        text=req.text,
        voice_key_or_id=req.voice,
        rate=req.rate or "+0%",
        pitch=req.pitch or "+0Hz",
    )

    if not audio_bytes:
        raise HTTPException(
            status_code=503,
            detail="Speech synthesis temporarily unavailable. Use client-side fallback.",
        )

    return Response(content=audio_bytes, media_type="audio/mpeg")
