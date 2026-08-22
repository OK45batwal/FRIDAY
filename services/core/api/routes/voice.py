from fastapi import APIRouter, Response, Query, Body
from pydantic import BaseModel
from typing import Optional
from services.core.core.voice.text_to_speech import tts_service

router = APIRouter(prefix="/api/voice")

class SpeakRequest(BaseModel):
    text: str
    voice: Optional[str] = "Tara"

@router.get("/speak")
async def speak_text_get(text: str = Query(..., min_length=1), voice: str = Query("Tara")):
    """
    Synthesizes and streams high-definition Studio WAV audio.
    """
    try:
        audio_bytes = await tts_service.synthesize(text, voice)
        if not audio_bytes:
            return Response(content=b"", media_type="audio/wav", status_code=204)
        return Response(content=audio_bytes, media_type="audio/wav")
    except Exception as e:
        return Response(content=b"", media_type="audio/wav", status_code=500)

@router.post("/speak")
async def speak_text_post(payload: SpeakRequest):
    """
    POST endpoint for long text payloads to prevent URL length limits and timeouts.
    """
    try:
        audio_bytes = await tts_service.synthesize(payload.text, payload.voice)
        if not audio_bytes:
            return Response(content=b"", media_type="audio/wav", status_code=204)
        return Response(content=audio_bytes, media_type="audio/wav")
    except Exception as e:
        return Response(content=b"", media_type="audio/wav", status_code=500)
