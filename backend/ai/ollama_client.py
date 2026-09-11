"""Async Ollama Client for local LLM inference."""

import json
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional
from backend.config.settings import settings
from backend.utils.logger import get_logger

logger = get_logger("ollama_client")


class OllamaClient:
    def __init__(
        self,
        base_url: str = settings.OLLAMA_BASE_URL,
        model: Optional[str] = None,
    ):
        self.base_url = base_url.rstrip("/")
        self._model = model
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=60.0, trust_env=False)
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    @property
    def model(self) -> str:
        return self._model or settings.LLM_MODEL

    async def check_health(self) -> bool:
        """Verify Ollama server connection and model availability."""
        try:
            client = await self._get_client()
            res = await client.get(f"{self.base_url}/api/tags", timeout=4.0)
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
        """Send complete non-streamed chat request with fallback."""
        active_model = self.model
        payload = {
            "model": active_model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "top_p": top_p,
                "num_predict": settings.LLM_MAX_TOKENS,
            },
        }
        client = await self._get_client()
        try:
            resp = await client.post(
                f"{self.base_url}/api/chat",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("message", {}).get("content", "").strip()
        except httpx.HTTPStatusError as e:
            # If custom model not yet compiled in Ollama, fallback to gemma2:2b
            if e.response.status_code == 404 and active_model != "gemma2:2b":
                logger.warning(f"Model '{active_model}' not found in Ollama, falling back to 'gemma2:2b'")
                payload["model"] = "gemma2:2b"
                fallback_resp = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                )
                fallback_resp.raise_for_status()
                data = fallback_resp.json()
                return data.get("message", {}).get("content", "").strip()
            raise e

    async def chat_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = settings.LLM_TEMPERATURE,
        top_p: float = settings.LLM_TOP_P,
    ) -> AsyncGenerator[str, None]:
        """Stream chat tokens asynchronously."""
        active_model = self.model
        payload = {
            "model": active_model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "top_p": top_p,
                "num_predict": settings.LLM_MAX_TOKENS,
            },
        }
        client = await self._get_client()
        try:
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
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404 and active_model != "gemma2:2b":
                logger.warning(f"Model '{active_model}' not found in Ollama streaming, falling back to 'gemma2:2b'")
                payload["model"] = "gemma2:2b"
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
            else:
                raise e


# Global OllamaClient singleton
ollama_client = OllamaClient()
