"""Local Whisper Speech-to-Text (STT) Engine for FRIDAY.

Provides on-device neural speech transcription using faster-whisper / whisper if installed,
with graceful status reporting and client-side Web Audio fallback.
"""

import os
import io
import tempfile
from typing import Optional, Dict, Any
from backend.utils.logger import get_logger

logger = get_logger("whisper_stt")


class WhisperSTTEngine:
    """Manages local Whisper model for fast on-device speech transcription."""

    def __init__(self, model_size: str = "tiny"):
        self.model_size = model_size
        self._model = None
        self._engine_type: Optional[str] = None
        self._initialized = False

    def is_available(self) -> bool:
        """Check if a local Whisper engine is installed in the current environment."""
        if self._initialized:
            return self._model is not None
        try:
            import faster_whisper  # noqa: F401
            return True
        except ImportError:
            try:
                import whisper  # noqa: F401
                return True
            except ImportError:
                return False

    def get_status(self) -> Dict[str, Any]:
        """Return engine metadata and readiness."""
        available = self.is_available()
        return {
            "available": available,
            "engine": self._engine_type or ("faster-whisper" if available else "none"),
            "model_size": self.model_size,
            "device": "Apple Silicon (MPS/CPU)",
            "fallback": "Browser Web Speech API / Web Audio",
        }

    def _load_model(self):
        """Lazily load the Whisper model into memory on first audio request."""
        if self._initialized:
            return

        self._initialized = True
        try:
            from faster_whisper import WhisperModel
            logger.info(f"Loading faster-whisper model '{self.model_size}'...")
            self._model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
            self._engine_type = "faster-whisper"
            logger.info(f"faster-whisper '{self.model_size}' loaded successfully.")
            return
        except ImportError:
            pass

        try:
            import whisper
            logger.info(f"Loading OpenAI whisper model '{self.model_size}'...")
            self._model = whisper.load_model(self.model_size)
            self._engine_type = "openai-whisper"
            logger.info(f"OpenAI whisper '{self.model_size}' loaded successfully.")
            return
        except ImportError:
            logger.info("Local Whisper libraries not installed. Client-side Web Speech API active.")
            self._model = None
            self._engine_type = None

    async def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None,
        suffix: str = ".wav",
    ) -> Dict[str, Any]:
        """Transcribe raw audio bytes into text."""
        if not audio_bytes:
            return {"text": "", "language": language or "en", "confidence": 0.0}

        self._load_model()

        if self._model is None:
            return {
                "text": "",
                "error": "Whisper engine not installed. Use client-side Web Speech API.",
                "status": "fallback_needed",
            }

        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            if self._engine_type == "faster-whisper":
                segments, info = self._model.transcribe(
                    tmp_path,
                    language=language,
                    beam_size=1,
                    vad_filter=True,
                )
                full_text = " ".join(seg.text for seg in segments).strip()
                detected_lang = info.language if hasattr(info, "language") else "en"
                return {
                    "text": full_text,
                    "language": detected_lang,
                    "duration": info.duration if hasattr(info, "duration") else None,
                    "confidence": 1.0,
                }
            elif self._engine_type == "openai-whisper":
                result = self._model.transcribe(tmp_path, language=language)
                return {
                    "text": result.get("text", "").strip(),
                    "language": result.get("language", "en"),
                    "confidence": 1.0,
                }
        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")
            return {"text": "", "error": str(e), "status": "error"}
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass

        return {"text": "", "status": "no_result"}


# Global STT engine singleton
whisper_stt = WhisperSTTEngine(model_size="tiny")
