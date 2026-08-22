from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from services.core.core.ai.manager import ai_manager
from services.core.core.conversation.manager import conversation_manager
from services.core.core.assistant.tools import system_tools

SYSTEM_PROMPT = """You are FRIDAY — an elite AI Operating Assistant and Computer Control Companion created for Omkar.
You are articulate, proactive, intelligent, and highly capable across:
1. Programming, Code Architecture, and Debugging
2. Research, Analysis, and Education
3. Writing, Strategy, and Creative Drafting
4. System Telemetry, Computer Control, and App Automation

Be concise, precise, confident, and direct in your answers. When assisting with tasks, provide clean code blocks, actionable insights, and structured formatting."""

class AssistantOrchestrator:
    async def process_request(
        self,
        db: AsyncSession,
        conversation_id: str,
        message: str,
        input_type: str = "text",
        agent_mode: Optional[str] = "general"
    ) -> Dict[str, Any]:
        # 1. Save user message to database
        user_msg = await conversation_manager.add_message(
            db=db,
            conversation_id=conversation_id,
            role="user",
            content=message,
            input_type=input_type,
            metadata={"agent_mode": agent_mode}
        )

        # 2. Check for native OS automation commands
        msg_lower = message.lower().strip()
        executed_tool = None

        if "open spotify" in msg_lower or "launch spotify" in msg_lower:
            tool_res = system_tools.launch_app("Spotify")
            executed_tool = {"tool": "launch_app", "target": "Spotify", "result": tool_res}
        elif "open vscode" in msg_lower or "open code" in msg_lower:
            tool_res = system_tools.launch_app("Visual Studio Code")
            executed_tool = {"tool": "launch_app", "target": "VS Code", "result": tool_res}
        elif "open terminal" in msg_lower:
            tool_res = system_tools.launch_app("Terminal")
            executed_tool = {"tool": "launch_app", "target": "Terminal", "result": tool_res}

        # 3. Retrieve recent history for context
        history = await conversation_manager.get_recent_history(db, conversation_id, limit=8)

        # 4. Tailor system prompt with Agent Mode
        effective_system_prompt = SYSTEM_PROMPT
        if agent_mode == "programming":
            effective_system_prompt += "\n[MODE: SENIOR SOFTWARE ARCHITECT & CODER] Focus on robust algorithms, best practices, full code solutions, and clean architecture."
        elif agent_mode == "writing":
            effective_system_prompt += "\n[MODE: CREATIVE & STRATEGIC WRITER] Focus on compelling copy, clear structure, executive tone, and refined prose."
        elif agent_mode == "research":
            effective_system_prompt += "\n[MODE: DEEP RESEARCH ANALYST] Focus on comprehensive analysis, citations, pros/cons, and technical depth."
        elif agent_mode == "system":
            effective_system_prompt += "\n[MODE: OS & COMPUTER CONTROLLER] Focus on system telemetry, shell commands, and hardware optimization."

        # 5. Generate AI response
        ai_response = await ai_manager.generate(
            prompt=message,
            system_prompt=effective_system_prompt,
            history=history
        )

        # 6. Save assistant message to database
        assistant_msg = await conversation_manager.add_message(
            db=db,
            conversation_id=conversation_id,
            role="assistant",
            content=ai_response,
            input_type="text",
            metadata={"executed_tool": executed_tool} if executed_tool else None
        )

        return {
            "conversation_id": conversation_id,
            "message_id": assistant_msg.id,
            "response": ai_response,
            "created_at": assistant_msg.created_at.isoformat() if assistant_msg.created_at else None,
            "executed_tool": executed_tool
        }

orchestrator = AssistantOrchestrator()
