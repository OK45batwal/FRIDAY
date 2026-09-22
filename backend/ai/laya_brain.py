"""FRIDAY Laya Decision Brain.

Provides non-autoregressive System 1 intent classification, complexity scoring,
and fast-path tool execution using the Laya decision model.
"""

import os
import re
import ast
import time
import asyncio
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List, Tuple

from backend.config.settings import settings
from backend.utils.logger import get_logger

logger = get_logger("laya_brain")

# Ensure TensorFlow abseil locks are avoided if TF is present
os.environ.setdefault("USE_TF", "0")


@dataclass
class LayaDecision:
    """Structured decision output from Laya decision engine."""
    intent: str
    laya_choice: str
    confidence: float
    probabilities: Dict[str, float] = field(default_factory=dict)
    complexity: float = 0.0
    needs_llm: bool = False
    can_fast_path: bool = False
    suggested_tool: Optional[str] = None
    tool_args: Optional[Dict[str, Any]] = None
    latency_ms: float = 0.0
    fallback_used: bool = False


# Canonical questions definition for Laya forward pass
FRIDAY_DECISION_QUESTIONS: Dict[str, Dict[str, Any]] = {
    "intent": {
        "type": "choice",
        "instructions": "Determine the single most appropriate operational action or tool required to address the user request.",
        "criteria": {
            "calculator": "Mathematical calculations, arithmetic, formulas, evaluating numerical expressions (e.g. 25*40, 100/4, 2^8)",
            "time": "Current time, date, day of the week, or timezones",
            "weather": "Checking weather conditions, temperature, rain, or forecasts for cities",
            "system_info": "Inspecting system hardware, battery percentage, RAM memory, disk space, or CPU stats",
            "file_manager": "Listing files, checking folders, browsing directories, or filesystem operations",
            "web_search": "Searching the web, online lookup for current events, external websites, or public knowledge queries",
            "memory_save": "Saving, remembering, or storing facts, user preferences, names, or personal notes",
            "memory_recall": "Recalling, querying, or asking what was previously saved or remembered in memory",
            "general_chat": "Conversational chit-chat, greetings, creative writing, bedtime stories, advice, roleplay, coding help, or general open-ended discussion",
        },
    },
    "complexity": {
        "type": "score",
        "instructions": "Rate the operational complexity of handling this user query from trivial direct execution to complex reasoning.",
        "criteria": [
            "Trivial direct lookup or simple single-step command",
            "Simple single-step tool execution or basic question",
            "Moderate question requiring context or basic synthesis",
            "Complex multi-step task or in-depth analytical reasoning",
        ],
    },
    "needs_llm": {
        "type": "noul",
        "instructions": "Does this query require generative natural language synthesis from an LLM rather than a direct structured tool response?",
    },
}

# Mapping Laya choice to FRIDAY IntentType string
CHOICE_TO_INTENT: Dict[str, str] = {
    "calculator": "TOOL_REQUEST",
    "time": "TOOL_REQUEST",
    "weather": "TOOL_REQUEST",
    "system_info": "TOOL_REQUEST",
    "file_manager": "TOOL_REQUEST",
    "web_search": "TOOL_REQUEST",
    "memory_save": "MEMORY_SAVE",
    "memory_recall": "MEMORY_RECALL",
    "general_chat": "GENERAL_CHAT",
}

# Mapping Laya choice to registered tool name in tool_registry
CHOICE_TO_TOOL: Dict[str, str] = {
    "calculator": "calculator",
    "time": "time",
    "weather": "weather",
    "system_info": "system_info",
    "file_manager": "file_manager",
    "web_search": "web_search",
}


def extract_math_expression(text: str) -> Optional[str]:
    """Safely extract and validate an arithmetic expression from natural language."""
    if not text:
        return None

    cleaned = text.strip()
    # Strip common leading conversational phrases
    prefixes = [
        r"^(?:calculate|compute|solve|what\s+is|what's|how\s+much\s+is|eval|evaluate)\s+",
        r"^(?:please\s+calculate|can\s+you\s+calculate|tell\s+me)\s+",
    ]
    for pattern in prefixes:
        cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE).strip()

    # Strip trailing punctuation like '?' or '.'
    cleaned = re.sub(r"[?!=;]+$", "", cleaned).strip()

    # Replace common symbols
    candidate = cleaned.replace("×", "*").replace("÷", "/").replace("^", "**")

    # Fast safety check: only allow safe math characters
    if not re.match(r"^[\d\s\+\-\*\/\%\(\)\.\*\*]+$", candidate):
        return None

    # Verify candidate can be parsed by AST as a valid mathematical expression
    try:
        parsed = ast.parse(candidate, mode="eval")
        # Ensure only numbers and binary/unary operations are present
        for node in ast.walk(parsed):
            if not isinstance(
                node,
                (
                    ast.Expression,
                    ast.BinOp,
                    ast.UnaryOp,
                    ast.Constant,
                    ast.operator,
                    ast.unaryop,
                ),
            ):
                return None
        return candidate
    except Exception:
        return None


class LayaBrain:
    """Non-autoregressive decision model managing fast intent classification and routing."""

    def __init__(self):
        self.agent = None
        self._is_loaded = False
        self._load_lock = asyncio.Lock()
        self._load_failed = False
        self._load_error: Optional[str] = None

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    def load_sync(self) -> bool:
        """Synchronously load the Laya checkpoint."""
        if not settings.ENABLE_LAYA:
            logger.info("Laya decision router is disabled in settings.")
            return False

        try:
            import laya

            logger.info(
                f"Loading Laya decision model from '{settings.LAYA_CHECKPOINT}' "
                f"(device={settings.LAYA_DEVICE or 'auto'})..."
            )
            t0 = time.time()
            self.agent = laya.Agent(
                model_id_or_path=settings.LAYA_CHECKPOINT,
                device=settings.LAYA_DEVICE,
            )
            elapsed = round((time.time() - t0) * 1000, 1)
            self._is_loaded = True
            self._load_failed = False
            logger.info(
                f"Laya decision model successfully loaded on {self.agent.device} in {elapsed}ms."
            )
            return True
        except Exception as e:
            self._load_failed = True
            self._load_error = str(e)
            logger.warning(
                f"Could not load Laya decision model: {e}. "
                "FRIDAY will fall back to keyword-based intent classification."
            )
            return False

    async def ensure_loaded(self) -> bool:
        """Asynchronously ensure the model is loaded in a background thread."""
        if self._is_loaded:
            return True
        if self._load_failed:
            return False

        async with self._load_lock:
            if self._is_loaded:
                return True
            if self._load_failed:
                return False
            return await asyncio.to_thread(self.load_sync)

    def heuristic_classify(self, text: str) -> LayaDecision:
        """Fast keyword-based heuristic fallback when Laya is not loaded."""
        t = text.lower().strip()
        t0 = time.time()

        # Check memory save
        if any(w in t for w in ("remember that", "don't forget that", "my name is", "my project is", "i prefer", "i like")):
            latency = round((time.time() - t0) * 1000, 2)
            return LayaDecision(
                intent="MEMORY_SAVE",
                laya_choice="memory_save",
                confidence=0.85,
                probabilities={"memory_save": 0.85},
                complexity=1.0,
                needs_llm=True,
                can_fast_path=False,
                latency_ms=latency,
                fallback_used=True,
            )

        # Check memory recall
        if any(w in t for w in ("what did i tell you", "what is my", "what's my", "do you remember", "who am i")):
            latency = round((time.time() - t0) * 1000, 2)
            return LayaDecision(
                intent="MEMORY_RECALL",
                laya_choice="memory_recall",
                confidence=0.85,
                probabilities={"memory_recall": 0.85},
                complexity=1.0,
                needs_llm=True,
                can_fast_path=False,
                latency_ms=latency,
                fallback_used=True,
            )

        # Check tool triggers
        tool_choice = None
        if any(w in t for w in ("what time", "current time", "what date", "today's date", "what day is today")):
            tool_choice = "time"
        elif any(w in t for w in ("battery", "ram", "cpu", "disk", "hardware", "system info", "system status", "system stats")):
            tool_choice = "system_info"
        elif any(w in t for w in ("calculate", "compute", "multiply", "divide", "plus", "minus")) or any(op in t for op in (" + ", " * ", " / ", " - ", "^")):
            tool_choice = "calculator"
        elif any(w in t for w in ("weather", "forecast")):
            tool_choice = "weather"
        elif any(w in t for w in ("search web", "search google", "search online", "look up online")):
            tool_choice = "web_search"
        elif any(w in t for w in ("find file", "search file", "open file", "read file")):
            tool_choice = "file_manager"

        if tool_choice:
            latency = round((time.time() - t0) * 1000, 2)
            fast_path, tool_args = self._evaluate_fast_path(tool_choice, text)
            return LayaDecision(
                intent="TOOL_REQUEST",
                laya_choice=tool_choice,
                confidence=0.80,
                probabilities={tool_choice: 0.80},
                complexity=1.0,
                needs_llm=not fast_path,
                can_fast_path=fast_path,
                suggested_tool=CHOICE_TO_TOOL.get(tool_choice),
                tool_args=tool_args,
                latency_ms=latency,
                fallback_used=True,
            )

        # Question vs General Chat
        latency = round((time.time() - t0) * 1000, 2)
        if any(w in t for w in ("what", "how", "why", "who", "where", "when", "explain", "tell me")):
            return LayaDecision(
                intent="QUESTION",
                laya_choice="general_chat",
                confidence=0.75,
                probabilities={"general_chat": 0.75},
                complexity=2.0,
                needs_llm=True,
                can_fast_path=False,
                latency_ms=latency,
                fallback_used=True,
            )

        return LayaDecision(
            intent="GENERAL_CHAT",
            laya_choice="general_chat",
            confidence=0.70,
            probabilities={"general_chat": 0.70},
            complexity=1.0,
            needs_llm=True,
            can_fast_path=False,
            latency_ms=latency,
            fallback_used=True,
        )

    def _evaluate_fast_path(self, choice: str, text: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Determine if this tool choice can be executed directly without LLM invocation."""
        if choice == "time":
            return True, {}

        if choice == "system_info":
            return True, {}

        if choice == "calculator":
            expr = extract_math_expression(text)
            if expr:
                return True, {"expression": expr}

        return False, None

    def _predict_sync(self, text: str) -> Dict[str, Any]:
        """Run the Laya forward pass synchronously."""
        return self.agent.predict(text, FRIDAY_DECISION_QUESTIONS)

    async def classify(self, user_text: str) -> LayaDecision:
        """Classify user query using Laya decision model with automatic fallback."""
        if not settings.ENABLE_LAYA:
            return self.heuristic_classify(user_text)

        if not self._is_loaded:
            loaded = await self.ensure_loaded()
            if not loaded or not self.agent:
                return self.heuristic_classify(user_text)

        t0 = time.time()
        try:
            raw_result = await asyncio.to_thread(self._predict_sync, user_text)
            latency = round((time.time() - t0) * 1000, 2)

            answers = raw_result.get("answers", {})
            intent_data = answers.get("intent", {})
            complexity_data = answers.get("complexity", {})
            needs_llm_data = answers.get("needs_llm", {})

            choice = intent_data.get("choice", "general_chat")
            confidence = float(intent_data.get("confidence", 0.0))
            probabilities = intent_data.get("probabilities", {})

            complexity = float(complexity_data.get("score", 0.0))
            noul_prob = float(needs_llm_data.get("noul", 0.5))
            needs_llm = noul_prob >= 0.5

            # If confidence is very low, treat as open-ended general chat
            if confidence < 0.45:
                choice = "general_chat"
                mapped_intent = "GENERAL_CHAT"
                suggested_tool = None
            else:
                mapped_intent = CHOICE_TO_INTENT.get(choice, "GENERAL_CHAT")
                suggested_tool = CHOICE_TO_TOOL.get(choice)

            # Check fast path candidacy
            can_fast_path = False
            tool_args = None

            # Qualify for fast-path:
            # 1. Is a supported tool (time, system_info, calculator)
            # 2. Confidence is at or above the threshold
            # 3. Not marked as strongly needing LLM synthesis
            if suggested_tool and confidence >= settings.LAYA_CONFIDENCE_THRESHOLD:
                can_fast_path, tool_args = self._evaluate_fast_path(choice, user_text)

            logger.info(
                f"[Laya] choice='{choice}' intent='{mapped_intent}' conf={confidence:.3f} "
                f"complexity={complexity:.2f} needs_llm={needs_llm} fast_path={can_fast_path} ({latency}ms)"
            )

            return LayaDecision(
                intent=mapped_intent,
                laya_choice=choice,
                confidence=confidence,
                probabilities=probabilities,
                complexity=complexity,
                needs_llm=needs_llm,
                can_fast_path=can_fast_path,
                suggested_tool=suggested_tool,
                tool_args=tool_args,
                latency_ms=latency,
                fallback_used=False,
            )

        except Exception as e:
            logger.warning(f"Laya prediction failed: {e}. Using heuristic fallback.")
            return self.heuristic_classify(user_text)


# Global LayaBrain singleton instance
laya_brain = LayaBrain()
