from typing import Dict, List, Any, Optional
from services.core.core.ai.provider import BaseAIProvider
from services.core.core.ai.providers.local_llm_engine import LocalLLMEngine
from services.core.app.config import settings

class AIManager:
    """
    Dedicated AI Engine Manager locked to FRIDAY-1B Custom SLM.
    """
    def __init__(self):
        self._provider = LocalLLMEngine()

    def get_active_provider(self) -> BaseAIProvider:
        return self._provider

    def list_providers(self) -> List[str]:
        return ["friday_1b_slm"]

    def update_config(self, provider: str = "local_llm", api_key: Optional[str] = None, model: Optional[str] = None):
        settings.AI_PROVIDER = "local_llm"
        settings.OLLAMA_MODEL = "friday-1b-custom"

    async def generate(
        self,
        prompt: str,
        system_prompt: str,
        history: List[Dict[str, Any]]
    ) -> str:
        return await self._provider.generate_response(prompt, system_prompt, history)

ai_manager = AIManager()
