import httpx
from typing import List, Dict, Any
from services.core.core.ai.provider import BaseAIProvider
from services.core.app.config import settings

class OllamaProvider(BaseAIProvider):
    @property
    def name(self) -> str:
        return "ollama"

    async def generate_response(
        self,
        prompt: str,
        system_prompt: str,
        history: List[Dict[str, Any]]
    ) -> str:
        url = f"{settings.OLLAMA_BASE_URL}/api/generate"
        conversation_text = f"{system_prompt}\n\n"
        for h in history[-8:]:
            conversation_text += f"{h['role'].capitalize()}: {h['content']}\n"
        conversation_text += f"User: {prompt}\nFriday:"

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json={
                "model": settings.OLLAMA_MODEL,
                "prompt": conversation_text,
                "stream": False
            })
            data = response.json()
            return data.get("response", "").strip()
