from typing import Optional

class TextToSpeechService:
    """
    Handles Text-To-Speech audio synthesis.
    """
    async def synthesize(self, text: str, voice: Optional[str] = None) -> bytes:
        # In v0.1: Client uses native high-performance Web Speech Synthesis API;
        # this backend hook generates audio stream when needed for remote clients.
        return b""

tts_service = TextToSpeechService()
