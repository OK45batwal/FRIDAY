"""FRIDAY Central AI Orchestrator."""

import time
import asyncio
from typing import AsyncGenerator, Dict, Any, Optional, List
from backend.config.settings import settings
from backend.ai.prompt_manager import prompt_manager
from backend.ai.ollama_client import ollama_client
from backend.ai.response_parser import ResponseParser
from backend.memory.memory_manager import memory_manager
from backend.tools.registry import tool_registry
from backend.database.repositories import ConversationRepository, MessageRepository
from backend.utils.logger import get_logger

logger = get_logger("orchestrator")


class IntentType:
    GENERAL_CHAT = "GENERAL_CHAT"
    QUESTION = "QUESTION"
    COMMAND = "COMMAND"
    TOOL_REQUEST = "TOOL_REQUEST"
    MEMORY_SAVE = "MEMORY_SAVE"
    MEMORY_RECALL = "MEMORY_RECALL"
    SYSTEM_REQUEST = "SYSTEM_REQUEST"


class FridayOrchestrator:
    """The central brain orchestrating intent, memory, tools, and response generation."""

    def __init__(self):
        self.prompt_manager = prompt_manager
        self.client = ollama_client
        self.memory = memory_manager
        self.tools = tool_registry
        self.parser = ResponseParser()

    def classify_intent(self, text: str) -> str:
        """Classify user intent into an operational category."""
        t = text.lower().strip()
        if any(w in t for w in ("remember that", "don't forget that", "my name is", "my project is", "i prefer", "i like")):
            return IntentType.MEMORY_SAVE
        if any(w in t for w in (
            "calculate", "compute", "multiply", "divide", "plus", "minus",
            "weather", "forecast",
            "search web", "search google", "search online", "look up online",
            "find file", "search file", "open file", "read file",
            "battery", "ram", "cpu", "disk", "hardware", "system info", "system status", "system stats",
            "what time", "current time", "what date", "today's date",
        )) or any(op in t for op in (" + ", " * ", " / ", " - ", "^")):
            return IntentType.TOOL_REQUEST
        if any(w in t for w in ("what did i tell you", "what is my", "what's my", "do you remember", "who am i")):
            return IntentType.MEMORY_RECALL
        if any(w in t for w in ("what", "how", "why", "who", "where", "when", "explain", "tell me")):
            return IntentType.QUESTION
        return IntentType.GENERAL_CHAT

    async def process_stream(
        self,
        user_text: str,
        conversation_id: Optional[str] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Complete streaming execution pipeline yielding lifecycle events."""
        t_start = time.time()

        # Ensure active conversation
        if not conversation_id:
            conv = await ConversationRepository.create(title=user_text[:30] + "...")
            conversation_id = conv.id
            yield {"type": "conversation_created", "conversation_id": conversation_id}

        # 1. Start Event
        yield {"type": "assistant_started", "conversation_id": conversation_id}

        # Pre-flight check: ensure Ollama is alive
        if not await self.client.check_health():
            yield {"type": "assistant_state", "state": "ERROR"}
            yield {
                "type": "error",
                "message": f"Local LLM (Ollama) is offline or unreachable at {self.client.base_url}. Please start Ollama with 'ollama serve' or execute ./run.sh.",
            }
            return

        yield {"type": "assistant_state", "state": "THINKING"}

        # 2. Persist User Message
        await MessageRepository.add(conversation_id=conversation_id, role="user", content=user_text)

        # 3. Memory & Intent Evaluation
        intent = self.classify_intent(user_text)
        yield {"type": "intent_detected", "intent": intent}

        saved_mem = None
        if settings.ENABLE_MEMORY:
            saved_mem = await self.memory.evaluate_and_store(user_text)
            if saved_mem:
                yield {"type": "memory_saved", "content": saved_mem.content, "category": saved_mem.category}

        context_data = await self.memory.get_context(conversation_id, user_text)
        history = context_data.get("conversation_history", [])
        memories = context_data.get("long_term_memories", [])

        # 4. Construct System & Context Messages
        if intent == IntentType.MEMORY_SAVE and saved_mem:
            system_prompt = f"You are FRIDAY. The user just asked you to remember: '{saved_mem.content}'. You have safely recorded this in your long-term memory database. Acknowledge that you have remembered it warmly, concisely, and confirm what was saved. Do NOT invoke any tools."
        elif intent == IntentType.MEMORY_RECALL and memories:
            m_list = "\n".join(f"• {m}" for m in memories)
            system_prompt = f"You are FRIDAY. The user is asking to recall information from memory.\nRELEVANT MEMORIES FROM DATABASE:\n{m_list}\n\nAnswer the user's question directly and concisely using the memories above. Do NOT invoke any tools."
        else:
            system_prompt = self.prompt_manager.build_system_prompt(memories=memories)

        llm_messages = [{"role": "system", "content": system_prompt}]

        # Append previous turns (excluding last which is current user prompt)
        for h in history[:-1]:
            llm_messages.append(h)
        llm_messages.append({"role": "user", "content": user_text})

        final_response_text = ""

        try:
            # Step 5: First pass to detect tool requests
            initial_response = await self.client.chat(llm_messages)
            tool_call = self.parser.parse_tool_call(initial_response)

            if tool_call and self.tools.get(tool_call["tool"]):
                tool_name = tool_call["tool"]
                tool_args = tool_call.get("arguments", {})

                # Notify tool started
                yield {"type": "assistant_state", "state": "USING_TOOL"}
                yield {"type": "tool_started", "tool": tool_name, "arguments": tool_args}

                # Execute Tool
                tool_output = await self.tools.execute(tool_name, tool_args)

                yield {"type": "tool_completed", "tool": tool_name, "result": tool_output}

                # Feed observation back
                obs_prompt = self.prompt_manager.build_observation_prompt(tool_name, tool_output)
                llm_messages.append({"role": "assistant", "content": initial_response})
                llm_messages.append({"role": "user", "content": obs_prompt})

                # Stream final synthesized response
                yield {"type": "assistant_state", "state": "SPEAKING"}
                async for token in self.client.chat_stream(llm_messages):
                    final_response_text += token
                    yield {"type": "assistant_token", "content": token}

            else:
                # Direct conversational response
                yield {"type": "assistant_state", "state": "SPEAKING"}
                # If we got the initial_response, stream it smoothly
                for i in range(0, len(initial_response), 3):
                    chunk = initial_response[i:i+3]
                    final_response_text += chunk
                    yield {"type": "assistant_token", "content": chunk}
                    await asyncio.sleep(0.01)

            # Clean any leftover markup
            final_clean = self.parser.clean_tool_syntax(final_response_text)

            # Persist Assistant Message
            await MessageRepository.add(conversation_id=conversation_id, role="assistant", content=final_clean)

            total_time = round(time.time() - t_start, 2)
            yield {"type": "assistant_state", "state": "ONLINE"}
            yield {"type": "assistant_finished", "conversation_id": conversation_id, "duration": total_time}

        except Exception as e:
            logger.error(f"Orchestration error: {e}", exc_info=True)
            yield {"type": "assistant_state", "state": "ERROR"}
            yield {"type": "error", "message": f"I encountered an issue: {str(e)}"}


# Global FridayOrchestrator singleton
orchestrator = FridayOrchestrator()
