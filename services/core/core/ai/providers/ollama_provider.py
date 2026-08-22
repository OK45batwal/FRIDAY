import httpx
from typing import List, Dict, Any
from services.core.core.ai.provider import BaseAIProvider
from services.core.app.config import settings

class OllamaProvider(BaseAIProvider):
    @property
    def name(self) -> str:
        return "ollama"

    async def list_local_models(self) -> List[Dict[str, Any]]:
        """Probes the local Ollama / llama.cpp server to discover installed models."""
        base_url = settings.OLLAMA_BASE_URL.rstrip('/')
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = data.get("models", [])
                    return [
                        {
                            "name": m.get("name"),
                            "size_gb": round(m.get("size", 0) / (1024 ** 3), 2),
                            "modified_at": m.get("modified_at")
                        }
                        for m in models
                    ]
        except Exception:
            pass
        return []

    async def generate_response(
        self,
        prompt: str,
        system_prompt: str,
        history: List[Dict[str, Any]]
    ) -> str:
        base_url = settings.OLLAMA_BASE_URL.rstrip('/')
        model = settings.OLLAMA_MODEL or "llama3.2:3b"

        messages = [{"role": "system", "content": system_prompt}]
        for h in history[-8:]:
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.7
            }
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{base_url}/api/chat",
                    json=payload
                )
                if response.status_code == 200:
                    data = response.json()
                    return data.get("message", {}).get("content", "").strip()
                elif response.status_code == 404:
                    raise ValueError(f"Model '{model}' not found in local Ollama. Run `ollama pull {model}` to install it.")
                else:
                    raise ValueError(f"Local LLM Error ({response.status_code}): {response.text}")
        except httpx.ConnectError:
            raise ValueError(f"Could not connect to Local LLM at {base_url}. Ensure Ollama is running (`ollama serve`).")
