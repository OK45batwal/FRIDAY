import httpx
from typing import List, Dict, Any
from services.core.core.ai.provider import BaseAIProvider
from services.core.app.config import settings

class OpenAIProvider(BaseAIProvider):
    @property
    def name(self) -> str:
        return "openai"

    async def generate_response(
        self,
        prompt: str,
        system_prompt: str,
        history: List[Dict[str, Any]]
    ) -> str:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured.")

        messages = [{"role": "system", "content": system_prompt}]
        for h in history[-8:]:
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={"model": "gpt-4o-mini", "messages": messages, "temperature": 0.7}
            )
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
