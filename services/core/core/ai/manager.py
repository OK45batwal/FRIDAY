from typing import Dict, List, Any, Optional
from services.core.core.ai.provider import BaseAIProvider
from services.core.core.ai.providers.local_llm_engine import LocalLLMEngine
from services.core.core.ai.providers.openrouter_provider import OpenRouterProvider
from services.core.app.config import settings

class AIManager:
    """
    Unified AI Engine Manager.
    Allows seamless switching between Cloud Frontier LLMs (ChatGPT, Claude, Gemini) and Local FRIDAY 1.0 SLM.
    """
    def __init__(self):
        self.providers: Dict[str, BaseAIProvider] = {
            "local_llm": LocalLLMEngine(),
            "openrouter": OpenRouterProvider()
        }

    def get_active_provider(self) -> BaseAIProvider:
        provider_name = settings.AI_PROVIDER
        if provider_name == "openrouter" and settings.OPENROUTER_API_KEY:
            return self.providers["openrouter"]
        return self.providers["local_llm"]

    def list_providers(self) -> List[str]:
        return ["local_llm", "openrouter"]

    def update_config(
        self,
        provider: str = "local_llm",
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ):
        if provider:
            settings.AI_PROVIDER = provider
        if api_key is not None:
            settings.OPENROUTER_API_KEY = api_key
        if model:
            if provider == "openrouter":
                settings.OPENROUTER_MODEL = model
            else:
                settings.OLLAMA_MODEL = model

    async def generate(
        self,
        prompt: str,
        system_prompt: str,
        history: List[Dict[str, Any]]
    ) -> str:
        provider = self.get_active_provider()
        return await provider.generate_response(prompt, system_prompt, history)

ai_manager = AIManager()
