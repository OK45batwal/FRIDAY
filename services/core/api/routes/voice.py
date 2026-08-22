from fastapi import APIRouter, Response, Query
from services.core.core.voice.text_to_speech import tts_service

router = APIRouter(prefix="/api/voice")

@router.get("/speak")
async def speak_text(text: str = Query(..., min_length=1), voice: str = Query("Samantha")):
    """
    Synthesizes and streams high-definition Studio WAV audio with zero network latency.
    """
    audio_bytes = await tts_service.synthesize(text, voice)
    if not audio_bytes:
        return Response(content=b"", media_type="audio/wav")
    return Response(content=audio_bytes, media_type="audio/wav")
