"""Open Website Tool for opening URLs in the default browser."""

import re
import webbrowser
import asyncio
from typing import Dict, Any
from urllib.parse import urlparse
from backend.tools.base import BaseTool


class OpenWebsiteTool(BaseTool):
    name = "open_website"
    description = "Open a valid website URL in the default web browser."
    parameters = {
        "url": {
            "type": "string",
            "description": "The full HTTP or HTTPS website URL to open (e.g. https://www.google.com)",
            "required": True,
        }
    }
    requires_confirmation = False

    async def execute(self, arguments: Any) -> str:
        if isinstance(arguments, str):
            raw_url = arguments.strip()
        elif isinstance(arguments, dict):
            raw_url = str(
                arguments.get("url")
                or arguments.get("link")
                or arguments.get("website")
                or arguments.get("input")
                or ""
            ).strip()
        else:
            raw_url = str(arguments).strip()

        if not raw_url:
            return "Error: Website URL cannot be empty."

        # If user gave domain without scheme, prepend https://
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", raw_url):
            raw_url = f"https://{raw_url}"

        parsed = urlparse(raw_url)
        if parsed.scheme.lower() not in ("http", "https"):
            return f"Error: Only HTTP and HTTPS URLs are permitted. Disallowed scheme: '{parsed.scheme}'."

        if not parsed.netloc:
            return f"Error: Invalid website URL '{raw_url}'."

        try:
            # Run in thread pool so it does not block the async event loop
            loop = asyncio.get_event_loop()
            opened = await loop.run_in_executor(None, webbrowser.open, raw_url)
            if opened:
                return f"Website opened successfully: {raw_url}"
            return f"Dispatched request to open website: {raw_url}"
        except Exception as e:
            return f"Error opening website '{raw_url}': {str(e)}"
