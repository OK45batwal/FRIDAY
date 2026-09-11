"""Integration & Unit Tests for FRIDAY Assistant Core."""

import pytest
import asyncio
from backend.database.database import init_db
from backend.database.repositories import (
    ConversationRepository,
    MessageRepository,
    MemoryRepository,
    ToolLogRepository,
    SettingsRepository,
)
from backend.tools.calculator import CalculatorTool
from backend.tools.time_tool import TimeTool
from backend.tools.system_info import SystemInfoTool
from backend.tools.registry import tool_registry
from backend.ai.response_parser import ResponseParser
from backend.memory.short_term import ShortTermMemory
from backend.memory.long_term import LongTermMemory


def test_database_and_repositories():
    async def _test():
        await init_db()
        
        # 1. Conversation CRUD
        conv = await ConversationRepository.create("Test Session")
        assert conv.id is not None
        assert conv.title == "Test Session"
        
        all_convs = await ConversationRepository.list_all()
        assert any(c.id == conv.id for c in all_convs)
        
        # 2. Message CRUD
        msg = await MessageRepository.add(conv.id, "user", "Hello FRIDAY")
        assert msg.id is not None
        assert msg.content == "Hello FRIDAY"
        
        history = await MessageRepository.get_by_conversation(conv.id)
        assert len(history) >= 1
        assert history[-1].content == "Hello FRIDAY"
        
        # 3. Memory CRUD
        mem = await MemoryRepository.add("User's name is Tony Stark", category="identity", importance=1.0)
        assert mem.id is not None
        mems = await MemoryRepository.list_all()
        assert any("Tony Stark" in m.content for m in mems)
        
        # 4. Tool Log CRUD
        log_entry = await ToolLogRepository.log("calculator", {"expression": "2+2"}, "4", "success")
        assert log_entry.id is not None
        
        # 5. Settings
        await SettingsRepository.set("test_key", "test_val")
        val = await SettingsRepository.get("test_key")
        assert val == "test_val"

        # 6. Conversation Export
        from backend.api.conversations import export_conversation
        export_md = await export_conversation(conv.id, format="markdown")
        assert "Test Session" in export_md["title"]
        assert "Hello FRIDAY" in export_md["content"]
        export_json = await export_conversation(conv.id, format="json")
        assert len(export_json["messages"]) >= 1

    asyncio.run(_test())


def test_tools():
    async def _test():
        # Calculator
        calc = CalculatorTool()
        res = await calc.execute({"expression": "125 * 48"})
        assert "6000" in res

        # Exponentiation cap (DoS protection)
        dos_res = await calc.execute({"expression": "10 ** 10000"})
        assert "error" in dos_res.lower() or "too large" in dos_res.lower()

        # Math syntax error safety
        err_res = await calc.execute({"expression": "__import__('os').system('ls')"})
        assert "error" in err_res.lower()

        # File Manager validation
        from backend.tools.file_manager import FileManagerTool
        fm = FileManagerTool()
        bad_find = await fm.execute({"action": "find", "target": "test; rm -rf /"})
        assert "error" in bad_find.lower() or "invalid" in bad_find.lower()

        # Time Tool
        t_tool = TimeTool()
        t_res = await t_tool.execute({})
        assert "Date" in t_res or "Time" in t_res or "UTC" in t_res

        # System Info Tool
        sys_tool = SystemInfoTool()
        s_res = await sys_tool.execute({})
        assert "OS" in s_res or "Platform" in s_res or "RAM" in s_res

    asyncio.run(_test())


def test_response_parser():
    # Plain text returns None
    parsed = ResponseParser.parse_tool_call("Hello, how can I assist you today?")
    assert parsed is None

    # Tool call in markdown block
    llm_output = '''To calculate this, I will use the calculator:
```json
{
  "tool": "calculator",
  "arguments": {
    "expression": "42 * 10"
  }
}
```
'''
    parsed_tool = ResponseParser.parse_tool_call(llm_output)
    assert parsed_tool is not None
    assert parsed_tool["tool"] == "calculator"
    assert parsed_tool["arguments"]["expression"] == "42 * 10"

    # Cleaning tool syntax
    cleaned = ResponseParser.clean_tool_syntax(llm_output)
    assert "To calculate this" in cleaned
    assert "```json" not in cleaned


def test_memory_systems():
    async def _test():
        # Short term memory
        stm = ShortTermMemory(max_messages=5)
        conv = await ConversationRepository.create("STM Test")
        await MessageRepository.add(conv.id, "user", "What is my name?")
        await MessageRepository.add(conv.id, "assistant", "You haven't told me yet.")
        context = await stm.get_context(conv.id)
        assert len(context) == 2
        assert context[0]["role"] == "user"
        assert context[1]["role"] == "assistant"

        # Long term memory extraction
        eval_result = LongTermMemory.evaluate_for_memory("Remember that I like black coffee")
        assert eval_result is not None
        content, category, importance = eval_result
        assert "black coffee" in content.lower()
        assert category == "preference"

    asyncio.run(_test())


def test_voice_service():
    from backend.voice.voice_service import voice_service

    # Text cleaning for natural speech
    raw = "Here is the code:\n```python\nprint('hello')\n```\nAnd **important** `stuff`!"
    cleaned = voice_service.clean_text_for_speech(raw)
    assert "print('hello')" not in cleaned
    assert "**" not in cleaned
    assert "important" in cleaned

    # Voice listing
    voices = voice_service.get_voices()
    assert len(voices) >= 4
    assert any(v["key"] == "aria" for v in voices)
    assert any(v["key"] == "sonia" for v in voices)

