"""Unit & Integration Tests for Laya Decision Brain & Fast-Path Routing."""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock

from backend.ai.laya_brain import (
    LayaBrain,
    LayaDecision,
    extract_math_expression,
    CHOICE_TO_INTENT,
    CHOICE_TO_TOOL,
)
from backend.ai.orchestrator import FridayOrchestrator, IntentType
from backend.database.database import init_db


def test_math_expression_extraction():
    """Verify safe mathematical expression extraction and DoS/injection rejection."""
    # Valid extractions
    assert extract_math_expression("what is 25 * 40?") == "25 * 40"
    assert extract_math_expression("calculate 100 / 4 + 10") == "100 / 4 + 10"
    assert extract_math_expression("what's 2^8?") == "2**8"
    assert extract_math_expression("compute (50 + 25) * 2") == "(50 + 25) * 2"
    assert extract_math_expression("how much is 15.5 + 4.5?") == "15.5 + 4.5"
    assert extract_math_expression("99 - 33") == "99 - 33"

    # Non-math / invalid queries return None
    assert extract_math_expression("") is None
    assert extract_math_expression("hello how are you") is None
    assert extract_math_expression("what is the weather in London?") is None
    assert extract_math_expression("who is Albert Einstein?") is None

    # Code injection attempts return None
    assert extract_math_expression("__import__('os').system('ls')") is None
    assert extract_math_expression("eval('2+2')") is None
    assert extract_math_expression("open('/etc/passwd').read()") is None


def test_heuristic_classification():
    """Verify keyword fallback classification when neural model is bypassed."""
    brain = LayaBrain()

    # Time fast-path
    res_time = brain.heuristic_classify("What time is it right now?")
    assert res_time.intent == "TOOL_REQUEST"
    assert res_time.laya_choice == "time"
    assert res_time.can_fast_path is True
    assert res_time.suggested_tool == "time"
    assert res_time.fallback_used is True

    # System info fast-path
    res_sys = brain.heuristic_classify("Check battery and RAM status")
    assert res_sys.intent == "TOOL_REQUEST"
    assert res_sys.laya_choice == "system_info"
    assert res_sys.can_fast_path is True
    assert res_sys.suggested_tool == "system_info"

    # Calculator fast-path
    res_calc = brain.heuristic_classify("calculate 45 * 10")
    assert res_calc.intent == "TOOL_REQUEST"
    assert res_calc.laya_choice == "calculator"
    assert res_calc.can_fast_path is True
    assert res_calc.tool_args == {"expression": "45 * 10"}

    # Memory save
    res_mem = brain.heuristic_classify("Remember that my favorite language is Python")
    assert res_mem.intent == "MEMORY_SAVE"
    assert res_mem.can_fast_path is False

    # Memory recall
    res_recall = brain.heuristic_classify("What did I tell you about my favorite language?")
    assert res_recall.intent == "MEMORY_RECALL"
    assert res_recall.can_fast_path is False

    # Question
    res_q = brain.heuristic_classify("Why is the sky blue?")
    assert res_q.intent == "QUESTION"
    assert res_q.needs_llm is True

    # General chat
    res_chat = brain.heuristic_classify("Hello Friday, good morning!")
    assert res_chat.intent == "GENERAL_CHAT"
    assert res_chat.needs_llm is True


def test_laya_decision_dataclass():
    """Verify LayaDecision attributes and defaults."""
    d = LayaDecision(
        intent="TOOL_REQUEST",
        laya_choice="calculator",
        confidence=0.95,
        probabilities={"calculator": 0.95, "general_chat": 0.05},
        complexity=1.0,
        needs_llm=False,
        can_fast_path=True,
        suggested_tool="calculator",
        tool_args={"expression": "10 + 20"},
        latency_ms=12.5,
    )
    assert d.intent == "TOOL_REQUEST"
    assert d.laya_choice == "calculator"
    assert d.confidence == 0.95
    assert d.can_fast_path is True
    assert d.latency_ms == 12.5
    assert d.fallback_used is False


def test_orchestrator_fast_path_formatting():
    """Verify formatting of fast-path tool responses."""
    orch = FridayOrchestrator()

    # Calculator
    calc_fmt = orch._format_fast_path_response("calculator", {"expression": "25 * 40"}, "Result: 25 * 40 = 1000")
    assert "1000" in calc_fmt
    assert "25 * 40" in calc_fmt

    # Time
    time_fmt = orch._format_fast_path_response("time", {}, "Current Date & Time:\n- Date: Tuesday, Sep 22\n- Time: 6:00 PM")
    assert "Current Date & Time" in time_fmt

    # System info
    sys_fmt = orch._format_fast_path_response("system_info", {}, "Battery: 95%\nRAM: 16 GB")
    assert "Battery" in sys_fmt


def test_orchestrator_fast_path_stream():
    """Verify that process_stream executes fast path without contacting Ollama."""
    async def _test():
        await init_db()
        orch = FridayOrchestrator()

        # Mock laya to return an immediate fast-path decision
        mock_decision = LayaDecision(
            intent="TOOL_REQUEST",
            laya_choice="calculator",
            confidence=0.98,
            probabilities={"calculator": 0.98},
            complexity=0.5,
            needs_llm=False,
            can_fast_path=True,
            suggested_tool="calculator",
            tool_args={"expression": "12 * 12"},
            latency_ms=5.0,
        )

        with patch.object(orch.laya, "classify", AsyncMock(return_value=mock_decision)):
            # Ensure ollama client is NOT called
            with patch.object(orch.client, "chat", AsyncMock()) as mock_chat:
                events = []
                async for event in orch.process_stream("calculate 12 * 12"):
                    events.append(event)

                # Ollama should NOT have been touched
                mock_chat.assert_not_called()

                # Verify event stream
                event_types = [e["type"] for e in events]
                assert "assistant_started" in event_types
                assert "intent_detected" in event_types
                assert "tool_started" in event_types
                assert "tool_completed" in event_types
                assert "assistant_token" in event_types
                assert "assistant_finished" in event_types

                # Verify fast_path flag
                tool_comp = next(e for e in events if e["type"] == "tool_completed")
                assert tool_comp["fast_path"] is True
                assert "144" in tool_comp["result"]

                fin = next(e for e in events if e["type"] == "assistant_finished")
                assert fin["fast_path"] is True

    asyncio.run(_test())


def test_orchestrator_llm_fallback_when_ollama_offline():
    """Verify that non-fast-path requests report Ollama offline gracefully."""
    async def _test():
        await init_db()
        orch = FridayOrchestrator()

        mock_decision = LayaDecision(
            intent="GENERAL_CHAT",
            laya_choice="general_chat",
            confidence=0.80,
            probabilities={"general_chat": 0.80},
            complexity=2.0,
            needs_llm=True,
            can_fast_path=False,
            latency_ms=5.0,
        )

        with patch.object(orch.laya, "classify", AsyncMock(return_value=mock_decision)):
            with patch.object(orch.client, "check_health", AsyncMock(return_value=False)):
                events = []
                async for event in orch.process_stream("Tell me a creative story"):
                    events.append(event)

                event_types = [e["type"] for e in events]
                assert "intent_detected" in event_types
                assert "error" in event_types
                err_event = next(e for e in events if e["type"] == "error")
                assert "offline" in err_event["message"].lower()

    asyncio.run(_test())


def test_live_laya_prediction_if_loaded():
    """Verify live Laya prediction when checkpoint is loaded."""
    async def _test():
        from backend.ai.laya_brain import laya_brain

        # If already loaded on MPS or CPU, run a fast verification
        if laya_brain.is_loaded:
            decision = await laya_brain.classify("What is 15 + 25?")
            assert decision.intent == "TOOL_REQUEST"
            assert decision.suggested_tool == "calculator"
            assert decision.can_fast_path is True
            assert decision.latency_ms > 0

    asyncio.run(_test())
