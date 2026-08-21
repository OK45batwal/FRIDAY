import asyncio
import httpx
from services.core.db.database import init_db, AsyncSessionLocal
from services.core.core.conversation.manager import conversation_manager
from services.core.core.assistant.orchestrator import orchestrator

async def test_backend():
    print("1. Initializing DB...")
    await init_db()

    async with AsyncSessionLocal() as db:
        print("2. Testing Conversation Creation...")
        conv = await conversation_manager.create_conversation(db, title="Test Session")
        print("Created conversation:", conv.id, conv.title)

        print("3. Testing Orchestrator Processing...")
        res = await orchestrator.process_request(
            db=db,
            conversation_id=conv.id,
            message="Hello Friday, help me plan my project.",
            input_type="text"
        )
        print("Assistant Response:", res["response"])

        print("4. Testing Follow-up Context...")
        res2 = await orchestrator.process_request(
            db=db,
            conversation_id=conv.id,
            message="Now explain the first step.",
            input_type="voice"
        )
        print("Follow-up Response:", res2["response"])

        history = await conversation_manager.get_recent_history(db, conv.id)
        print(f"Total stored messages in SQLite: {len(history)}")
        assert len(history) == 4

    print("ALL CORE BACKEND TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(test_backend())
