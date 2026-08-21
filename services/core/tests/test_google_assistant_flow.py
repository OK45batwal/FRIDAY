import asyncio
from services.core.db.database import init_db, AsyncSessionLocal
from services.core.core.conversation.manager import conversation_manager
from services.core.core.assistant.orchestrator import orchestrator

async def test_google_assistant_capabilities():
    print("=== STARTING GOOGLE ASSISTANT TEST SUITE ===")
    await init_db()

    async with AsyncSessionLocal() as db:
        conv = await conversation_manager.create_conversation(db, title="Google Assistant Test")
        print(f"1. Created test conversation: {conv.id}")

        # Test 1: Weather query
        print("\n--- Test 1: Weather Query ---")
        res_weather = await orchestrator.process_request(
            db=db,
            conversation_id=conv.id,
            message="What's the weather today?",
            input_type="voice"
        )
        print("Response:", res_weather["response"])
        assert "74°F" in res_weather["response"] or "sunny" in res_weather["response"].lower()
        print("✓ Weather query passed.")

        # Test 2: System performance query
        print("\n--- Test 2: System Performance Query ---")
        res_system = await orchestrator.process_request(
            db=db,
            conversation_id=conv.id,
            message="Show system diagnostic stats",
            input_type="text"
        )
        print("Response:", res_system["response"])
        assert "optimal operating thresholds" in res_system["response"].lower() or "telemetry" in res_system["response"].lower()
        print("✓ System performance query passed.")

        # Test 3: Tech joke query
        print("\n--- Test 3: Joke Query ---")
        res_joke = await orchestrator.process_request(
            db=db,
            conversation_id=conv.id,
            message="Tell me a joke",
            input_type="voice"
        )
        print("Response:", res_joke["response"])
        assert "dark mode" in res_joke["response"].lower() or "bugs" in res_joke["response"].lower()
        print("✓ Joke query passed.")

        # Test 4: App control (Spotify)
        print("\n--- Test 4: App Control Query ---")
        res_spotify = await orchestrator.process_request(
            db=db,
            conversation_id=conv.id,
            message="Open Spotify",
            input_type="text"
        )
        print("Response:", res_spotify["response"])
        assert "spotify" in res_spotify["response"].lower()
        print("✓ App control query passed.")

        # Test 5: Multi-turn project planning
        print("\n--- Test 5: Multi-turn Dialogue ---")
        res_plan = await orchestrator.process_request(
            db=db,
            conversation_id=conv.id,
            message="Help me plan my project",
            input_type="text"
        )
        print("Plan:", res_plan["response"])

        res_step1 = await orchestrator.process_request(
            db=db,
            conversation_id=conv.id,
            message="Explain the first step",
            input_type="voice"
        )
        print("Follow-up Step 1:", res_step1["response"])
        assert "monorepo" in res_step1["response"].lower() or "architecture" in res_step1["response"].lower()
        print("✓ Multi-turn context dialogue passed.")

        # Verify message count in SQLite
        history = await conversation_manager.get_recent_history(db, conv.id, limit=50)
        print(f"\nTotal conversation turns stored in SQLite: {len(history)}")
        assert len(history) == 12



    print("\n=== ALL GOOGLE ASSISTANT TESTS PASSED (100% SUCCESS) ===")

if __name__ == "__main__":
    asyncio.run(test_google_assistant_capabilities())
