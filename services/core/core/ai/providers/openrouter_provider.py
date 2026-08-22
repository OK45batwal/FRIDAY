import httpx
from typing import List, Dict, Any, Optional
from services.core.core.ai.provider import BaseAIProvider
from services.core.app.config import settings

class OpenRouterProvider(BaseAIProvider):
    """
    Cloud Frontier LLM Provider (ChatGPT, Claude 3.5, Gemini, Llama 3.3 70B via OpenRouter).
    Provides deep, rich, human-grade conversational responses.
    """

    @property
    def name(self) -> str:
        return "openrouter"

    async def generate_response(
        self,
        prompt: str,
        system_prompt: str,
        history: List[Dict[str, Any]]
    ) -> str:
        api_key = settings.OPENROUTER_API_KEY.strip()
        model = settings.OPENROUTER_MODEL or "meta-llama/llama-3.3-70b-instruct:free"

        if not api_key:
            return "Please provide your OpenRouter API Key in the Settings dialog to connect to ChatGPT / Claude / Gemini cloud models."

        messages = [{"role": "system", "content": system_prompt}]
        for h in history[-10:]:
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://github.com/OK45batwal/FRIDAY",
            "X-Title": "FRIDAY AI Assistant",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            res = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 2048
                }
            )
            if res.status_code == 200:
                data = res.json()
                return data["choices"][0]["message"]["content"].strip()
            else:
                return f"Error from Cloud Provider ({res.status_code}): {res.text}"
