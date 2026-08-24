import httpx
import logging
from typing import List, Dict, Any, Optional
from services.core.core.ai.provider import BaseAIProvider, ProviderError
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
            raise ProviderError("No OpenRouter API key configured.")

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
        except Exception as e:
            logger.error("OpenRouter connection error: %s", e)
            raise ProviderError(f"Cloud connection failed: {e}") from e

        if res.status_code != 200:
            # Log the body, do not return it. The upstream response can echo
            # request details and provider metadata, and it was previously
            # rendered straight into the chat transcript.
            logger.warning("OpenRouter API error %s: %s", res.status_code, res.text[:500])
            raise ProviderError(f"Cloud provider returned HTTP {res.status_code}.")

        try:
            data = res.json()
            content = data["choices"][0]["message"]["content"]
        except (ValueError, KeyError, IndexError, TypeError) as e:
            # A 200 with an unexpected shape used to raise deep inside the
            # manager's bare `except`, silently degrading to local with no log.
            logger.warning("Malformed OpenRouter payload: %s", e)
            raise ProviderError("Cloud provider returned a malformed response.") from e

        content = (content or "").strip()
        if not content:
            raise ProviderError("Cloud provider returned an empty response.")
        return content
