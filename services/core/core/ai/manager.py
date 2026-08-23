import re
from typing import Dict, List, Any, Optional, Tuple
from services.core.core.ai.provider import BaseAIProvider
from services.core.core.ai.providers.local_llm_engine import LocalLLMEngine
from services.core.core.ai.providers.openrouter_provider import OpenRouterProvider
from services.core.app.config import settings

class AIManager:
    """
    Hybrid Edge-Cloud AI Orchestrator (Google Pixel & ChatGPT Architecture).
    Intelligently cascades between:
    1. Local On-Device Neural Model (Metal GPU / NPU): <25ms latency for OS tools, telemetry, math, facts.
    2. Frontier Cloud Model (GPT-4o, Gemini 2.0, Claude 3.5, DeepSeek R1): For complex coding & multi-file synthesis.
    """
    def __init__(self):
        self.local_provider = LocalLLMEngine()
        self.openrouter_provider = OpenRouterProvider()
        self.providers: Dict[str, BaseAIProvider] = {
            "local_llm": self.local_provider,
            "openrouter": self.openrouter_provider
        }

    def evaluate_routing_target(self, prompt: str) -> Tuple[str, str]:
        """
        Heuristic Intent & Complexity Cascading Evaluator.
        Returns: (target_tier: 'edge' | 'cloud', reason: str)
        """
        clean_p = prompt.strip().lower()

        # 1. Edge Direct Routing (Local Metal GPU / NPU)
        # - Telemetry, Hardware & OS Tools
        if any(k in clean_p for k in ["cpu", "ram", "battery", "telemetry", "usage", "hardware", "time", "date"]):
            return "edge", "System Telemetry & OS status (Sub-20ms Edge execution)"
        
        # - Reminders, Tasks, Alarms
        if any(k in clean_p for k in ["remind", "reminder", "alarm", "timer", "schedule", "calendar"]):
            return "edge", "OS Reminders & Action dispatch"
        
        # - Fast Math & Physics Formulas
        if re.search(r'\d+\s*[\+\-\*\/\^\=]\s*\d+', clean_p) or any(clean_p.startswith(k) for k in ["calculate", "convert", "derivative of", "integral of", "solve"]):
            return "edge", "Deterministic AST & Symbolic Math"

        # - Fast Conversational Turn-Taking & Greetings
        if len(clean_p.split()) <= 6 or any(clean_p.startswith(g) for g in ["hi", "hello", "hey", "who are you", "what can you do", "thanks"]):
            return "edge", "Low-latency conversational turn"

        # 2. Cloud Frontier Routing (If API Key is available)
        # - Deep Architectural Software Design & Long Code Synthesis
        cloud_triggers = [
            "full-stack", "refactor whole", "architect", "docker-compose",
            "kubernetes", "distributed system", "microservice architecture",
            "write a complete app", "step-by-step tutorial", "multi-file"
        ]
        if any(k in clean_p for k in cloud_triggers) or len(clean_p.split()) > 45:
            if settings.OPENROUTER_API_KEY.strip():
                return "cloud", "Deep Cognitive & Multi-File Architecture"

        # Default to high-performance local edge neural model
        return "edge", "Local Neural Model"

    def get_active_provider(self, prompt: Optional[str] = None) -> BaseAIProvider:
        if prompt:
            tier, _ = self.evaluate_routing_target(prompt)
            if tier == "cloud" and settings.OPENROUTER_API_KEY.strip():
                return self.openrouter_provider
            return self.local_provider

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
        """Generates response using hybrid cascading router with graceful edge fallback."""
        tier, reason = self.evaluate_routing_target(prompt)
        
        # Try cloud first if routed to cloud
        if tier == "cloud" and settings.OPENROUTER_API_KEY.strip():
            try:
                res = await self.openrouter_provider.generate_response(prompt, system_prompt, history)
                if res and not res.startswith("Error from Cloud Provider"):
                    return res
            except Exception:
                pass

        # Fallback to local on-device neural engine (<25ms)
        return await self.local_provider.generate_response(prompt, system_prompt, history)

ai_manager = AIManager()
