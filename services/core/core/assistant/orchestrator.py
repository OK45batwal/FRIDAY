from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from services.core.core.ai.manager import ai_manager
from services.core.core.conversation.manager import conversation_manager
from services.core.core.agent.tools import agent_tools
from services.core.core.assistant.rules import core_rules, UserIntent

class AssistantOrchestrator:
    """
    FRIDAY AI Assistant Orchestrator.
    Implements the 6-stage request processing pipeline:
    1. Input Validation & Sanitization
    2. Intent Classification & Safety Boundary Check
    3. Tool Execution & RAG Context Retrieval
    4. Context Window & Sliding Memory Management
    5. AI Generation (Cloud Frontier or Local SLM)
    6. Output Verification & Response Packaging
    """

    async def process_request(
        self,
        db: AsyncSession,
        conversation_id: str,
        message: str,
        input_type: str = "text",
        agent_mode: Optional[str] = "general"
    ) -> Dict[str, Any]:
        # 1. Validate & Sanitize Input (Rule 3)
        is_valid, clean_message, error = core_rules.validate_and_sanitize_input(message)
        if not is_valid:
            return {
                "conversation_id": conversation_id,
                "message_id": "error",
                "response": error or "Invalid message format.",
                "created_at": None,
                "executed_tool": None
            }

        # 2. Save user message to database
        await conversation_manager.add_message(
            db=db,
            conversation_id=conversation_id,
            role="user",
            content=clean_message,
            input_type=input_type,
            metadata={"agent_mode": agent_mode}
        )

        # 3. Intent Detection & Safety Boundary Check (Rules 2, 8, 9, 10)
        intent = core_rules.classify_intent(clean_message)
        safety_warning = core_rules.check_safety_boundary(intent, clean_message)
        if safety_warning:
            assistant_msg = await conversation_manager.add_message(
                db=db,
                conversation_id=conversation_id,
                role="assistant",
                content=safety_warning,
                input_type="text",
                metadata={"safety_guardrail": True}
            )
            return {
                "conversation_id": conversation_id,
                "message_id": assistant_msg.id,
                "response": safety_warning,
                "created_at": assistant_msg.created_at.isoformat() if assistant_msg.created_at else None,
                "executed_tool": None
            }

        # 4. Native OS Automation Tool Execution
        executed_tool = None
        msg_lower = clean_message.lower().strip()
        if "open spotify" in msg_lower or "launch spotify" in msg_lower:
            tool_res = agent_tools.launch_desktop_app("Spotify")
            executed_tool = {"tool": "launch_app", "target": "Spotify", "result": tool_res}
        elif "open vscode" in msg_lower or "open code" in msg_lower:
            tool_res = agent_tools.launch_desktop_app("Visual Studio Code")
            executed_tool = {"tool": "launch_app", "target": "VS Code", "result": tool_res}
        elif "open terminal" in msg_lower:
            tool_res = agent_tools.launch_desktop_app("Terminal")
            executed_tool = {"tool": "launch_app", "target": "Terminal", "result": tool_res}

        # 5. Retrieve & Manage Context Window (Rules 4 & 11)
        raw_history = await conversation_manager.get_recent_history(db, conversation_id, limit=12)
        managed_history = core_rules.manage_context_window(raw_history, max_turns=8)

        # 6. Build Concise System Instruction (Rule 6)
        system_instruction = core_rules.build_system_instruction(agent_mode)

        # 7. Generate AI Response via AI Manager
        ai_response = await ai_manager.generate(
            prompt=clean_message,
            system_prompt=system_instruction,
            history=managed_history
        )

        # 8. Save assistant response to database
        assistant_msg = await conversation_manager.add_message(
            db=db,
            conversation_id=conversation_id,
            role="assistant",
            content=ai_response,
            input_type="text",
            metadata={"executed_tool": executed_tool, "intent": intent.value} if executed_tool else {"intent": intent.value}
        )

        return {
            "conversation_id": conversation_id,
            "message_id": assistant_msg.id,
            "response": ai_response,
            "created_at": assistant_msg.created_at.isoformat() if assistant_msg.created_at else None,
            "executed_tool": executed_tool
        }

orchestrator = AssistantOrchestrator()
