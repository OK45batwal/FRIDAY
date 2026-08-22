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
    FRIDAY AI Core Rules & Deep Reasoning Cognitive Specification.
    Implements:
    1. Multi-Turn Semantic Context Resolution & Pronoun Disambiguation
    2. Deep 4-Stage Reasoning Blueprint (Executive Summary, Mechanics & Math, Production Code, Edge Cases)
    3. Input Validation & Safety Guardrails
    4. Anti-Hallucination & Concrete Grounding
    """

    MAX_INPUT_LENGTH = 32000

    @staticmethod
    def validate_and_sanitize_input(text: str) -> Tuple[bool, str, Optional[str]]:
        """Validates and sanitizes user input."""
        if not text or not text.strip():
            return False, "", "Message cannot be empty."

        clean = text.strip()
        if len(clean) > AICoreRules.MAX_INPUT_LENGTH:
            clean = clean[:AICoreRules.MAX_INPUT_LENGTH]

        clean = "".join(ch for ch in clean if ch.isprintable() or ch in ('\n', '\r', '\t'))
        return True, clean, None

    @staticmethod
    def classify_intent(text: str) -> UserIntent:
        """Directs query to specialized tool or reasoning engine."""
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

        if re.match(r'^[\d\.\s\+\-\*\/\(\)\^x÷]+$', t_lower) and any(op in t_lower for op in ['+', '-', '*', '/', 'x', '÷']):
            return UserIntent.MATH_CALCULATOR

        # 6. Native OS & Computer Tools
        if any(k in t_lower for k in ["telemetry", "cpu", "ram usage", "battery", "hardware status", "open spotify", "launch spotify", "open vscode", "open code", "open terminal", "what time"]):
            return UserIntent.OS_TOOL

        # 7. Code & Architecture
        if any(k in t_lower for k in ["write code", "python script", "typescript function", "react component", "fastapi route", "implement", "refactor", "debug"]):
            return UserIntent.CODE_SYNTHESIS

        # 8. RAG & Document Knowledge
        if any(k in t_lower for k in ["documentation", "spec", "architecture", "dataset", "milestone", "how does friday work"]):
            return UserIntent.RAG_KNOWLEDGE

        return UserIntent.GENERAL_REASONING

    @staticmethod
    def check_safety_boundary(intent: UserIntent, text: str) -> Optional[str]:
        """Prevents destructive OS actions without explicit user confirmation."""
        if intent == UserIntent.DESTRUCTIVE_ACTION:
            return "⚠️ **Security Guardrail Active**: The requested operation requires explicit confirmation because it could modify or delete critical system files. Please confirm explicitly before proceeding."
        return None

    @staticmethod
    def enrich_context_with_intent(
        current_message: str,
        history: List[Dict[str, Any]],
        user_facts: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, Optional[str]]:
        """
        Pillar 1: Multi-Turn Entity & Goal Disambiguation.
        Detects pronouns ('it', 'this', 'that', 'there') and resolves context from prior turns.
        Returns: (enriched_prompt, context_summary)
        """
        msg_lower = current_message.lower().strip()
        pronoun_triggers = ["it", "this", "that", "there", "the error", "the function", "the code", "why", "how to fix", "optimize it"]
        has_pronoun = any(re.search(rf'\b{re.escape(trigger)}\b', msg_lower) for trigger in pronoun_triggers)

        context_summary = None
        if has_pronoun and history:
            # Find the most recent meaningful user and assistant messages
            recent_turns = [h["content"] for h in history[-3:] if h.get("content")]
            if recent_turns:
                context_summary = f"[Active Context: User is referencing prior topic: '{recent_turns[-1][:120]}...']"

        return current_message, context_summary

    @staticmethod
    def build_system_instruction(
        agent_mode: Optional[str] = "general",
        user_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Pillar 2: 4-Stage Deep Reasoning Cognitive Blueprint.
        Instructs the model to provide deep, exhaustive, structured answers with zero fluff.
        """
        user_name = user_context.get("user_name", "Omkar") if user_context else "Omkar"
        hardware = user_context.get("hardware", "Apple Silicon Mac (macOS)") if user_context else "Apple Silicon Mac"

        base = f"""You are FRIDAY — an elite, high-intelligence AI Operating Assistant and Senior Software Architect built for {user_name} on {hardware}.

### Core Cognitive Rules for Deep Answering:
1. **Understand Intent Deeply**: Unpack the user's underlying goal, constraints, and implicit technical requirements.
2. **4-Stage Structured Response**:
   - **🎯 Core Takeaway & Direct Answer**: State the fundamental answer or diagnostic conclusion directly and authoritatively in the first 2 sentences.
   - **🔬 Technical Mechanics & First Principles**: Explain *how* and *why* it works under the hood (memory layout, algorithmic complexity $O(N)$, math formulas, attention mechanisms, or OS kernel execution).
   - **💻 Production Implementation**: When providing code, write complete, production-grade, typed solutions (FastAPI, React, TypeScript, Python 3.12+). **Never use placeholders, ellipsis (`...`), or truncated examples.**
   - **⚠️ Edge Cases & Optimizations**: Highlight concurrency bottlenecks, race conditions, memory pitfalls, and security guardrails.
3. **LaTeX Math & Exact Formulas**: Always use LaTeX notation ($$ ... $$ and $ ... $) for math, physics, neural network architectures, and algorithms.
4. **Honesty & Boundaries**: If a fact is unverified or unavailable, state your technical boundaries clearly rather than hallucinating."""

        if agent_mode == "programming":
            base += "\n\n[PRIMARY FOCUS: SENIOR SOFTWARE ARCHITECT] Provide type-safe, async-first, highly scalable implementations with comprehensive docstrings and test cases."
        elif agent_mode == "system":
            base += "\n\n[PRIMARY FOCUS: OS & COMPUTER CONTROLLER] Focus on macOS Darwin automation, shell commands, hardware telemetry, and process lifecycle."
        elif agent_mode == "education":
            base += "\n\n[PRIMARY FOCUS: DEEP REASONING & SCIENCE] Provide rigorous first-principles explanations, mathematical derivations, and intuitive analogies."

        return base

    @staticmethod
    def manage_context_window(history: List[Dict[str, Any]], max_turns: int = 10) -> List[Dict[str, Any]]:
        """Keeps sliding window of recent conversation turns."""
        if not history:
            return []
        return history[-max_turns:]

core_rules = AICoreRules()
