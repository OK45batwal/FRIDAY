"""Real-time Web Search Tool using DuckDuckGo Lite."""

import re
import html
from typing import Dict, Any
import httpx
from backend.tools.base import BaseTool


class SearchTool(BaseTool):
    name = "web_search"
    description = "Search the web for live facts, current news, documentation, and external information."
    parameters = {
        "query": {
            "type": "string",
            "description": "The search query string",
            "required": True,
        }
    }
    requires_confirmation = False

    async def execute(self, arguments: Dict[str, Any]) -> str:
        query = arguments.get("query", "").strip()
        if not query:
            return "Error: Search query cannot be empty."

        url = "https://lite.duckduckgo.com/lite/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)"
        }

        try:
            async with httpx.AsyncClient(headers=headers, timeout=8.0, follow_redirects=True) as client:
                resp = await client.post(url, data={"q": query})
                page = resp.text

            links = re.findall(
                r"<a[^>]+href=[\x27\x22]([^\x27\x22]+)[\x27\x22][^>]*class=[\x27\x22]result-link[\x27\x22][^>]*>(.*?)</a>",
                page,
                re.DOTALL,
            )
            snippets = re.findall(
                r"<td class=[\x27\x22]result-snippet[\x27\x22]>(.*?)</td>",
                page,
                re.DOTALL,
            )

            if not links and not snippets:
                return f"No web search results found for '{query}'."

            results = []
            limit = min(len(links), len(snippets), 4)
            for i in range(limit):
                href, raw_title = links[i]
                title = html.unescape(re.sub(r"<[^<]+?>", "", raw_title).strip())
                snippet = html.unescape(re.sub(r"<[^<]+?>", "", snippets[i]).strip())
                results.append(f"[{i + 1}] {title}\nURL: {href}\nSnippet: {snippet}")

            return "\n\n".join(results)
        except Exception as e:
            return f"Web search failed: {str(e)}"

