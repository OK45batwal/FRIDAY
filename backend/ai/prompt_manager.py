"""Dynamic Prompt Management for FRIDAY Orchestrator."""

import os
from datetime import datetime
from typing import List, Dict, Any
from backend.tools.registry import tool_registry

PROMPTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "prompts")


class PromptManager:
    def __init__(self, prompts_dir: str = PROMPTS_DIR):
        self.prompts_dir = prompts_dir
        self._load_templates()

    def _load_templates(self):
        self.system_tpl = self._read_file("system.txt", "You are FRIDAY, a helpful AI assistant.")
        self.tool_tpl = self._read_file("tool_instruction.txt", "AVAILABLE TOOLS:\n{tools_description}")
        self.memory_tpl = self._read_file("memory.txt", "RELEVANT MEMORIES:\n{memories_list}")
        self.final_tpl = self._read_file("final_response.txt", "TOOL OBSERVATION ({tool_name}):\n{tool_result}")

    def _read_file(self, filename: str, fallback: str) -> str:
        path = os.path.join(self.prompts_dir, filename)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        return fallback

    def build_system_prompt(self, memories: List[str] = None) -> str:
        """Assemble full system prompt with tools, date/time, and relevant memories."""
        parts = [self.system_tpl.strip()]

        # Inject current time
        now_str = datetime.now().strftime("%A, %B %d, %Y at %I:%M %p")
        parts.append(f"\nCURRENT SYSTEM DATE & TIME:\n{now_str}")

        # Inject tool schemas
        tools = tool_registry.list_tools()
        tools_desc = []
        for t in tools:
            params_desc = ", ".join(f"{k}: {v.get('type')}" for k, v in t.get("parameters", {}).items())
            tools_desc.append(f"- {t['name']}({params_desc}): {t['description']}")
        
        tools_text = self.tool_tpl.format(tools_description="\n".join(tools_desc))
        parts.append("\n" + tools_text.strip())

        # Inject long-term memories if available
        if memories:
            m_list = "\n".join(f"• {m}" for m in memories)
            mem_text = self.memory_tpl.format(memories_list=m_list)
            parts.append("\n" + mem_text.strip())

        return "\n\n".join(parts)

    def build_observation_prompt(self, tool_name: str, tool_result: str) -> str:
        """Format tool observation prompt to guide final synthesis."""
        return self.final_tpl.format(tool_name=tool_name, tool_result=tool_result)


# Global PromptManager singleton
prompt_manager = PromptManager()
