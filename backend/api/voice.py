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


from backend.config.settings import settings

ALLOWED_AUDIO_SUFFIXES = {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".flac"}


@router.post("/api/voice/tts")
async def synthesize_speech(req: TTSRequest):
    """Synthesize text into high-fidelity MP3/AAC audio."""
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    # 0B.3: Cap TTS text length
    if len(req.text) > settings.MAX_TTS_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Text exceeds maximum allowed length of {settings.MAX_TTS_TEXT_LENGTH} characters.",
        )

    audio_bytes, mime_type, provider = await voice_service.synthesize_speech_with_mime(
        text=req.text,
        voice_key_or_id=req.voice,
        rate=req.rate or "+0%",
        pitch=req.pitch or "+0Hz",
        prefer_local=req.prefer_local,
    )

    if not audio_bytes:
        raise HTTPException(
            status_code=503,
            detail="Speech synthesis temporarily unavailable. Use client-side fallback.",
        )

    # Return audio with appropriate media type and provider header (0B.4)
    return Response(
        content=audio_bytes,
        media_type=mime_type,
        headers={"X-TTS-Provider": provider},
    )


@router.post("/api/voice/transcribe")
async def transcribe_audio(request: Request):
    """Transcribe audio bytes or JSON base64 payload to text using Whisper."""
    content_type = request.headers.get("content-type", "")

    # 0B.3: Check Content-Length header against max payload size
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > settings.MAX_VOICE_PAYLOAD_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"Payload too large. Exceeds maximum size of {settings.MAX_VOICE_PAYLOAD_BYTES} bytes.",
                )
        except ValueError:
            pass

    audio_data = None
    suffix = ".wav"
    lang = "en"

    if "application/json" in content_type:
        body = await request.json()
        b64 = body.get("audio_base64", "")
        if b64:
            # Check base64 string size before decoding
            max_b64_len = int(settings.MAX_VOICE_PAYLOAD_BYTES * 4 / 3) + 4096
            if len(b64) > max_b64_len:
                raise HTTPException(
                    status_code=413,
                    detail=f"Audio payload exceeds maximum size of {settings.MAX_VOICE_PAYLOAD_BYTES} bytes.",
                )
            try:
                audio_data = base64.b64decode(b64, validate=True)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid base64 audio: {e}")

            if len(audio_data) > settings.MAX_VOICE_PAYLOAD_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"Decoded audio exceeds maximum size of {settings.MAX_VOICE_PAYLOAD_BYTES} bytes.",
                )

        suffix = body.get("suffix", ".wav")
        lang = body.get("language", "en")
    else:
        # Raw binary audio body
        audio_data = await request.body()
        if len(audio_data) > settings.MAX_VOICE_PAYLOAD_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"Audio payload exceeds maximum size of {settings.MAX_VOICE_PAYLOAD_BYTES} bytes.",
            )

        if "audio/wav" in content_type or "audio/x-wav" in content_type:
            suffix = ".wav"
        elif "audio/webm" in content_type:
            suffix = ".webm"
        elif "audio/mp4" in content_type or "audio/m4a" in content_type:
            suffix = ".m4a"
        elif "audio/mpeg" in content_type or "audio/mp3" in content_type:
            suffix = ".mp3"
        elif "audio/ogg" in content_type:
            suffix = ".ogg"
        elif "audio/flac" in content_type:
            suffix = ".flac"

    if suffix.lower() not in ALLOWED_AUDIO_SUFFIXES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format '{suffix}'. Allowed: {sorted(list(ALLOWED_AUDIO_SUFFIXES))}",
        )

    if not audio_data:
        raise HTTPException(status_code=400, detail="No audio data provided.")

    res = await whisper_stt.transcribe(audio_data, language=lang, suffix=suffix)
    return res


from backend.api.auth import verify_ws_origin, verify_ws_auth
from backend.utils.logger import get_logger

logger = get_logger("voice_api")


@router.websocket("/ws/voice")
async def voice_websocket_endpoint(websocket: WebSocket):
    """Full-duplex WebSocket endpoint for continuous voice conversation."""
    origin = websocket.headers.get("origin")
    if not verify_ws_origin(origin):
        logger.warning(f"Rejected WS voice connection from unauthorized origin: {origin}")
        await websocket.close(code=4403, reason="Forbidden origin")
        return

    if not verify_ws_auth(websocket):
        logger.warning("Rejected unauthenticated WS voice connection")
        await websocket.close(code=4401, reason="Unauthorized")
        return

    await handle_voice_websocket(websocket)
