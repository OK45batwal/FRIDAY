import os
import re
import asyncio
import platform
import tempfile
from typing import Optional

def normalize_text_for_speech(text: str) -> str:
    """
    Transforms rich markdown, code blocks, and lists into natural, human conversational speech.
    Provides concise, articulate spoken delivery while the full text & code remains visible on screen.
    """
    if not text or not text.strip():
        return ""

    raw = text.strip()
    has_code = "```" in raw

    # 1. Strip markdown links
    cleaned = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', raw)
    # 2. Strip code blocks into concise phrase
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
    sentences = re.split(r'(?<=[.!?])\s+', cleaned)
    # Pick the first 2-3 most impactful sentences for voice output
    spoken_body = " ".join(sentences[:3]).strip()

    if has_code and not spoken_body.endswith("screen."):
        spoken_body += " I have provided the complete code block on your screen."

    return spoken_body or "I have processed your request and displayed the result on your screen."

class TextToSpeechService:
    """
    Dedicated Human-Like Indian English Voice Engine for FRIDAY (Tara).
    Generates standard 16-bit Studio WAV audio with natural human cadence (185 wpm).
    """

    async def synthesize(self, text: str, voice: Optional[str] = None) -> bytes:
        clean_text = normalize_text_for_speech(text)
        if not clean_text:
            return b""

        # Primary Single Voice: Indian English Female (Tara) with human pacing
        if platform.system() == "Darwin":
            try:
                with tempfile.NamedTemporaryFile(suffix=".aiff", delete=False) as f_aiff:
                    aiff_path = f_aiff.name
                wav_path = aiff_path.replace(".aiff", ".wav")

                # Synthesize with natural 185 WPM conversational pacing
                proc1 = await asyncio.create_subprocess_exec(
                    "say", "-v", "Tara", "-r", "185", "-o", aiff_path, clean_text
                )
                await proc1.wait()

                # Convert to standard high-fidelity WAV
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
