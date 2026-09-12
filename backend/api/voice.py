"""Voice Synthesis & Recognition API Endpoints and WebSocket Pipeline."""

import base64
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Response, WebSocket, Request
from backend.voice.voice_service import voice_service
from backend.voice.whisper_stt import whisper_stt
from backend.voice.voice_pipeline import handle_voice_websocket

router = APIRouter(tags=["voice"])


class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "aria"
    rate: Optional[str] = "+0%"
    pitch: Optional[str] = "+0Hz"
    prefer_local: Optional[bool] = False


class TranscribeRequest(BaseModel):
    audio_base64: str
    language: Optional[str] = "en"
    suffix: Optional[str] = ".wav"


@router.get("/api/voice/status")
async def get_voice_status():
    """Return voice pipeline readiness (STT and TTS engines)."""
    return {
        "tts_available": True,
        "voices": voice_service.get_voices(),
        "stt": whisper_stt.get_status(),
    }


@router.get("/api/voice/voices")
async def get_available_voices():
    """Return list of high-fidelity neural and on-device voices."""
    return {"voices": voice_service.get_voices()}


@router.post("/api/voice/tts")
async def synthesize_speech(req: TTSRequest):
    """Synthesize text into high-fidelity MP3/AAC audio."""
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    audio_bytes, mime_type = await voice_service.synthesize_speech_with_mime(
        text=req.text,
        voice_key_or_id=req.voice,
        rate=req.rate or "+0%",
        pitch=req.pitch or "+0Hz",
        prefer_local=req.prefer_local or False,
    )

    if not audio_bytes:
        raise HTTPException(
            status_code=503,
            detail="Speech synthesis temporarily unavailable. Use client-side fallback.",
        )

    # Return audio with appropriate media type
    return Response(content=audio_bytes, media_type=mime_type)


@router.post("/api/voice/transcribe")
async def transcribe_audio(request: Request):
    """Transcribe audio bytes or JSON base64 payload to text using Whisper."""
    content_type = request.headers.get("content-type", "")

    audio_data = None
    suffix = ".wav"
    lang = "en"

    if "application/json" in content_type:
        body = await request.json()
        b64 = body.get("audio_base64", "")
        if b64:
            try:
                audio_data = base64.b64decode(b64)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid base64 audio: {e}")
        suffix = body.get("suffix", ".wav")
        lang = body.get("language", "en")
    else:
        # Raw binary audio body
        audio_data = await request.body()
        if "audio/wav" in content_type or "audio/x-wav" in content_type:
            suffix = ".wav"
        elif "audio/webm" in content_type:
            suffix = ".webm"
        elif "audio/mp4" in content_type or "audio/m4a" in content_type:
            suffix = ".m4a"

    if not audio_data:
        raise HTTPException(status_code=400, detail="No audio data provided.")

    res = await whisper_stt.transcribe(audio_data, language=lang, suffix=suffix)
    return res


@router.websocket("/ws/voice")
async def voice_websocket_endpoint(websocket: WebSocket):
    """Full-duplex WebSocket endpoint for continuous voice conversation."""
    await handle_voice_websocket(websocket)
