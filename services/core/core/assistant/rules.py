import re
from typing import Dict, Any, Optional, Tuple, List
from enum import Enum

class UserIntent(str, Enum):
    MATH_CALCULATOR = "math_calculator"
    OS_TOOL = "os_tool"
    WEB_SEARCH = "web_search"
    FILE_SYSTEM = "file_system"
    REMINDERS = "reminders"
    RAG_KNOWLEDGE = "rag_knowledge"
    GENERAL_REASONING = "general_reasoning"
    CODE_SYNTHESIS = "code_synthesis"
    DESTRUCTIVE_ACTION = "destructive_action"

class AICoreRules:
    """
    FRIDAY AI Core Rules & Behavior Specification.
    Implements the 10 Golden Rules of AI Chatbots:
    1. Define Purpose & Personality
    2. Input Validation & Normalization
    3. Intent Routing (Tools vs LLM vs RAG vs Math vs Files vs Reminders)
    4. Context & Memory Management
    5. Anti-Hallucination & Truthfulness
    6. Destructive Action & Safety Boundaries
    7. Output Validation & Adaptation
    """

    MAX_INPUT_LENGTH = 32000

    @staticmethod
    def validate_and_sanitize_input(text: str) -> Tuple[bool, str, Optional[str]]:
        """
        Rule 3: Always Validate User Input.
        Returns: (is_valid, sanitized_text, error_message)
        """
        if not text or not text.strip():
            return False, "", "Message cannot be empty."

        clean = text.strip()
        if len(clean) > AICoreRules.MAX_INPUT_LENGTH:
            clean = clean[:AICoreRules.MAX_INPUT_LENGTH]

        # Strip null bytes and non-printable control characters
        clean = "".join(ch for ch in clean if ch.isprintable() or ch in ('\n', '\r', '\t'))
        return True, clean, None

    @staticmethod
    def classify_intent(text: str) -> UserIntent:
        """
        Rule 2 & 8: Intent Detection & Routing.
        Directs query to the specialized subsystem rather than treating LLM as source of truth.
        """
        t_lower = text.lower().strip()

        # 1. Destructive Actions Safety Boundary
        if any(k in t_lower for k in ["delete all", "rm -rf", "format disk", "wipe system", "drop database"]):
            return UserIntent.DESTRUCTIVE_ACTION

        # 2. Web Search & Browser Navigation
        if any(k in t_lower for k in ["search web", "search google", "google for", "look up on web", "browse for", "open url"]):
            return UserIntent.WEB_SEARCH

        # 3. macOS Reminders & Schedule
        if any(k in t_lower for k in ["remind me", "create reminder", "add reminder", "set reminder", "my reminders", "show reminders"]):
            return UserIntent.REMINDERS

        # 4. File System Operations
        if any(k in t_lower for k in ["list files", "list directory", "read file", "read package.json", "find files", "search file"]):
            return UserIntent.FILE_SYSTEM

        # 5. Math & Unit Conversions
        if any(k in t_lower for k in ["calculate", "solve", "what is", "convert"]) and any(c in t_lower for c in ["+", "-", "*", "/", "%", "c to f", "f to c", "celsius", "fahrenheit"]):
            return UserIntent.MATH_CALCULATOR

        # Check pure arithmetic expressions (e.g. "10+50+90")
        if re.match(r'^[\d\.\s\+\-\*\/\(\)\^x÷]+$', t_lower) and any(op in t_lower for op in ['+', '-', '*', '/', 'x', '÷']):
            return UserIntent.MATH_CALCULATOR

        # 6. Native OS & Computer Tools
        if any(k in t_lower for k in ["telemetry", "cpu", "ram usage", "battery", "hardware status", "open spotify", "launch spotify", "open vscode", "open code", "open terminal", "what time"]):
            return UserIntent.OS_TOOL

        # 7. Code & Architecture
        if any(k in t_lower for k in ["write code", "python script", "typescript function", "react component", "fastapi route", "implement"]):
            return UserIntent.CODE_SYNTHESIS

        # 8. RAG & Document Knowledge
        if any(k in t_lower for k in ["documentation", "spec", "architecture", "dataset", "milestone"]):
            return UserIntent.RAG_KNOWLEDGE

        return UserIntent.GENERAL_REASONING

    @staticmethod
    def check_safety_boundary(intent: UserIntent, text: str) -> Optional[str]:
        """
        Rule 9 & 10: Give Model Clear Boundaries & Verify High-Impact Actions.
        """
        if intent == UserIntent.DESTRUCTIVE_ACTION:
            return "⚠️ **Security Guardrail Active**: The requested operation requires explicit confirmation because it could modify or delete critical system files. Please confirm explicitly before proceeding."
        return None

    @staticmethod
    def build_system_instruction(agent_mode: Optional[str] = "general") -> str:
        """
        Rule 6: Stable, Concise System Instruction.
        """
        base = """You are FRIDAY — an elite AI Operating Assistant, senior software architect, and computational brain for Omkar.
Rules:
- Understand the user's intent directly and provide structured, authoritative answers.
- For code: write clean, production-grade, typed implementations with zero fluff.
- For math & science: give precise calculations and verifiable step-by-step formulas.
- If information is unavailable or uncertain, state your boundaries clearly rather than inventing facts."""

        if agent_mode == "programming":
            base += "\n- [MODE: SENIOR SOFTWARE ARCHITECT] Focus on algorithms, clean code patterns, async I/O, and type safety."
        elif agent_mode == "writing":
            base += "\n- [MODE: STRATEGIC WRITER] Focus on crisp technical specifications, clear roadmaps, and executive tone."
        elif agent_mode == "system":
            base += "\n- [MODE: OS & COMPUTER CONTROLLER] Focus on macOS automation, shell tools, and hardware telemetry."
        elif agent_mode == "education":
            base += "\n- [MODE: REASONING & SCIENCE] Focus on intuitive explanations, step-by-step problem solving, and math."

        return base

    @staticmethod
    def manage_context_window(history: List[Dict[str, Any]], max_turns: int = 8) -> List[Dict[str, Any]]:
        """
        Rule 4 & 11: Manage Conversation Context & Selective Memory.
        Keeps sliding window of recent messages to preserve active context without unbounded token growth.
        """
        if not history:
            return []
        return history[-max_turns:]

core_rules = AICoreRules()
