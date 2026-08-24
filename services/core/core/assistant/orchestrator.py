import asyncio
import logging
import re
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from services.core.core.ai.manager import ai_manager
from services.core.core.conversation.manager import conversation_manager
from services.core.core.agent.tools import agent_tools
from services.core.core.memory.rag_memory import rag_memory
from services.core.core.assistant.rules import core_rules, UserIntent

logger = logging.getLogger(__name__)


class AssistantOrchestrator:
    """
    FRIDAY AI Assistant Orchestrator.
    Implements the 6-stage deep reasoning request pipeline:
    1. Input Validation & Sanitization
    2. Intent Classification & Safety Boundary Check
    3. Tool Execution (Web, OS, Files, Reminders)
    4. Multi-Turn Pronoun & Entity Disambiguation (Pillar 1)
    5. Deep 4-Stage Cognitive Reasoning Blueprint (Pillar 2)
    6. Response Storage & Output Packaging
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

        # 2. Resolve the conversation ONCE, up front.
        # Clients legitimately send a sentinel id such as "default" on a fresh
        # session. Resolving per-add_message call meant the user turn and the
        # assistant turn each created their own conversation, so history was
        # always empty and the id returned to the client did not exist.
        conv = await conversation_manager.resolve_or_create(db, conversation_id, seed_title=clean_message)
        conversation_id = conv.id

        # 3. Save user message to database
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
        app_request = None
        if "open spotify" in msg_lower or "launch spotify" in msg_lower:
            app_request = ("Spotify", "Launching **Spotify** on your Mac.")
        elif "open vscode" in msg_lower or "open code" in msg_lower:
            app_request = ("Visual Studio Code", "Opening **Visual Studio Code** in your workspace.")
        elif "open terminal" in msg_lower:
            app_request = ("Terminal", "Opening a new **Terminal** session.")

        if app_request:
            app_name, success_text = app_request
            tool_res = agent_tools.launch_desktop_app(app_name)
            executed_tool = {"tool": "launch_app", "target": app_name, "result": tool_res}
            # Report what actually happened. Previously success was announced
            # unconditionally, so a missing app or a denied permission still
            # rendered as "Launching ...".
            direct_tool_response = (
                success_text
                if tool_res.get("status") == "success"
                else f"\u26a0\ufe0f I could not launch **{app_name}**: {tool_res.get('error') or tool_res.get('status')}"
            )

        # B. Web Search & Browser Navigation
        elif intent == UserIntent.WEB_SEARCH:
            # Strip the command prefix from the ORIGINAL message, not the
            # lowercased copy, so search terms keep their capitalisation.
            query = re.sub(r'^(search web for|search web|search google for|google for|search for|look up)\s*', '', clean_message, flags=re.I).strip()
            tool_res = agent_tools.search_web(query or clean_message)
            executed_tool = {"tool": "web_search", "query": query, "result": tool_res}
            direct_tool_response = (
                f"I have initiated a web search for **\"{query}\"** in your browser."
                if tool_res.get("status") == "success"
                else f"\u26a0\ufe0f I could not open the browser: {tool_res.get('error') or tool_res.get('status')}"
            )

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
                # Only claim success when the tool actually succeeded. This
                # previously showed the checkmark even when AppleScript raised,
                # which also made an injection attempt look like it worked.
                if tool_res.get("status") == "success":
                    direct_tool_response = f"✅ Created macOS reminder: **\"{reminder_text}\"** in your Reminders app."
                else:
                    reason = tool_res.get("error") or tool_res.get("status")
                    direct_tool_response = f"⚠️ I could not create that reminder: {reason}"

        # D. File System Management
        elif intent == UserIntent.FILE_SYSTEM:
            if "list files" in msg_lower or "list directory" in msg_lower:
                res = agent_tools.list_directory_contents(".")
                executed_tool = {"tool": "list_files", "result": res}
                entries = res.get("entries", [])
                if res.get("status") != "success":
                    direct_tool_response = f"⚠️ Could not list the workspace: {res.get('message', 'unknown error')}"
                elif not entries:
                    direct_tool_response = "The workspace directory is empty."
                else:
                    lines = [f"- `{'📁' if e['type'] == 'directory' else '📄'}` **{e['name']}**" for e in entries[:25]]
                    direct_tool_response = "### 📂 Project Workspace Files\n" + "\n".join(lines)
            elif "read" in msg_lower:
                # Match the ORIGINAL message so case survives (README.md), and
                # skip the optional literal word "file". classify_intent requires
                # the phrase "read file" to reach this branch, so the old pattern
                # captured "file" as the filename on every single request.
                match = re.search(r'read\s+(?:the\s+)?(?:file\s+)?([A-Za-z0-9_\-./]+)', clean_message, flags=re.I)
                target_file = match.group(1) if match else None
                if not target_file:
                    direct_tool_response = "Which file should I read? Give me a path inside the workspace."
                else:
                    res = agent_tools.read_file_snippet(target_file, max_lines=40)
                    executed_tool = {"tool": "read_file", "file": target_file, "result": res}
                    if res.get("status") == "success":
                        # Pick a fence longer than any backtick run in the content
                        # so a file containing ``` cannot break out of the block.
                        runs = [len(r) for r in re.findall(r"`+", res["content"])]
                        fence = "`" * max(3, (max(runs) + 1) if runs else 3)
                        direct_tool_response = (
                            f"### 📄 File: `{target_file}`\n{fence}\n{res['content']}\n{fence}"
                        )
                    else:
                        direct_tool_response = f"⚠️ Could not read file `{target_file}`: {res.get('message', 'File error')}"

        if direct_tool_response:
            ai_response = direct_tool_response
        else:
            # 5. Retrieve Recent History & Apply Multi-Turn Context Disambiguation (Pillar 1)
            raw_history = await conversation_manager.get_recent_history(db, conversation_id, limit=12)
            managed_history = core_rules.manage_context_window(raw_history, max_turns=8)
            user_context = rag_memory.get_user_context()

            enriched_prompt, context_summary = core_rules.enrich_context_with_intent(
                current_message=clean_message,
                history=managed_history,
                user_facts=user_context
            )

            # 6. Build Deep Cognitive System Blueprint (Pillar 2)
            system_instruction = core_rules.build_system_instruction(
                agent_mode=agent_mode,
                user_context=user_context
            )
            if context_summary:
                system_instruction += f"\n\n{context_summary}"

            # 7. Generate Deep AI Response (Hybrid Cloud 70B or Local Neural Model)
            ai_response = await ai_manager.generate(
                prompt=enriched_prompt,
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

        # 9. Auto-Index Episodic Vector Memory (Pillar 4)
        try:
            await asyncio.to_thread(rag_memory.add_episodic_memory, clean_message, ai_response)
        except Exception:
            logger.warning("Failed to index episodic memory", exc_info=True)

        return {
            "conversation_id": conversation_id,
            "message_id": assistant_msg.id,
            "response": ai_response,
            "created_at": assistant_msg.created_at.isoformat() if assistant_msg.created_at else None,
            "executed_tool": executed_tool
        }

orchestrator = AssistantOrchestrator()
