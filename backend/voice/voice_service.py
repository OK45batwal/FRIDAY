"""Voice processing service for FRIDAY."""

import re
import asyncio
from typing import Dict, Any, Optional, List
import edge_tts
from backend.utils.logger import get_logger

logger = get_logger("voice_service")


VOICE_OPTIONS = {
    "aria": {"id": "en-US-AriaNeural", "label": "FRIDAY Standard (US Aria - Futuristic)"},
    "sonia": {"id": "en-GB-SoniaNeural", "label": "JARVIS Style (UK Sonia - British)"},
    "jenny": {"id": "en-US-JennyNeural", "label": "Friendly Assistant (US Jenny)"},
    "guy": {"id": "en-US-GuyNeural", "label": "Technical Male (US Guy)"},
    "neerja": {"id": "en-IN-NeerjaNeural", "label": "Indian English (IN Neerja)"},
}


class VoiceService:
    def __init__(self):
        self.enabled = True
        self.default_voice = "en-US-AriaNeural"

    def clean_text_for_speech(self, text: str) -> str:
        """Strip markdown code blocks, links, and formatting symbols for natural vocalization."""
        # Replace code blocks with simple description
        t = re.sub(r"```[\s\S]*?```", " [Code omitted] ", text)
        # Remove inline backticks
        t = re.sub(r"`([^`]+)`", r"\1", t)
        # Remove markdown links, keep text
        t = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", t)
        # Remove markdown symbols
        t = re.sub(r"[*_#~>|]", " ", t)
        # Remove raw URLs
        t = re.sub(r"https?://\S+", "", t)
        # Normalize whitespace
        t = re.sub(r"\s+", " ", t).strip()
        return t

    def get_voices(self) -> List[Dict[str, str]]:
        """Return list of available high-fidelity neural voices."""
        return [
            {"key": k, "id": v["id"], "label": v["label"]}
            for k, v in VOICE_OPTIONS.items()
        ]

    async def synthesize_speech(
        self,
        text: str,
        voice_key_or_id: Optional[str] = None,
        rate: str = "+0%",
        pitch: str = "+0Hz",
    ) -> Optional[bytes]:
        """Synthesize text to high-quality MP3 audio bytes using free Neural TTS."""
        clean_text = self.clean_text_for_speech(text)
        if not clean_text:
            return None

        # Truncate very long responses for conversational voice (limit ~800 chars)
        if len(clean_text) > 800:
            clean_text = clean_text[:800] + " ... and additional details are displayed on screen."

        # Resolve voice ID
        voice_id = self.default_voice
        if voice_key_or_id:
            if voice_key_or_id in VOICE_OPTIONS:
                voice_id = VOICE_OPTIONS[voice_key_or_id]["id"]
            elif any(v["id"] == voice_key_or_id for v in VOICE_OPTIONS.values()):
                voice_id = voice_key_or_id

        try:
            logger.info(f"Synthesizing voice with {voice_id} ({len(clean_text)} chars)...")
            communicate = edge_tts.Communicate(clean_text, voice=voice_id, rate=rate, pitch=pitch)
            audio_chunks = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_chunks.append(chunk["data"])

            if audio_chunks:
                audio_bytes = b"".join(audio_chunks)
                logger.info(f"TTS synthesis complete: {len(audio_bytes)} bytes.")
                return audio_bytes

        except Exception as e:
            logger.warning(f"Neural TTS failed ({e}). Frontend will fall back to local SpeechSynthesis.")

        return None


# Global VoiceService singleton
voice_service = VoiceService()

