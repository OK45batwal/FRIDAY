import os
import re
import asyncio
import subprocess
import platform
import tempfile
from typing import Optional

def normalize_text_for_speech(text: str) -> str:
    """
    Cleans markdown, code blocks, URLs, and symbols so speech engines
    pronounce clear, natural sentences instead of reading syntax garble.
    """
    if not text:
        return ""

    # Replace code blocks with concise spoken phrase
    cleaned = re.sub(r'```[\s\S]*?```', 'Here is the code block.', text)
    # Remove inline code marks
    cleaned = re.sub(r'`([^`]+)`', r'\1', cleaned)
    # Remove markdown headers (#, ##)
    cleaned = re.sub(r'#+\s*', '', cleaned)
    # Remove bold/italic asterisks (*, **)
    cleaned = re.sub(r'\*+([^*]+)\*+', r'\1', cleaned)
    # Remove URLs
    cleaned = re.sub(r'https?://\S+', 'link', cleaned)
    # Remove bullet markers
    cleaned = re.sub(r'^[-\*•]\s+', '', cleaned, flags=re.MULTILINE)
    # Clean multiple spaces and newlines
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()

    return cleaned

class TextToSpeechService:
    """
    Instant Studio-Grade Text-To-Speech engine for FRIDAY.
    Generates standard 16-bit Linear PCM WAV audio with zero network latency.
    """

    async def synthesize(self, text: str, voice: Optional[str] = None) -> bytes:
        clean_text = normalize_text_for_speech(text)
        if not clean_text:
            return b""

        # Voice selection (Samantha, Moira, Karen, Ava)
        voice_name = "Samantha"
        if voice and ("Moira" in voice or "Irish" in voice):
            voice_name = "Moira"
        elif voice and "Karen" in voice:
            voice_name = "Karen"

        if platform.system() == "Darwin":
            try:
                with tempfile.NamedTemporaryFile(suffix=".aiff", delete=False) as f_aiff:
                    aiff_path = f_aiff.name
                wav_path = aiff_path.replace(".aiff", ".wav")

                # 1. Synthesize audio on macOS native engine
                proc1 = await asyncio.create_subprocess_exec(
                    "say", "-v", voice_name, "-o", aiff_path, clean_text
                )
                await proc1.wait()

                # 2. Convert to standard universally playable WAV
                proc2 = await asyncio.create_subprocess_exec(
                    "afconvert", "-f", "WAVE", "-d", "LEI16", aiff_path, wav_path
                )
                await proc2.wait()

                if os.path.exists(wav_path):
                    with open(wav_path, "rb") as f:
                        wav_bytes = f.read()
                    os.remove(wav_path)
                    if os.path.exists(aiff_path):
                        os.remove(aiff_path)
                    return wav_bytes
            except Exception as e:
                print("Native TTS error:", e)

        # Fallback to Edge-TTS if on Linux / Windows
        try:
            import edge_tts
            communicate = edge_tts.Communicate(clean_text, "en-IE-EmilyNeural")
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            return audio_data
        except Exception:
            return b""

tts_service = TextToSpeechService()
