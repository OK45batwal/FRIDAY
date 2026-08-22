from typing import Dict, List, Any, Optional
from services.core.core.ai.provider import BaseAIProvider
from services.core.core.ai.providers.local_llm_engine import LocalLLMEngine
from services.core.core.ai.providers.openrouter_provider import OpenRouterProvider
from services.core.core.ai.providers.gemini_provider import GeminiProvider
from services.core.app.config import settings

class AIManager:
    """
    Intelligent AI Provider Router for FRIDAY.
    Routes between Frontier Cloud Intelligence (Gemini/Claude/GPT-4 via OpenRouter)
    and On-Device Privacy (FRIDAY 1.0 SLM).
    """
    def __init__(self):
        self._providers: Dict[str, BaseAIProvider] = {
            "local_llm": LocalLLMEngine(),
            "openrouter": OpenRouterProvider(),
            "gemini": GeminiProvider()
        }

    def get_active_provider(self) -> BaseAIProvider:
        provider_name = settings.AI_PROVIDER.lower()
        return self._providers.get(provider_name, self._providers["local_llm"])

    def list_providers(self) -> List[str]:
        return list(self._providers.keys())

    def update_config(self, provider: str, api_key: Optional[str] = None, model: Optional[str] = None):
        settings.AI_PROVIDER = provider
        if provider == "openrouter":
            if api_key:
                settings.OPENROUTER_API_KEY = api_key
            if model:
                settings.OPENROUTER_MODEL = model
        elif provider == "gemini":
            if api_key:
                settings.GEMINI_API_KEY = api_key
        elif provider == "local_llm":
            if model:
                settings.OLLAMA_MODEL = model

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
            # Fallback seamlessly to local cognitive engine
            print(f"Provider {settings.AI_PROVIDER} error: {e}. Falling back to local engine.")
            return await self._providers["local_llm"].generate_response(prompt, system_prompt, history)

ai_manager = AIManager()
