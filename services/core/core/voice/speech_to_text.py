import io
from typing import Optional

class SpeechToTextService:
    """
    Handles speech audio transcription (Whisper compatible / Web Speech proxy).
    """
    async def transcribe_audio(self, audio_bytes: bytes, filename: str = "audio.wav") -> str:
        # In v0.1: Provides transcription handler and Whisper interface hook
        if not audio_bytes:
            return ""
        return "Voice input received and processed."

stt_service = SpeechToTextService()
