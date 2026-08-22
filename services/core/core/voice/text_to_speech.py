import os
import re
import asyncio
import platform
import tempfile
from typing import Optional, Dict

def normalize_text_for_speech(text: str) -> str:
    """
    Extracts the most concise, articulate spoken summary (1-2 sentences) from rich markdown.
    Ensures voice output is fast, conversational, and never times out on long essays.
    """
    if not text or not text.strip():
        return ""

    raw = text.strip()
    has_code = "```" in raw

    # 1. Strip markdown links
    cleaned = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', raw)
    # 2. Strip code blocks completely for voice
    cleaned = re.sub(r'```[\s\S]*?```', '', cleaned)
    # 3. Strip inline code backticks
    cleaned = re.sub(r'`([^`]+)`', r'\1', cleaned)
    # 4. Strip markdown headers
    cleaned = re.sub(r'#+\s*', '', cleaned)
    # 5. Strip bold and italics
    cleaned = re.sub(r'\*+([^*]+)\*+', r'\1', cleaned)
    # 6. Strip URLs
    cleaned = re.sub(r'https?://\S+', 'link', cleaned)
    # 7. Strip list bullet symbols
    cleaned = re.sub(r'^[-\*•\d+\.]\s+', '', cleaned, flags=re.MULTILINE)
    # 8. Clean excess whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()

    # Split into clean conversational sentences
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', cleaned) if len(s.strip()) > 3]
    
    # Take at most 2 impactful sentences for speech
    spoken_body = " ".join(sentences[:2]).strip()

    if has_code and not spoken_body.endswith("screen."):
        spoken_body += " I have displayed the complete implementation on your screen."

    return spoken_body or "I have processed your request."

class TextToSpeechService:
    """
    Robust Multi-Tier Human-Like Voice Engine for FRIDAY.
    Tier 1: Native macOS 'say' (Tara / Samantha / Rishi / Karen) with natural 185 WPM pacing.
    Tier 2: Edge-TTS Indian / US Neural Voice.
    Tier 3: In-memory LRU audio caching.
    """

    def __init__(self):
        self._audio_cache: Dict[str, bytes] = {}
        self._cache_limit = 100

    async def synthesize(self, text: str, voice: Optional[str] = "Tara") -> bytes:
        clean_text = normalize_text_for_speech(text)
        if not clean_text:
            return b""

        # Check audio cache for instant playback
        if clean_text in self._audio_cache:
            return self._audio_cache[clean_text]

        # Tier 1: macOS Darwin Native Voice Synthesis
        if platform.system() == "Darwin":
            candidate_voices = [voice or "Tara", "Samantha", "Rishi", "Karen"]
            for v in candidate_voices:
                try:
                    with tempfile.NamedTemporaryFile(suffix=".aiff", delete=False) as f_aiff:
                        aiff_path = f_aiff.name
                    wav_path = aiff_path.replace(".aiff", ".wav")

                    # Synthesize with natural 185 WPM conversational pacing
                    proc1 = await asyncio.create_subprocess_exec(
                        "say", "-v", v, "-r", "185", "-o", aiff_path, clean_text,
                        stdout=asyncio.subprocess.DEVNULL,
                        stderr=asyncio.subprocess.DEVNULL
                    )
                    await asyncio.wait_for(proc1.wait(), timeout=5.0)

                    # Convert to standard high-fidelity WAV
                    proc2 = await asyncio.create_subprocess_exec(
                        "afconvert", "-f", "WAVE", "-d", "LEI16", aiff_path, wav_path,
                        stdout=asyncio.subprocess.DEVNULL,
                        stderr=asyncio.subprocess.DEVNULL
                    )
                    await asyncio.wait_for(proc2.wait(), timeout=3.0)

                    if os.path.exists(wav_path) and os.path.getsize(wav_path) > 100:
                        with open(wav_path, "rb") as f:
                            wav_bytes = f.read()
                        os.remove(wav_path)
                        if os.path.exists(aiff_path):
                            os.remove(aiff_path)

                        # Store in LRU cache
                        if len(self._audio_cache) >= self._cache_limit:
                            self._audio_cache.pop(next(iter(self._audio_cache)))
                        self._audio_cache[clean_text] = wav_bytes
                        return wav_bytes
                except Exception:
                    pass

        # Tier 2: Edge-TTS Neural Voice Fallback
        try:
            import edge_tts
            communicate = edge_tts.Communicate(clean_text, "en-IN-NeerjaNeural")
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            if audio_data:
                if len(self._audio_cache) >= self._cache_limit:
                    self._audio_cache.pop(next(iter(self._audio_cache)))
                self._audio_cache[clean_text] = audio_data
            return audio_data
        except Exception:
            pass

        return b""

tts_service = TextToSpeechService()
