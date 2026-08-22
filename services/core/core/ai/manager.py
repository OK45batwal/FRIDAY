from typing import Dict, List, Any, Optional
from services.core.core.ai.provider import BaseAIProvider
from services.core.core.ai.providers.local_llm_engine import LocalLLMEngine
from services.core.core.ai.providers.openrouter_provider import OpenRouterProvider
from services.core.app.config import settings

class AIManager:
    """
    Unified AI Engine Manager.
    Intelligently routes between Cloud Frontier LLMs (DeepSeek R1, Llama 3.3 70B, Claude, ChatGPT)
    and Local Neural FRIDAY 1.0 SLM with automatic fallback.
    """
    def __init__(self):
        self.local_provider = LocalLLMEngine()
        self.openrouter_provider = OpenRouterProvider()
        self.providers: Dict[str, BaseAIProvider] = {
            "local_llm": self.local_provider,
            "openrouter": self.openrouter_provider
        }

    def get_active_provider() -> BaseAIProvider:
        provider_name = settings.AI_PROVIDER
        if provider_name == "openrouter" and settings.OPENROUTER_API_KEY.strip():
            return self.openrouter_provider
        return self.local_provider

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
        """Generates response using active provider with graceful fallback to local neural engine."""
        provider_name = settings.AI_PROVIDER
        
        # If openrouter is selected and key is present, try frontier cloud reasoning first
        if provider_name == "openrouter" and settings.OPENROUTER_API_KEY.strip():
            try:
                res = await self.openrouter_provider.generate_response(prompt, system_prompt, history)
                if res and not res.startswith("Error from Cloud Provider"):
                    return res
            except Exception:
                pass

        # Fallback to local neural inference engine
        return await self.local_provider.generate_response(prompt, system_prompt, history)

ai_manager = AIManager()
