from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from services.core.core.voice.speech_to_text import stt_service
from services.core.core.voice.text_to_speech import tts_service

router = APIRouter(prefix="/api/voice")

class TTSRequest(BaseModel):
    text: str

@router.post("/transcribe")
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    transcription = await stt_service.transcribe_audio(audio_bytes, file.filename or "audio.wav")
    return {"text": transcription}

@router.post("/speak")
async def text_to_speech_endpoint(payload: TTSRequest):
    audio_bytes = await tts_service.synthesize(payload.text)
    return {"status": "ok", "text": payload.text, "audio_length": len(audio_bytes)}
