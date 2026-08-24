import os
import json
import math
import time
import glob
import re
import logging
import threading
import uuid
from collections import deque
from pathlib import Path
from typing import List, Dict, Any, Optional

from services.core.app.config import settings
from services.core.core.storage import atomic_write_json, load_json

logger = logging.getLogger(__name__)

MEMORY_DIR = Path(__file__).resolve().parent.parent.parent / "memory_data"
MEMORY_DIR.mkdir(parents=True, exist_ok=True)
DOCS_STORE = MEMORY_DIR / "documents.json"
USER_FACTS_STORE = MEMORY_DIR / "user_memory.json"
EPISODIC_STORE = MEMORY_DIR / "episodic_memory.jsonl"
WORKSPACE_DIR = settings.PROJECT_ROOT.resolve()

# Episodic memory is append-only on disk and was loaded in full at startup, so
# both RAM and load time grew without limit for the lifetime of the install.
# Only the most recent turns are ever searched (see search_relevant_context), so
# keep a bounded window in memory and compact the file when it gets too long.
MAX_EPISODIC_IN_MEMORY = 500
MAX_EPISODIC_ON_DISK = 5_000
MAX_DOCUMENTS = 500

DEFAULT_USER_FACTS = {
    "user_name": "Omkar",
    "persona": "Lead Architect & AI Engineer",
    "preferred_voice": "Tara (Indian English)",
    "active_model": "FRIDAY 1.0 (Fine-Tuned Neural Engine)",
    "hardware": "Apple Silicon Mac (Metal GPU) & Android Device",
}


def re_tokenize(text: str) -> List[str]:
    return re.findall(r'\b[a-zA-Z0-9_-]{2,}\b', text)

class SimpleVectorMemory:
    """
    Episodic Vector Memory & Knowledge Graph Engine for FRIDAY 1.0 (Pillar 4).
    Stores and semantically retrieves:
    1. Static workspace documentation & project specs.
    2. User persona, preferences, and coding habits.
    3. Episodic turn-taking history with semantic cosine similarity search.
    """

    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.user_facts: Dict[str, Any] = {}
        # Bounded window: old turns fall off the left rather than accumulating.
        self.episodic_memories: deque = deque(maxlen=MAX_EPISODIC_IN_MEMORY)
        self._lock = threading.Lock()
        self._load_memory()
        self.auto_index_workspace_docs()

    def _load_memory(self):
        self.documents = load_json(DOCS_STORE, [], expect=list)

        self.user_facts = load_json(USER_FACTS_STORE, None, expect=dict)
        if self.user_facts is None:
            self.user_facts = dict(DEFAULT_USER_FACTS)
            self._save_user_facts()

        if EPISODIC_STORE.exists():
            # Read only the tail we intend to keep, not the whole history.
            try:
                with open(EPISODIC_STORE, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            self.episodic_memories.append(json.loads(line))
                        except json.JSONDecodeError:
                            # Skip a single torn line rather than dropping the store.
                            continue
            except Exception:
                logger.warning("Could not read episodic store", exc_info=True)

    def _save_documents(self):
        try:
            atomic_write_json(DOCS_STORE, self.documents)
        except Exception:
            logger.error("Error saving documents", exc_info=True)

    def _save_user_facts(self):
        try:
            atomic_write_json(USER_FACTS_STORE, self.user_facts)
        except Exception:
            logger.error("Error saving user facts", exc_info=True)

    def _compute_simple_embedding(self, text: str) -> Dict[str, float]:
        """Calculates TF-IDF style term vector representation for local semantic search."""
        words = re_tokenize(text.lower())
        if not words:
            return {}
        counts: Dict[str, float] = {}
        for w in words:
            counts[w] = counts.get(w, 0.0) + 1.0
        norm = math.sqrt(sum(v**2 for v in counts.values()))
        return {k: v / norm for k, v in counts.items()} if norm > 0 else {}

    def add_episodic_memory(self, prompt: str, response: str, category: str = "conversation"):
        """Indexes user interaction turn into episodic vector store."""
        entry = {
            # uuid suffix: two turns in the same millisecond previously shared an
            # id, and search results are keyed on it.
            "id": f"epi_{int(time.time()*1000)}_{uuid.uuid4().hex[:8]}",
            "prompt": prompt[:2000],
            "response": response[:400],
            "category": category,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "vector": self._compute_simple_embedding(f"{prompt} {response[:200]}")
        }
        with self._lock:
            self.episodic_memories.append(entry)
            try:
                with open(EPISODIC_STORE, "a", encoding="utf-8") as f:
                    f.write(json.dumps(entry) + "\n")
                self._maybe_compact_episodic()
            except Exception:
                logger.error("Error appending episodic memory", exc_info=True)

    def _maybe_compact_episodic(self):
        """
        Keep the append-only file from growing forever.

        Once it exceeds the cap, rewrite it atomically with just the in-memory
        window. ponytail: a cheap line count gates the rewrite, so compaction is
        occasional, not per-append.
        """
        try:
            if EPISODIC_STORE.stat().st_size < 4096:
                return
            with open(EPISODIC_STORE, "r", encoding="utf-8") as f:
                line_count = sum(1 for _ in f)
            if line_count <= MAX_EPISODIC_ON_DISK:
                return
            tmp = EPISODIC_STORE.with_suffix(".jsonl.tmp")
            with open(tmp, "w", encoding="utf-8") as f:
                for entry in self.episodic_memories:
                    f.write(json.dumps(entry) + "\n")
            os.replace(tmp, EPISODIC_STORE)
            logger.info("Compacted episodic store from %d to %d lines", line_count, len(self.episodic_memories))
        except Exception:
            logger.warning("Episodic compaction failed", exc_info=True)

    def add_document(self, title: str, content: str, category: str = "general", persist: bool = True) -> Dict[str, Any]:
        """Indexes a document or code snippet into the vector store."""
        for doc in self.documents:
            if doc.get("title") == title:
                doc["content"] = content
                doc["vector"] = self._compute_simple_embedding(f"{title} {content}")
                if persist:
                    self._save_documents()
                return {"status": "updated", "id": doc["id"], "title": title}

        if len(self.documents) >= MAX_DOCUMENTS:
            self.documents.pop(0)

        doc_id = f"doc_{int(time.time()*1000)}_{uuid.uuid4().hex[:8]}"
        doc_entry = {
            "id": doc_id,
            "title": title,
            "content": content,
            "category": category,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "vector": self._compute_simple_embedding(f"{title} {content}")
        }
        self.documents.append(doc_entry)
        if persist:
            self._save_documents()
        return {"status": "indexed", "id": doc_id, "title": title}

    def auto_index_workspace_docs(self):
        """Automatically indexes key project documentation and specs for RAG grounding."""
        try:
            docs_pattern = str(WORKSPACE_DIR / "docs" / "*.md")
            doc_files = glob.glob(docs_pattern)
            readme_file = WORKSPACE_DIR / "README.md"
            if readme_file.exists():
                doc_files.append(str(readme_file))

            changed = False
            for fpath in doc_files:
                p = Path(fpath)
                if p.exists() and p.is_file():
                    with open(p, "r", encoding="utf-8", errors="ignore") as f:
                        text = f.read(3000)
                    # persist=False: this used to rewrite the entire documents
                    # store once per file, so indexing N docs did N full-file
                    # writes. Write once at the end instead.
                    self.add_document(title=p.name, content=text, category="project_docs", persist=False)
                    changed = True
            if changed:
                self._save_documents()
        except Exception:
            logger.warning("Auto-indexing workspace docs failed", exc_info=True)

    def search_relevant_context(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Finds top-k most semantically relevant documents and past episodic turns."""
        query_vec = self._compute_simple_embedding(query)
        if not query_vec:
            return []

        results = []

        # 1. Search indexed documents
        for doc in self.documents:
            doc_vec = doc.get("vector", {})
            score = sum(query_vec.get(w, 0.0) * doc_vec.get(w, 0.0) for w in query_vec)
            if score > 0.12:
                results.append((score, {
                    "id": doc["id"],
                    "title": doc["title"],
                    "content": doc["content"],
                    "source": "document",
                    "similarity_score": round(score, 3)
                }))

        # 2. Search past episodic turns. episodic_memories is a bounded deque,
        # which does not support slicing, so materialise the recent window.
        for epi in list(self.episodic_memories)[-50:]:
            epi_vec = epi.get("vector", {})
            score = sum(query_vec.get(w, 0.0) * epi_vec.get(w, 0.0) for w in query_vec)
            if score > 0.18:
                results.append((score, {
                    "id": epi["id"],
                    "title": f"Past Interaction: {epi['prompt'][:30]}...",
                    "content": epi["response"],
                    "source": "episodic_memory",
                    "similarity_score": round(score, 3)
                }))

        results.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in results[:top_k]]

    def get_user_context(self) -> Dict[str, Any]:
        return self.user_facts

    def update_user_fact(self, key: str, value: Any):
        self.user_facts[key] = value
        self._save_user_facts()

rag_memory = SimpleVectorMemory()
