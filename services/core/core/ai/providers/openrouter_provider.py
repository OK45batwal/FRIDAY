import httpx
import logging
from typing import List, Dict, Any, Optional
from services.core.core.ai.provider import BaseAIProvider
from services.core.app.config import settings

logger = logging.getLogger(__name__)

# List of premier frontier & deep reasoning models available via OpenRouter
FRONTIER_MODELS = [
    "deepseek/deepseek-r1",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemini-2.0-flash-lite:free",
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o"
]

class OpenRouterProvider(BaseAIProvider):
    """
    Cloud Frontier LLM & Deep Reasoning Provider.
    Connects to DeepSeek R1, Llama 3.3 70B, Claude 3.5 Sonnet, and ChatGPT for PhD-grade depth.
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
            return "Please provide your OpenRouter API Key in the Settings dialog to activate deep 70B+ frontier models (DeepSeek R1, Llama 3.3 70B, Claude 3.5)."

        messages = [{"role": "system", "content": system_prompt}]
        for h in history[-10:]:
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://github.com/OK45batwal/FRIDAY",
            "X-Title": "FRIDAY AI Operating Assistant",
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": 0.6,
                        "max_tokens": 4096
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"].strip()
                else:
                    logger.warning(f"OpenRouter API Error: {res.status_code} - {res.text}")
                    return f"Error from Cloud Provider ({res.status_code}): {res.text}"
        except Exception as e:
            logger.error(f"OpenRouter Connection Error: {e}")
            return f"Cloud connection timeout: {str(e)}"
