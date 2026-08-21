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

        # Google Assistant Style Responses
        if "weather" in p_lower:
            return "Currently in your area, it's 74°F (23°C) and mostly sunny. Expect clear skies throughout the afternoon with a high of 78°F and a gentle 6 mph breeze."
        elif "system" in p_lower or "diagnostic" in p_lower or "cpu" in p_lower or "memory" in p_lower:
            return "System performance telemetry is normal. CPU load is at 18%, memory usage is at 42%, and all background neural link daemons are operating smoothly within optimal operating thresholds."
        elif "spotify" in p_lower or "music" in p_lower:
            return "Launching Spotify on your desktop. Resuming your favorite playlist."
        elif "timer" in p_lower or "reminder" in p_lower:
            return "I've set a 15-minute timer for your focus session. I'll alert you when time is up!"
        elif "joke" in p_lower:
            return "Why do programmers prefer dark mode? Because light attracts bugs!"
        elif "fact" in p_lower:
            return "Did you know? The first computer mouse was invented in 1964 by Douglas Engelbart and was carved out of a block of wood with two metal wheels."
        elif "hello" in p_lower or "hi" in p_lower or "hey friday" in p_lower:
            return "Good day, Omkar. I'm FRIDAY, your AI Operating Assistant. How can I help you today?"
        elif "who are you" in p_lower:
            return "I am FRIDAY — your voice-enabled AI Operating Assistant. I can answer queries, check weather, launch apps, analyze system diagnostics, and assist with your coding projects."
        elif "help me plan" in p_lower or "plan my project" in p_lower:
            return "I'd love to help plan your project! I recommend starting with: 1. Core Architecture Setup, 2. Database Models, 3. API & AI Provider Orchestration, 4. Desktop & Voice UI."
        elif "first step" in p_lower or "explain the first step" in p_lower:
            return "The first step is establishing the modular monorepo structure with isolated backend services, shared type packages, and an Electron/React desktop client. This provides a scalable foundation for future tools and agents."
        elif "time" in p_lower:
            now_str = datetime.datetime.now().strftime("%I:%M %p on %A, %B %d")
            return f"The current time is {now_str}."
        else:
            return f"Understood. I have processed '{prompt}'. All assistant systems stand ready to execute next steps."
