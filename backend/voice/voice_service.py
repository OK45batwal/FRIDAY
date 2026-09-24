"""Voice processing service for FRIDAY.

Supports:
1. Free Neural Cloud TTS (edge-tts) when online
2. Native Apple On-Device Neural Speech (macOS 'say' + 'afconvert') for 100% offline & zero network latency
3. Sentence-level streaming synthesis for real-time conversational voice responses
"""

import os
import re
import sys
import shutil
import tempfile
import asyncio
import subprocess
from typing import Dict, Any, Optional, List, AsyncGenerator, Tuple
import edge_tts
from backend.utils.logger import get_logger

logger = get_logger("voice_service")


VOICE_OPTIONS = {
    "aria": {
        "id": "en-US-AriaNeural",
        "macos": "Samantha",
        "label": "FRIDAY Standard (US Aria / Samantha)",
    },
    "sonia": {
        "id": "en-GB-SoniaNeural",
        "macos": "Daniel",
        "label": "JARVIS Style (UK Sonia / Daniel)",
    },
    "jenny": {
        "id": "en-US-JennyNeural",
        "macos": "Karen",
        "label": "Friendly Assistant (US Jenny / Karen)",
    },
    "guy": {
        "id": "en-US-GuyNeural",
        "macos": "Alex",
        "label": "Technical Male (US Guy / Alex)",
    },
    "neerja": {
        "id": "en-IN-NeerjaNeural",
        "macos": "Aman",
        "label": "Indian English (IN Neerja / Aman)",
    },
}


class VoiceService:
    def __init__(self):
        self.enabled = True
        self.default_voice = "en-US-AriaNeural"
        self._has_say = sys.platform == "darwin" and shutil.which("say") is not None
        self._has_afconvert = sys.platform == "darwin" and shutil.which("afconvert") is not None

    def clean_text_for_speech(self, text: str) -> str:
        """Strip markdown code blocks, links, and formatting symbols for natural vocalization."""
        # Replace code blocks with simple description
        t = re.sub(r"```[\s\S]*?```", " [Code omitted] ", text)
        # Remove inline backticks
        t = re.sub(r"`([^`]+)`", r"\1", t)
        # Remove markdown links, keep text
        t = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", t)
        # Remove markdown headers and formatting symbols
        t = re.sub(r"[*_#~>|]", " ", t)
        # Remove raw URLs
        t = re.sub(r"https?://\S+", "", t)
        # Normalize whitespace
        t = re.sub(r"\s+", " ", t).strip()
        return t

    def split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences suitable for incremental audio synthesis."""
        clean = self.clean_text_for_speech(text)
        if not clean:
            return []
        # Split on sentence boundaries (. ! ? \n) followed by space or end
        parts = re.split(r"(?<=[.!?\n])\s+", clean)
        sentences = [p.strip() for p in parts if p.strip()]
        return sentences

    def get_voices(self) -> List[Dict[str, str]]:
        """Return list of available high-fidelity neural voices."""
        return [
            {"key": k, "id": v["id"], "macos": v.get("macos", ""), "label": v["label"]}
            for k, v in VOICE_OPTIONS.items()
        ]

    def _synthesize_local_macos(self, clean_text: str, voice_key: str = "aria") -> Optional[Tuple[bytes, str]]:
        """Synthesize using native macOS on-device speech engine (zero network, fast)."""
        if not self._has_say:
            return None

        # Resolve macOS voice name
        macos_voice = "Samantha"
        if voice_key in VOICE_OPTIONS:
            macos_voice = VOICE_OPTIONS[voice_key].get("macos", "Samantha")
        elif voice_key.lower() in ("daniel", "jarvis", "sonia"):
            macos_voice = "Daniel"
        elif voice_key.lower() in ("aman", "neerja"):
            macos_voice = "Aman"
        elif voice_key.lower() in ("karen", "jenny"):
            macos_voice = "Karen"

        try:
            with tempfile.NamedTemporaryFile(suffix=".aiff", delete=False) as f_aiff:
                aiff_path = f_aiff.name

            # Run say
            subprocess.run(
                ["say", "-v", macos_voice, "-o", aiff_path, clean_text],
                check=True,
                capture_output=True,
                timeout=15.0,
            )

            # Convert to AAC m4a if afconvert available for high compression, or wave
            if self._has_afconvert:
                with tempfile.NamedTemporaryFile(suffix=".m4a", delete=False) as f_out:
                    out_path = f_out.name
                subprocess.run(
                    ["afconvert", "-f", "m4af", "-d", "aac", aiff_path, out_path],
                    check=True,
                    capture_output=True,
                    timeout=10.0,
                )
                with open(out_path, "rb") as fp:
                    audio_bytes = fp.read()
                try:
                    os.remove(out_path)
                except OSError:
                    pass
                mime_type = "audio/mp4"
            else:
                with open(aiff_path, "rb") as fp:
                    audio_bytes = fp.read()
                mime_type = "audio/aiff"

            try:
                os.remove(aiff_path)
            except OSError:
                pass

            if audio_bytes:
                logger.info(f"Local macOS on-device TTS success ({macos_voice}): {len(audio_bytes)} bytes")
                return (audio_bytes, mime_type)

        except Exception as e:
            logger.warning(f"Local macOS TTS fallback error: {e}")

        return None

    async def synthesize_speech_with_mime(
        self,
        text: str,
        voice_key_or_id: Optional[str] = None,
        rate: str = "+0%",
        pitch: str = "+0Hz",
        prefer_local: Optional[bool] = None,
    ) -> Tuple[Optional[bytes], str, str]:
        """Synthesize text to audio bytes and return (audio_bytes, mime_type, provider).

        Provider is 'local', 'cloud', or 'none'.
        Local on-device TTS is prioritized by default (0B.4).
        Cloud edge-tts is only invoked when TTS_ALLOW_CLOUD=True.
        """
        from backend.config.settings import settings

        clean_text = self.clean_text_for_speech(text)
        if not clean_text:
            return None, "audio/mpeg", "none"

        # Truncate very long responses for conversational voice (limit ~1200 chars)
        if len(clean_text) > 1200:
            clean_text = clean_text[:1200] + " ... and additional details are displayed on screen."

        voice_key = "aria"
        voice_id = self.default_voice
        if voice_key_or_id:
            if voice_key_or_id in VOICE_OPTIONS:
                voice_key = voice_key_or_id
                voice_id = VOICE_OPTIONS[voice_key_or_id]["id"]
            else:
                for k, v in VOICE_OPTIONS.items():
                    if v["id"] == voice_key_or_id:
                        voice_key = k
                        voice_id = voice_key_or_id
                        break

        allow_cloud = getattr(settings, "TTS_ALLOW_CLOUD", False)
        # Default prefer_local to True if TTS_MODE=local or cloud is disabled (0B.4)
        if prefer_local is None:
            prefer_local = (getattr(settings, "TTS_MODE", "local") == "local" or not allow_cloud)

        # 1. Local-first: if prefer_local or cloud disabled, synthesize on-device (zero network)
        if (prefer_local or not allow_cloud) and self._has_say:
            res = await asyncio.to_thread(self._synthesize_local_macos, clean_text, voice_key=voice_key)
            if res:
                return res[0], res[1], "local"

        # 2. Try high-fidelity free Neural TTS ONLY when cloud is explicitly enabled (0B.4)
        if allow_cloud:
            try:
                logger.info(f"Synthesizing voice with cloud Neural TTS {voice_id} ({len(clean_text)} chars)...")
                communicate = edge_tts.Communicate(clean_text, voice=voice_id, rate=rate, pitch=pitch)
                audio_chunks = []
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        audio_chunks.append(chunk["data"])

                if audio_chunks:
                    audio_bytes = b"".join(audio_chunks)
                    logger.info(f"Cloud TTS synthesis complete: {len(audio_bytes)} bytes.")
                    return audio_bytes, "audio/mpeg", "cloud"

            except Exception as e:
                logger.info(f"Neural cloud TTS unavailable ({e}), falling back to local on-device engine...")

        # 3. Fallback to local on-device engine (macOS say)
        if self._has_say:
            local_res = await asyncio.to_thread(self._synthesize_local_macos, clean_text, voice_key=voice_key)
            if local_res:
                return local_res[0], local_res[1], "local"

        return None, "audio/mpeg", "none"

    async def synthesize_speech(
        self,
        text: str,
        voice_key_or_id: Optional[str] = None,
        rate: str = "+0%",
        pitch: str = "+0Hz",
        prefer_local: Optional[bool] = None,
    ) -> Optional[bytes]:
        """Synthesize text to audio bytes with local-first or cloud neural fallback."""
        audio_bytes, _, _ = await self.synthesize_speech_with_mime(
            text=text,
            voice_key_or_id=voice_key_or_id,
            rate=rate,
            pitch=pitch,
            prefer_local=prefer_local,
        )
        return audio_bytes

    async def stream_sentence_audio(
        self,
        text_stream: AsyncGenerator[str, None],
        voice_key_or_id: Optional[str] = None,
    ) -> AsyncGenerator[Tuple[str, bytes, str], None]:
        """Buffer incoming token stream into sentences and yield synthesized audio chunks in real-time.

        Yields: (sentence_text, audio_bytes, mime_type)
        """
        buffer = ""
        sentence_count = 0

        async for token in text_stream:
            buffer += token
            # Check for sentence end: punctuation followed by whitespace or newline
            match = re.search(r"([.!?\n])\s+", buffer)
            if match and len(buffer[: match.end()].strip()) > 5:
                sentence = buffer[: match.end()].strip()
                buffer = buffer[match.end() :]
                sentence_clean = self.clean_text_for_speech(sentence)
                if sentence_clean:
                    audio = await self.synthesize_speech(sentence_clean, voice_key_or_id=voice_key_or_id)
                    if audio:
                        sentence_count += 1
                        yield (sentence_clean, audio, "audio/mpeg")

        # Yield any remaining text in the buffer
        remaining = buffer.strip()
        if remaining:
            sentence_clean = self.clean_text_for_speech(remaining)
            if sentence_clean:
                audio = await self.synthesize_speech(sentence_clean, voice_key_or_id=voice_key_or_id)
                if audio:
                    yield (sentence_clean, audio, "audio/mpeg")


# Global VoiceService singleton
voice_service = VoiceService()
