from typing import Dict, List, Any, Optional
from services.core.core.ai.provider import BaseAIProvider
from services.core.core.ai.providers.local_llm_engine import LocalLLMEngine
from services.core.core.ai.providers.embedded_provider import EmbeddedLocalAIProvider
from services.core.core.ai.providers.openrouter_provider import OpenRouterProvider
from services.core.core.ai.providers.openai_provider import OpenAIProvider
from services.core.core.ai.providers.gemini_provider import GeminiProvider
from services.core.app.config import settings

class AIManager:
    """
    Manages active AI providers (Local LLM Engine, OpenRouter, OpenAI, Gemini, Embedded).
    """
    def __init__(self):
        self._providers: Dict[str, BaseAIProvider] = {}
        
        # Register standard providers
        self.register_provider(LocalLLMEngine())
        self.register_provider(EmbeddedLocalAIProvider())
        self.register_provider(OpenRouterProvider())
        self.register_provider(OpenAIProvider())
        self.register_provider(GeminiProvider())

        # Default provider is local_llm
        self._active_provider_name: str = "local_llm"

    def register_provider(self, provider: BaseAIProvider):
        self._providers[provider.name] = provider

    def set_provider(self, name: str):
        normalized = name.lower()
        if normalized in ["ollama", "local", "local_llm"]:
            normalized = "local_llm"
        elif normalized not in self._providers:
            normalized = "local_llm"
        self._active_provider_name = normalized
        settings.AI_PROVIDER = normalized

    def update_config(self, provider: str, api_key: Optional[str] = None, model: Optional[str] = None):
        self.set_provider(provider)
        if provider == "openrouter":
            if api_key:
                settings.OPENROUTER_API_KEY = api_key
            if model:
                settings.OPENROUTER_MODEL = model
        elif provider == "openai" and api_key:
            settings.OPENAI_API_KEY = api_key
        elif provider == "gemini" and api_key:
            settings.GEMINI_API_KEY = api_key
        elif provider in ["ollama", "local_llm", "local"] and model:
            settings.OLLAMA_MODEL = model

    def get_active_provider(self) -> BaseAIProvider:
        return self._providers.get(self._active_provider_name, self._providers["local_llm"])

    def list_providers(self) -> List[str]:
        return list(self._providers.keys())

    async def generate(
        self,
        prompt: str,
        system_prompt: str,
        history: List[Dict[str, Any]]
    ) -> str:
        provider = self._providers.get(self._active_provider_name, self._providers["local_llm"])
        try:
            return await provider.generate_response(prompt, system_prompt, history)
        except Exception:
            fallback = self._providers["local_llm"]
            return await fallback.generate_response(prompt, system_prompt, history)

ai_manager = AIManager()
