from typing import Dict, List, Any, Optional
from services.core.core.ai.provider import BaseAIProvider
from services.core.core.ai.providers.mock_provider import MockAIProvider
from services.core.core.ai.providers.openai_provider import OpenAIProvider
from services.core.core.ai.providers.gemini_provider import GeminiProvider
from services.core.core.ai.providers.ollama_provider import OllamaProvider
from services.core.app.config import settings

class AIManager:
    """
    Manages active AI providers and dynamic model switching.
    """
    def __init__(self):
        self._providers: Dict[str, BaseAIProvider] = {}
        self._active_provider_name: str = settings.AI_PROVIDER.lower()
        
        # Register standard providers
        self.register_provider(MockAIProvider())
        self.register_provider(OpenAIProvider())
        self.register_provider(GeminiProvider())
        self.register_provider(OllamaProvider())

    def register_provider(self, provider: BaseAIProvider):
        self._providers[provider.name] = provider

    def set_provider(self, name: str):
        if name.lower() not in self._providers:
            raise ValueError(f"Unknown AI provider: {name}. Available: {list(self._providers.keys())}")
        self._active_provider_name = name.lower()

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
        provider = self.get_active_provider()
        try:
            return await provider.generate_response(prompt, system_prompt, history)
        except Exception as e:
            # Fallback to Mock provider if external API fails
            fallback = self._providers["mock"]
            return await fallback.generate_response(prompt, system_prompt, history)

ai_manager = AIManager()
