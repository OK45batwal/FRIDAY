"""Notes & Memory Tool for storing, reading, searching, and deleting persistent notes."""

from typing import Dict, Any
from backend.tools.base import BaseTool
from backend.database.repositories import MemoryRepository
from backend.utils.logger import get_logger

logger = get_logger("tool_notes")


class NotesTool(BaseTool):
    name = "notes"
    description = (
        "Create, read, search, list, or delete personal notes and memories. "
        "Actions: 'create' (or 'add'), 'list', 'search', 'delete'."
    )
    parameters = {
        "action": {
            "type": "string",
            "description": "Action to perform: 'create', 'list', 'search', 'delete'",
            "required": False,
        },
        "content": {
            "type": "string",
            "description": "Note content to save or keyword to search",
            "required": False,
        },
        "id": {
            "type": "string",
            "description": "Note ID (required for 'delete')",
            "required": False,
        },
    }
    requires_confirmation = False

    async def execute(self, arguments: Any) -> str:
        action = "create"
        content = ""
        note_id = ""

        if isinstance(arguments, str):
            text = arguments.strip()
            if text.lower().startswith("list"):
                action = "list"
            elif text.lower().startswith("search "):
                action = "search"
                content = text[7:].strip()
            elif text.lower().startswith("delete "):
                action = "delete"
                note_id = text[7:].strip()
            else:
                action = "create"
                content = text
        elif isinstance(arguments, dict):
            action = str(arguments.get("action") or "create").lower().strip()
            content = str(arguments.get("content") or arguments.get("text") or arguments.get("query") or arguments.get("input") or "").strip()
            note_id = str(arguments.get("id") or arguments.get("note_id") or "").strip()
            # If action not explicitly given but content provided
            if "action" not in arguments and not content and "list" in arguments:
                action = "list"
        else:
            content = str(arguments).strip()

        try:
            if action in ("create", "add", "save", "new"):
                if not content:
                    return "Error: Note content cannot be empty."
                mem = await MemoryRepository.add(content=content, category="note", importance=1.0)
                return f"Note created successfully [ID: {mem.id}]: \"{mem.content}\""

            elif action in ("list", "all", "read"):
                all_mems = await MemoryRepository.list_all()
                notes = [m for m in all_mems if m.category == "note"] or all_mems
                if not notes:
                    return "No notes found in memory."
                lines = [f"Found {len(notes)} note(s):"]
                for i, n in enumerate(notes[:15], 1):
                    lines.append(f"[{n.id}] {n.content}")
                return "\n".join(lines)

            elif action in ("search", "find"):
                if not content:
                    return "Error: Search query cannot be empty."
                found = await MemoryRepository.search(content)
                if not found:
                    return f"No notes found matching '{content}'."
                lines = [f"Found {len(found)} note(s) matching '{content}':"]
                for i, n in enumerate(found[:10], 1):
                    lines.append(f"[{n.id}] ({n.category}) {n.content}")
                return "\n".join(lines)

            elif action in ("delete", "remove"):
                target_id = note_id or content
                if not target_id:
                    return "Error: Note ID must be provided to delete."
                success = await MemoryRepository.delete(target_id)
                if success:
                    return f"Note '{target_id}' deleted successfully."
                return f"Error: Note with ID '{target_id}' not found."

            else:
                return f"Error: Unknown notes action '{action}'. Valid actions are 'create', 'list', 'search', 'delete'."
        except Exception as e:
            logger.error(f"Notes tool error: {e}", exc_info=True)
            return f"Error executing notes tool: {str(e)}"
