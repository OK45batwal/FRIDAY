import logging

from fastapi import APIRouter, Response, Query, Body
from pydantic import BaseModel, Field
from typing import Optional
from services.core.core.voice.text_to_speech import tts_service, MAX_SPEECH_CHARS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice")

# Bound at the edge. normalize_text_for_speech truncates to MAX_SPEECH_CHARS
# anyway, but only after the whole body has been parsed and held in memory.
MAX_TEXT_CHARS = MAX_SPEECH_CHARS * 4
# Voice names reach `say -v <name>` as a separate argv element, so they cannot
# inject options, but they are also cache keys — keep them small and boring.
VOICE_PATTERN = r"^[A-Za-z][A-Za-z0-9 _\-()]{0,48}$"


class SpeakRequest(BaseModel):
    text: str = Field(min_length=1, max_length=MAX_TEXT_CHARS)
    voice: Optional[str] = Field(default="Tara", pattern=VOICE_PATTERN)


@router.get("/speak")
async def speak_text_get(
    text: str = Query(..., min_length=1, max_length=MAX_TEXT_CHARS),
    voice: str = Query("Tara", pattern=VOICE_PATTERN),
):
    """
    Synthesizes and streams high-definition Studio WAV audio.
    """
    return await _speak(text, voice)


@router.post("/speak")
async def speak_text_post(payload: SpeakRequest):
    """
    POST endpoint for long text payloads to prevent URL length limits and timeouts.
    """
    return await _speak(payload.text, payload.voice or "Tara")


async def _speak(text: str, voice: str) -> Response:
    try:
        audio_bytes = await tts_service.synthesize(text, voice)
    except Exception:
        # Was swallowed with a bare `except Exception as e` and an unused `e`,
        # so synthesis failures were invisible in the logs.
        logger.warning("Speech synthesis failed", exc_info=True)
        return Response(content=b"", media_type="audio/wav", status_code=500)

    if not audio_bytes:
        return Response(content=b"", media_type="audio/wav", status_code=204)
    return Response(content=audio_bytes, media_type="audio/wav")
