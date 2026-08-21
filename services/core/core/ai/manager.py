from typing import Dict, List, Any, Optional
from services.core.core.ai.provider import BaseAIProvider
from services.core.core.ai.providers.mock_provider import MockAIProvider
from services.core.core.ai.providers.openrouter_provider import OpenRouterProvider
from services.core.core.ai.providers.openai_provider import OpenAIProvider
from services.core.core.ai.providers.gemini_provider import GeminiProvider
from services.core.core.ai.providers.ollama_provider import OllamaProvider
from services.core.app.config import settings

class AIManager:
    """
    Manages active AI providers and dynamic model switching (OpenRouter, OpenAI, Gemini, Ollama, Mock).
    """
    def __init__(self):
        self._providers: Dict[str, BaseAIProvider] = {}
        self._active_provider_name: str = settings.AI_PROVIDER.lower()
        
        # Register standard providers
        self.register_provider(MockAIProvider())
        self.register_provider(OpenRouterProvider())
        self.register_provider(OpenAIProvider())
        self.register_provider(GeminiProvider())
        self.register_provider(OllamaProvider())

    def register_provider(self, provider: BaseAIProvider):
        self._providers[provider.name] = provider

    def set_provider(self, name: str):
        if name.lower() not in self._providers:
            raise ValueError(f"Unknown AI provider: {name}. Available: {list(self._providers.keys())}")
        self._active_provider_name = name.lower()
        settings.AI_PROVIDER = name.lower()

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
        elif provider == "ollama" and model:
            settings.OLLAMA_MODEL = model

    def get_active_provider(self) -> BaseAIProvider:
        return self._providers.get(self._active_provider_name, self._providers["mock"])


    def list_providers(self) -> List[str]:
        return list(self._providers.keys())

    async def generate(
        self,
        prompt: str,
        system_prompt: str,
        history: List[Dict[str, Any]]
    ) -> str:
        provider = self._providers.get(self._active_provider_name, self._providers["mock"])
        try:
            return await provider.generate_response(prompt, system_prompt, history)
        except Exception as e:
            # Fallback to Mock provider if external API fails
            fallback = self._providers["mock"]
            return await fallback.generate_response(prompt, system_prompt, history)

ai_manager = AIManager()
