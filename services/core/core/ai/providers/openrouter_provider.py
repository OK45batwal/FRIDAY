import httpx
from typing import List, Dict, Any
from services.core.core.ai.provider import BaseAIProvider
from services.core.app.config import settings

class OpenRouterProvider(BaseAIProvider):
    @property
    def name(self) -> str:
        return "openrouter"

    async def generate_response(
        self,
        prompt: str,
        system_prompt: str,
        history: List[Dict[str, Any]]
    ) -> str:
        api_key = settings.OPENROUTER_API_KEY
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY is not configured.")

        messages = [{"role": "system", "content": system_prompt}]
        for h in history[-8:]:
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "FRIDAY AI Assistant",
            "Content-Type": "application/json"
        }

        payload = {
            "model": settings.OPENROUTER_MODEL or "meta-llama/llama-3.3-70b-instruct",
            "messages": messages,
            "temperature": 0.7
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload
            )
            data = response.json()
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]["content"].strip()
            elif "error" in data:
                raise ValueError(f"OpenRouter Error: {data['error'].get('message', str(data['error']))}")
            else:
                raise ValueError(f"Unexpected response from OpenRouter: {data}")
