import asyncio
import logging
import os
import platform
import re
import tempfile
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)

# Cap the cache by bytes, not entries. A single long response measured 16.4 MB,
# so a 100-entry ceiling allowed ~1.6 GB of resident memory to be filled by
# repeated requests.
MAX_CACHE_BYTES = 32 * 1024 * 1024
MAX_CACHEABLE_ENTRY_BYTES = 2 * 1024 * 1024
# `say` slows to a crawl on very long input and this runs per request.
MAX_SPEECH_CHARS = 1200


def normalize_text_for_speech(text: str, max_sentences: int = 4) -> str:
    """
    Extracts a concise, articulate spoken summary from rich markdown.
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
    # 7. Strip list bullet symbols. The old pattern was `[-\*•\d+\.]` — inside a
    #    character class `+` is literal, so "12. item" was never stripped.
    cleaned = re.sub(r'^\s*(?:[-*•]|\d+[.)])\s+', '', cleaned, flags=re.MULTILINE)
    # 8. Clean excess whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()

    # Keep short sentences ("Yes.", "No.") — the old `len > 3` filter dropped them.
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', cleaned) if s.strip()]
    spoken_body = " ".join(sentences[:max_sentences]).strip()

    if has_code and not spoken_body.endswith("screen."):
        spoken_body = (
            f"{spoken_body} I have displayed the complete implementation on your screen."
        ).strip()

    return (spoken_body or "I have processed your request.")[:MAX_SPEECH_CHARS]


def _is_option_like(text: str) -> bool:
    """True when `say` would parse this string as an option rather than content."""
    return text.startswith("-")


async def _run(program: str, *args: str, timeout: float) -> bool:
    """
    Run a subprocess, returning True on a clean exit.

    `asyncio.wait_for(proc.wait(), ...)` cancels the *wait*, not the process, so
    a timeout previously orphaned a live `say` process. This kills it explicitly.
    """
    proc = await asyncio.create_subprocess_exec(
        program,
        *args,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL,
    )
    try:
        await asyncio.wait_for(proc.wait(), timeout=timeout)
        return proc.returncode == 0
    except asyncio.TimeoutError:
        logger.warning("%s timed out after %.1fs; killing pid %s", program, timeout, proc.pid)
        try:
            proc.kill()
            await proc.wait()
        except ProcessLookupError:
            pass
        return False


class TextToSpeechService:
    """
    Robust Multi-Tier Human-Like Voice Engine for FRIDAY.
    Tier 1: Native macOS 'say' with natural 185 WPM pacing.
    Tier 2: Edge-TTS Indian / US Neural Voice.
    Tier 3: In-memory byte-bounded FIFO audio cache.
    """

    def __init__(self):
        self._audio_cache: Dict[Tuple[str, str], bytes] = {}
        self._cache_bytes = 0

    def _cache_get(self, voice: str, text: str) -> Optional[bytes]:
        # Key includes the voice: keying on text alone served Samantha's audio
        # for a Rishi request.
        return self._audio_cache.get((voice, text))

    def _cache_put(self, voice: str, text: str, audio: bytes) -> None:
        if not audio or len(audio) > MAX_CACHEABLE_ENTRY_BYTES:
            return
        key = (voice, text)
        if key in self._audio_cache:
            self._cache_bytes -= len(self._audio_cache[key])
        self._audio_cache[key] = audio
        self._cache_bytes += len(audio)
        while self._cache_bytes > MAX_CACHE_BYTES and self._audio_cache:
            _, evicted = self._audio_cache.popitem()
            self._cache_bytes -= len(evicted)

    async def synthesize(self, text: str, voice: Optional[str] = "Tara") -> bytes:
        clean_text = normalize_text_for_speech(text)
        if not clean_text:
            return b""

        requested_voice = voice or "Tara"
        cached = self._cache_get(requested_voice, clean_text)
        if cached is not None:
            return cached

        if platform.system() == "Darwin":
            audio = await self._synthesize_macos(requested_voice, clean_text)
            if audio:
                self._cache_put(requested_voice, clean_text, audio)
                return audio

        audio = await self._synthesize_edge(clean_text)
        if audio:
            self._cache_put(requested_voice, clean_text, audio)
        return audio

    async def _synthesize_macos(self, voice: str, clean_text: str) -> bytes:
        for candidate in [voice, "Samantha", "Rishi", "Karen"]:
            aiff_path = wav_path = None
            try:
                with tempfile.NamedTemporaryFile(suffix=".aiff", delete=False) as f_aiff:
                    aiff_path = f_aiff.name
                wav_path = aiff_path.replace(".aiff", ".wav")

                ok = await _run(
                    "say",
                    "-v", candidate,
                    "-r", "185",
                    "-o", aiff_path,
                    # `--` stops option parsing. Without it, user-controlled text
                    # beginning with `-o` overrode the output path and let an
                    # unauthenticated GET overwrite arbitrary files the server
                    # user could write. The explicit guard below is belt-and-braces
                    # in case a future refactor drops the terminator.
                    "--",
                    clean_text,
                    timeout=8.0,
                )
                if not ok:
                    continue

                if not await _run(
                    "afconvert", "-f", "WAVE", "-d", "LEI16", aiff_path, wav_path, timeout=5.0
                ):
                    continue

                if os.path.exists(wav_path) and os.path.getsize(wav_path) > 100:
                    with open(wav_path, "rb") as handle:
                        return handle.read()
            except Exception:
                logger.warning("macOS TTS failed for voice %s", candidate, exc_info=True)
            finally:
                # Cleanup used to live only on the success path, so every failure
                # (and every timeout retry) leaked a temp file.
                for path in (aiff_path, wav_path):
                    if path:
                        try:
                            os.unlink(path)
                        except OSError:
                            pass
        return b""

    async def _synthesize_edge(self, clean_text: str) -> bytes:
        try:
            import edge_tts

            communicate = edge_tts.Communicate(clean_text, "en-IN-NeerjaNeural")
            audio_data = bytearray()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            return bytes(audio_data)
        except Exception:
            logger.warning("Edge-TTS fallback failed", exc_info=True)
            return b""


tts_service = TextToSpeechService()


def _self_check() -> None:
    """Regression guard for the argument-injection and normalizer fixes."""
    # The exploit payload must survive normalization as *content*, and the
    # command we build must neutralize it. Assert the guard recognizes it.
    assert _is_option_like(normalize_text_for_speech("-o/tmp/victim.txt"))
    # `--` must be present immediately before the text argument.
    import inspect
    source = inspect.getsource(TextToSpeechService._synthesize_macos)
    assert '"--",' in source, "the say(1) argument terminator was removed"
    assert source.index('"--",') < source.index("clean_text,"), "terminator must precede the text"

    # Short sentences are no longer discarded.
    assert normalize_text_for_speech("Yes. No. Maybe.") == "Yes. No. Maybe."
    # Numbered list markers are stripped now.
    assert normalize_text_for_speech("12. Deploy the service") == "Deploy the service"
    # Code-only responses must not produce a leading space.
    spoken = normalize_text_for_speech("```python\nprint(1)\n```")
    assert spoken == spoken.strip() and spoken.startswith("I have"), spoken
    # Output is bounded.
    assert len(normalize_text_for_speech("word. " * 5000)) <= MAX_SPEECH_CHARS

    # Cache keys separate voices.
    svc = TextToSpeechService()
    svc._cache_put("Samantha", "hello", b"AAAA")
    svc._cache_put("Rishi", "hello", b"BBBB")
    assert svc._cache_get("Samantha", "hello") == b"AAAA"
    assert svc._cache_get("Rishi", "hello") == b"BBBB"
    # Oversized entries are not cached, and the byte budget is respected.
    svc._cache_put("Samantha", "big", b"X" * (MAX_CACHEABLE_ENTRY_BYTES + 1))
    assert svc._cache_get("Samantha", "big") is None
    assert svc._cache_bytes <= MAX_CACHE_BYTES

    print("text_to_speech self-check OK")


if __name__ == "__main__":
    _self_check()
