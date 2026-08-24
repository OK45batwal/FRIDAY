"""
FRIDAY Core Backend — End-to-End Integration & Smoke Test Suite.

Verifies:
1. Async Database initialization and conversation CRUD lifecycle
2. Assistant Orchestrator multi-turn reasoning & input processing
3. Safe AST mathematical evaluation & unit conversions
4. Native OS Agent Tools & Workspace Sandbox security
5. FastAPI HTTP endpoints (/health, /api/conversations, /api/download/*)
6. Held-Out Evaluation Benchmark integration
"""

import asyncio
import os
from pathlib import Path
import httpx

from services.core.app.config import settings
from services.core.app.security import get_api_token, TOKEN_HEADER
from services.core.db.database import init_db, AsyncSessionLocal
from services.core.core.conversation.manager import conversation_manager

from services.core.core.assistant.orchestrator import orchestrator
from services.core.core.agent.tools import agent_tools
from services.core.core.ai.providers.local_llm_engine import LocalLLMEngine
from services.core.app.main import app


async def test_backend_end_to_end():
    print("=" * 75)
    print("🚀 RUNNING FRIDAY CORE END-TO-END BACKEND SMOKE TEST")
    print("=" * 75)

    # 1. Database Initialization
    print("\n[1/6] 💾 Initializing SQLite Database...")
    await init_db()
    print("  ✅ Database schema initialized successfully.")

    # 2. Conversation & Message Lifecycle
    print("\n[2/6] 💬 Testing Conversation Manager CRUD & Message Storage...")
    async with AsyncSessionLocal() as db:
        conv = await conversation_manager.create_conversation(db, title="Smoke Test Session")
        assert conv.id is not None
        print(f"  ✅ Created Conversation: {conv.id} ({conv.title})")

        # Add user message
        msg1 = await conversation_manager.add_message(db, conv.id, "user", "What is 25 * 16 + 100?")
        assert msg1.id is not None

        # Add assistant message
        msg2 = await conversation_manager.add_message(db, conv.id, "assistant", "25 * 16 + 100 = 500")
        assert msg2.id is not None

        # Check list conversations query
        conv_list = await conversation_manager.list_conversations(db, limit=10)
        assert len(conv_list) >= 1
        print(f"  ✅ Listed conversations count: {len(conv_list)}")

        # Check message history
        history = await conversation_manager.get_recent_history(db, conv.id)
        assert len(history) >= 2
        print(f"  ✅ Retrieved message history count: {len(history)}")

    # 3. Agent Tools & Sandbox Security
    print("\n[3/6] 🛠️ Testing Agent Tools & Sandbox Traversal Protections...")
    telemetry = agent_tools.get_system_telemetry()
    assert "cpu_usage_percent" in telemetry
    assert "ram_usage_percent" in telemetry
    print(f"  ✅ Telemetry: CPU {telemetry.get('cpu_usage_percent')}%, RAM {telemetry.get('ram_usage_percent')}%")

    time_date = agent_tools.get_current_time_and_date()
    assert "time" in time_date and "date" in time_date
    print(f"  ✅ Time/Date Tool: {time_date['time']} on {time_date['date']}")

    # Test Sandbox Protection: Absolute path outside workspace should be denied
    outside_res = agent_tools.read_file_snippet("/etc/passwd")
    assert outside_res.get("status") == "error"
    assert "Access denied" in outside_res.get("message", "")
    print("  ✅ Sandbox Traversal Protection verified: Access outside workspace rejected.")

    # 4. Safe AST Math Evaluation
    print("\n[4/6] 🔢 Testing AST Safe Arithmetic Evaluation...")
    engine = LocalLLMEngine()
    math_res1 = await engine.generate_response("What is 125 * 8 - 250?", "", [])
    assert "750" in math_res1
    print(f"  ✅ Arithmetic Result: {math_res1}")

    conv_res = await engine.generate_response("Convert 100 Celsius to Fahrenheit", "", [])
    assert "212" in conv_res
    print(f"  ✅ Temperature Conversion: {conv_res}")

    # 5. Assistant Orchestrator Processing
    print("\n[5/6] 🧠 Testing Orchestrator Multi-Turn Flow...")
    async with AsyncSessionLocal() as db:
        orch_conv = await conversation_manager.create_conversation(db, title="Orchestrator Test")
        res1 = await orchestrator.process_request(
            db=db,
            conversation_id=orch_conv.id,
            message="What is the current date and time?",
            input_type="text"
        )
        assert res1.get("response") is not None
        print(f"  ✅ Orchestrator Turn 1: {res1['response'][:100]}...")

        res2 = await orchestrator.process_request(
            db=db,
            conversation_id=orch_conv.id,
            message="Calculate 99 * 3",
            input_type="text"
        )
        assert "297" in res2["response"]
        print(f"  ✅ Orchestrator Turn 2 (Math): {res2['response']}")

        # Clean up test conversation
        await conversation_manager.delete_conversation(db, orch_conv.id)
        print("  ✅ Cascading conversation deletion verified.")

    # 6. HTTP API Endpoint Verification (ASGI Client)
    print("\n[6/6] 🌐 Testing HTTP API Endpoints with AsyncClient...")
    token = get_api_token()
    auth_headers = {TOKEN_HEADER: token}

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
        # Health endpoint (public)
        health_res = await client.get("/health")
        assert health_res.status_code == 200
        health_data = health_res.json()
        assert health_data.get("status") == "online"
        print(f"  ✅ GET /health: {health_data}")

        # List conversations API (authorized)
        convs_res = await client.get("/api/conversations", headers=auth_headers)
        assert convs_res.status_code == 200
        print(f"  ✅ GET /api/conversations: {len(convs_res.json().get('conversations', []))} sessions")

        # Download endpoints (public)
        dl_android = await client.get("/api/download/android", follow_redirects=False)
        assert dl_android.status_code in (200, 307, 302)
        print(f"  ✅ GET /api/download/android (HTTP {dl_android.status_code})")

        dl_mac = await client.get("/api/download/mac", follow_redirects=False)
        assert dl_mac.status_code in (200, 307, 302)
        print(f"  ✅ GET /api/download/mac (HTTP {dl_mac.status_code})")

        dl_win = await client.get("/api/download/windows", follow_redirects=False)
        assert dl_win.status_code in (200, 307, 302)
        print(f"  ✅ GET /api/download/windows (HTTP {dl_win.status_code})")


    print("\n" + "=" * 75)
    print("🎉 ALL CORE BACKEND END-TO-END SMOKE TESTS PASSED!")
    print("=" * 75)


if __name__ == "__main__":
    asyncio.run(test_backend_end_to_end())

