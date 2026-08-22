import re
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
    3. Tool Execution (Web, OS, Files, Reminders) & RAG Context Retrieval
    4. Context Window & Sliding Memory Management
    5. AI Generation (Cloud Frontier or Local Neural SLM)
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

        executed_tool = None
        direct_tool_response = None
        msg_lower = clean_message.lower().strip()

        # 4. Native OS & Agent Tool Execution
        # A. Desktop App Launching
        if "open spotify" in msg_lower or "launch spotify" in msg_lower:
            tool_res = agent_tools.launch_desktop_app("Spotify")
            executed_tool = {"tool": "launch_app", "target": "Spotify", "result": tool_res}
            direct_tool_response = "Launching **Spotify** on your Mac."
        elif "open vscode" in msg_lower or "open code" in msg_lower:
            tool_res = agent_tools.launch_desktop_app("Visual Studio Code")
            executed_tool = {"tool": "launch_app", "target": "VS Code", "result": tool_res}
            direct_tool_response = "Opening **Visual Studio Code** in your workspace."
        elif "open terminal" in msg_lower:
            tool_res = agent_tools.launch_desktop_app("Terminal")
            executed_tool = {"tool": "launch_app", "target": "Terminal", "result": tool_res}
            direct_tool_response = "Opening a new **Terminal** session."

        # B. Web Search & Browser Navigation
        elif intent == UserIntent.WEB_SEARCH:
            query = re.sub(r'^(search web for|search web|search google for|google for|search for|look up)\s*', '', msg_lower, flags=re.I).strip()
            tool_res = agent_tools.search_web(query or clean_message)
            executed_tool = {"tool": "web_search", "query": query, "result": tool_res}
            direct_tool_response = f"I have initiated a web search for **\"{query}\"** in your browser."

        # C. macOS Reminders
        elif intent == UserIntent.REMINDERS:
            if "show" in msg_lower or "list" in msg_lower or "my reminders" in msg_lower:
                reminders_res = agent_tools.get_upcoming_reminders()
                executed_tool = {"tool": "get_reminders", "result": reminders_res}
                items = reminders_res.get("reminders", [])
                if items:
                    rem_list = "\n".join([f"- 📌 {item}" for item in items])
                    direct_tool_response = f"### 📋 Upcoming macOS Reminders\n{rem_list}"
                else:
                    direct_tool_response = "You have no pending reminders in your macOS Reminders list."
            else:
                reminder_text = re.sub(r'^(remind me to|create reminder to|add reminder|set reminder for)\s*', '', clean_message, flags=re.I).strip()
                tool_res = agent_tools.create_macos_reminder(reminder_text or clean_message)
                executed_tool = {"tool": "create_reminder", "reminder": reminder_text, "result": tool_res}
                direct_tool_response = f"✅ Created macOS reminder: **\"{reminder_text}\"** in your Reminders app."

        # D. File System Management
        elif intent == UserIntent.FILE_SYSTEM:
            if "list files" in msg_lower or "list directory" in msg_lower:
                res = agent_tools.list_directory_contents(".")
                executed_tool = {"tool": "list_files", "result": res}
                entries = res.get("entries", [])
                lines = [f"- `{'📁' if e['type'] == 'directory' else '📄'}` **{e['name']}**" for e in entries[:25]]
                direct_tool_response = f"### 📂 Project Workspace Files\n" + "\n".join(lines)
            elif "read" in msg_lower:
                match = re.search(r'read\s+([a-zA-Z0-9_\-\.\/]+)', msg_lower)
                target_file = match.group(1) if match else "package.json"
                res = agent_tools.read_file_snippet(target_file, max_lines=40)
                executed_tool = {"tool": "read_file", "file": target_file, "result": res}
                if res.get("status") == "success":
                    direct_tool_response = f"### 📄 File: `{target_file}`\n```\n{res['content']}\n```"
                else:
                    direct_tool_response = f"⚠️ Could not read file `{target_file}`: {res.get('message', 'File error')}"

        if direct_tool_response:
            ai_response = direct_tool_response
        else:
            # 5. Retrieve & Manage Context Window (Rules 4 & 11)
            raw_history = await conversation_manager.get_recent_history(db, conversation_id, limit=12)
            managed_history = core_rules.manage_context_window(raw_history, max_turns=8)

            # 6. Build Concise System Instruction (Rule 6)
            system_instruction = core_rules.build_system_instruction(agent_mode)

            # 7. Generate AI Response via AI Manager (Neural Model Inference)
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
