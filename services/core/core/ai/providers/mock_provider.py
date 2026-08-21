import asyncio
import datetime
import re
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
        p = prompt.strip()
        p_lower = p.lower()

        # 1. Weather
        if "weather" in p_lower or "temperature" in p_lower:
            return "Currently in your area, it's 74°F (23°C) and mostly sunny. Expect clear skies throughout the afternoon with a high of 78°F and a gentle 6 mph breeze."

        # 2. System Diagnostics / Telemetry
        elif any(k in p_lower for k in ["system", "diagnostic", "cpu", "memory", "ram", "battery", "telemetry", "hardware"]):
            return "System performance telemetry is normal. CPU load is at 18%, memory usage is at 42%, and all background neural link daemons are operating smoothly within optimal operating thresholds."

        # 3. Spotify / Music / Apps
        elif any(k in p_lower for k in ["spotify", "music", "play song", "playlist"]):
            return "Launching Spotify on your desktop. Resuming your favorite playlist."
        elif "youtube" in p_lower:
            return "Opening YouTube in your primary browser window."
        elif "terminal" in p_lower or "command line" in p_lower:
            return "Opening terminal session in your current workspace directory."

        # 4. Timers / Alarms
        elif any(k in p_lower for k in ["timer", "alarm", "remind", "stopwatch"]):
            # Extract numbers if present
            mins = re.findall(r'\d+', p_lower)
            duration = f"{mins[0]} minutes" if mins else "15 minutes"
            return f"I've set a {duration} timer for you. I will alert you as soon as the countdown completes!"

        # 5. Jokes / Fun
        elif "joke" in p_lower:
            jokes = [
                "Why do programmers prefer dark mode? Because light attracts bugs!",
                "There are 10 types of people in the world: those who understand binary, and those who don't.",
                "Why did the developer go broke? Because he used up all his cache!"
            ]
            return jokes[len(prompt) % len(jokes)]
        elif "fact" in p_lower:
            facts = [
                "Did you know? The first computer mouse was invented in 1964 by Douglas Engelbart and was carved out of a block of wood with two metal wheels.",
                "Did you know? Python was named after the British comedy troupe Monty Python, not the snake species.",
                "Did you know? The first computer bug was an actual moth found trapped inside the Mark II computer in 1947 by Grace Hopper's team."
            ]
            return facts[len(prompt) % len(facts)]

        # 6. Identity / Greetings
        elif any(k in p_lower for k in ["who are you", "what is your name", "what can you do", "introduce yourself"]):
            return "I am FRIDAY — your voice-enabled AI Operating Assistant. I can control apps, check live weather, inspect hardware telemetry, provide multi-turn conversation, write code, and connect with OpenRouter, OpenAI, Gemini, or local LLMs."
        elif any(k in p_lower for k in ["hello", "hi", "hey", "good morning", "good evening", "hey friday"]):
            return "Good day, Omkar! I'm online and listening. How can I assist you with your work or computer today?"
        elif "how are you" in p_lower:
            return "All diagnostic parameters and neural threads are functioning at peak efficiency! Ready to assist you whenever you need."

        # 7. Project Planning / Roadmap
        elif any(k in p_lower for k in ["help me plan", "plan my project", "roadmap", "next step"]):
            return "I'd love to help plan your project! I recommend starting with: 1. Core Architecture Setup, 2. Database Models, 3. API & AI Provider Orchestration, 4. Desktop & Voice UI."
        elif any(k in p_lower for k in ["first step", "explain the first step"]):
            return "The first step is establishing the modular monorepo structure with isolated backend services, shared type packages, and an Electron/React desktop client. This provides a scalable foundation for future tools and agents."

        # 8. Programming & Tech Questions
        elif "python" in p_lower:
            return "Python is a high-level, dynamically typed programming language known for its clear syntax and massive ecosystem for AI, backend development (FastAPI/Django), and scientific computing."
        elif "react" in p_lower or "typescript" in p_lower:
            return "React and TypeScript together provide strong static typing, declarative component trees, and rapid UI development for desktop and web applications."
        elif "fastapi" in p_lower:
            return "FastAPI is a modern, high-performance web framework for building APIs with Python 3.8+ based on standard Python type hints, Starlette, and Pydantic."

        # 9. Time & Date
        elif "time" in p_lower or "date" in p_lower:
            now_str = datetime.datetime.now().strftime("%I:%M %p on %A, %B %d, %Y")
            return f"The current date and time is {now_str}."

        # 10. Natural Intelligent Response for general input
        else:
            return f"I've received your request regarding: \"{prompt}\". All assistant systems and neural link threads are active and ready. (Tip: You can connect your OpenRouter API key in CONFIG to unlock full reasoning with Claude, DeepSeek, or Llama 3!)."
