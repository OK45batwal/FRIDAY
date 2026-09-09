"""Robust Response Parser for Tool Calls and Content."""

import re
import json
from typing import Optional, Dict, Any


class ResponseParser:
    @staticmethod
    def parse_tool_call(text: str) -> Optional[Dict[str, Any]]:
        """Extract structured tool calls from model output.

        Matches:
        - ```tool { ... } ```
        - ```json { ... } ```
        - Raw JSON with "type": "tool_call" or "tool": "name"
        """
        # 1. Match code blocks
        tool_block_match = re.search(r"```(?:tool|json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if tool_block_match:
            try:
                data = json.loads(tool_block_match.group(1))
                if "tool" in data:
                    args = data.get("arguments", data.get("args", {}))
                    return {"tool": data["tool"], "arguments": args}
            except json.JSONDecodeError:
                pass

        # 2. Match raw JSON substring
        raw_json_match = re.search(r'\{\s*"(?:type"\s*:\s*"tool_call",\s*)?"tool"\s*:\s*"[^"]+"\s*(?:,\s*"(?:arguments|args)"\s*:\s*\{.*?\})?\s*\}', text, re.DOTALL)
        if raw_json_match:
            try:
                data = json.loads(raw_json_match.group(0))
                if "tool" in data:
                    args = data.get("arguments", data.get("args", {}))
                    return {"tool": data["tool"], "arguments": args}
            except json.JSONDecodeError:
                pass

        return None

    @staticmethod
    def clean_tool_syntax(text: str) -> str:
        """Strip raw tool invocation markup from final user-facing text."""
        cleaned = re.sub(r"```(?:tool|json)?\s*\{.*?\btool\b.*?\}\s*```", "", text, flags=re.DOTALL)
        return cleaned.strip()
