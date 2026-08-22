import os
import re
import asyncio
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
    Single Dedicated Indian English Voice Engine for FRIDAY (Tara / Neerja).
    Generates standard 16-bit Studio WAV audio with zero network latency.
    """

    async def synthesize(self, text: str, voice: Optional[str] = None) -> bytes:
        clean_text = normalize_text_for_speech(text)
        if not clean_text:
            return b""

        # Primary Single Voice: Indian English (Tara on macOS, en-IN-NeerjaNeural on Linux/Windows)
        if platform.system() == "Darwin":
            try:
                with tempfile.NamedTemporaryFile(suffix=".aiff", delete=False) as f_aiff:
                    aiff_path = f_aiff.name
                wav_path = aiff_path.replace(".aiff", ".wav")

                # Synthesize with Indian English voice 'Tara'
                proc1 = await asyncio.create_subprocess_exec(
                    "say", "-v", "Tara", "-o", aiff_path, clean_text
                )
                await proc1.wait()

                # Convert to standard WAV
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
                print("Native Indian TTS error:", e)

        # Fallback to Edge-TTS Indian Neural voice
        try:
            import edge_tts
            communicate = edge_tts.Communicate(clean_text, "en-IN-NeerjaNeural")
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            return audio_data
        except Exception:
            return b""

tts_service = TextToSpeechService()
