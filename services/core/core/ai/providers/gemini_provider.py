import httpx
from typing import List, Dict, Any
from services.core.core.ai.provider import BaseAIProvider
from services.core.app.config import settings

class GeminiProvider(BaseAIProvider):
    @property
    def name(self) -> str:
        return "gemini"

    async def generate_response(
        self,
        prompt: str,
        system_prompt: str,
        history: List[Dict[str, Any]]
    ) -> str:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured.")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        
        conversation_text = f"SYSTEM INSTRUCTIONS: {system_prompt}\n\n"
        for h in history[-8:]:
            conversation_text += f"{h['role'].capitalize()}: {h['content']}\n"
        conversation_text += f"User: {prompt}\nFriday:"

        contents = [{"role": "user", "parts": [{"text": conversation_text}]}]

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json={"contents": contents})
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
