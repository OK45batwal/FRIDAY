import asyncio
import datetime
from typing import List, Dict, Any
from services.core.core.ai.provider import BaseAIProvider

class MockAIProvider(BaseAIProvider):
    @property
    def name(self) -> str:
        return "mock"

    async def generate_response(
        self,
        prompt: str,
        system_prompt: str,
        history: List[Dict[str, Any]]
    ) -> str:
        await asyncio.sleep(0.2)
        p_lower = prompt.lower().strip()

        if "hello" in p_lower or "hi" in p_lower or "hey friday" in p_lower:
            return "Good evening, Omkar. FRIDAY core is online and all systems are operational."
        elif "who are you" in p_lower:
            return "I am FRIDAY — your AI Operating Assistant. I manage your tasks, conversations, and workflows."
        elif "help me plan" in p_lower or "plan my project" in p_lower:
            return "Certainly. To plan your project, I recommend breaking it down into 4 key phases: 1. Core Architecture Setup, 2. Database & Data Models, 3. API & AI Orchestration, 4. Interactive Desktop & Voice Interface."
        elif "first step" in p_lower or "explain the first step" in p_lower:
            return "The first step is establishing the modular monorepo structure with isolated backend services, shared type packages, and an Electron/React desktop client. This provides a scalable foundation for future tools and agents."
        elif "time" in p_lower:
            now_str = datetime.datetime.now().strftime("%I:%M %p")
            return f"The current system time is {now_str}."
        elif "status" in p_lower:
            return "All diagnostic parameters are within optimal operating thresholds. Neural links and database services are active."
        else:
            return f"Acknowledged. I have processed your input regarding: '{prompt}'. Ready to assist with next steps."
