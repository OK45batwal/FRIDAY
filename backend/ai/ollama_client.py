"""Async Ollama Client for local LLM inference."""

import json
import httpx
from typing import AsyncGenerator, Dict, Any, List
from backend.config.settings import settings
from backend.utils.logger import get_logger

logger = get_logger("ollama_client")


class OllamaClient:
    def __init__(
        self,
        base_url: str = settings.OLLAMA_BASE_URL,
        model: str = settings.LLM_MODEL,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def check_health(self) -> bool:
        """Verify Ollama server connection and model availability."""
        try:
            async with httpx.AsyncClient(timeout=4.0, trust_env=False) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                return res.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama health check failed: {e}")
            return False

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = settings.LLM_TEMPERATURE,
        top_p: float = settings.LLM_TOP_P,
    ) -> str:
        """Send complete non-streamed chat request."""
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "top_p": top_p,
            },
        }
        async with httpx.AsyncClient(timeout=60.0, trust_env=False) as client:
            resp = await client.post(
                f"{self.base_url}/api/chat",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("message", {}).get("content", "").strip()

    async def chat_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = settings.LLM_TEMPERATURE,
        top_p: float = settings.LLM_TOP_P,
    ) -> AsyncGenerator[str, None]:
        """Stream chat tokens asynchronously."""
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "top_p": top_p,
            },
        }
        async with httpx.AsyncClient(timeout=60.0, trust_env=False) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    try:
                        chunk = json.loads(line)
                        content = chunk.get("message", {}).get("content", "")
                        if content:
                            yield content
                    except Exception:
                        continue


# Global OllamaClient singleton
ollama_client = OllamaClient()
