import datetime
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from services.core.core.ai.manager import ai_manager
from services.core.core.conversation.manager import conversation_manager

SYSTEM_PROMPT = """You are FRIDAY (Female Replacement Intelligent Digital Assistant Assistant), an advanced, highly capable, futuristic AI Operating Assistant built for Omkar.
You are concise, professional, direct, witty, and precise.
You maintain clear context across multi-turn conversations."""

class AssistantOrchestrator:
    """
    Central brain of FRIDAY v0.1. Orchestrates context, AI calls, and conversation persistence.
    """
    async def process_request(
        self,
        db: AsyncSession,
        conversation_id: str,
        message: str,
        input_type: str = "text"
    ) -> Dict[str, Any]:
        # 1. Save user message to database
        user_msg = await conversation_manager.add_message(
            db=db,
            conversation_id=conversation_id,
            role="user",
            content=message,
            input_type=input_type
        )
        actual_conv_id = user_msg.conversation_id

        # 2. Load recent conversation context
        history = await conversation_manager.get_recent_history(db, actual_conv_id, limit=8)

        # 3. Call AI Manager
        ai_response_text = await ai_manager.generate(
            prompt=message,
            system_prompt=SYSTEM_PROMPT,
            history=history
        )

        # 4. Save AI response to database
        assistant_msg = await conversation_manager.add_message(
            db=db,
            conversation_id=actual_conv_id,
            role="assistant",
            content=ai_response_text,
            input_type="text"
        )

        return {
            "conversation_id": actual_conv_id,
            "message_id": assistant_msg.id,
            "response": ai_response_text,
            "created_at": assistant_msg.created_at.isoformat() if assistant_msg.created_at else datetime.datetime.utcnow().isoformat()
        }

orchestrator = AssistantOrchestrator()
