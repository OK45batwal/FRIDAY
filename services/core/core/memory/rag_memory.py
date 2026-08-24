import os
import json
import math
import time
import glob
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

from services.core.app.config import settings

MEMORY_DIR = Path(__file__).resolve().parent.parent.parent / "memory_data"
MEMORY_DIR.mkdir(parents=True, exist_ok=True)
DOCS_STORE = MEMORY_DIR / "documents.json"
USER_FACTS_STORE = MEMORY_DIR / "user_memory.json"
EPISODIC_STORE = MEMORY_DIR / "episodic_memory.jsonl"
WORKSPACE_DIR = settings.PROJECT_ROOT.resolve()


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
        self.episodic_memories: List[Dict[str, Any]] = []
        self._load_memory()
        self.auto_index_workspace_docs()

    def _load_memory(self):
        if DOCS_STORE.exists():
            try:
                with open(DOCS_STORE, "r", encoding="utf-8") as f:
                    self.documents = json.load(f)
            except Exception:
                self.documents = []

        if USER_FACTS_STORE.exists():
            try:
                with open(USER_FACTS_STORE, "r", encoding="utf-8") as f:
                    self.user_facts = json.load(f)
            except Exception:
                self.user_facts = {
                    "user_name": "Omkar",
                    "persona": "Lead Architect & AI Engineer",
                    "preferred_voice": "Tara (Indian English)",
                    "active_model": "FRIDAY 1.0 (Fine-Tuned Neural Engine)",
                    "hardware": "Apple Silicon Mac (Metal GPU) & Android Device"
                }
                self._save_user_facts()

        if EPISODIC_STORE.exists():
            try:
                self.episodic_memories = []
                with open(EPISODIC_STORE, "r", encoding="utf-8") as f:
                    for line in f:
                        if line.strip():
                            self.episodic_memories.append(json.loads(line))
            except Exception:
                self.episodic_memories = []

    def _save_documents(self):
        try:
            with open(DOCS_STORE, "w", encoding="utf-8") as f:
                json.dump(self.documents, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print("Error saving documents:", e)

    def _save_user_facts(self):
        try:
            with open(USER_FACTS_STORE, "w", encoding="utf-8") as f:
                json.dump(self.user_facts, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print("Error saving user facts:", e)

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
            "id": f"epi_{int(time.time()*1000)}",
            "prompt": prompt,
            "response": response[:400],
            "category": category,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "vector": self._compute_simple_embedding(f"{prompt} {response[:200]}")
        }
        self.episodic_memories.append(entry)
        try:
            with open(EPISODIC_STORE, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception as e:
            print("Error appending episodic memory:", e)

    def add_document(self, title: str, content: str, category: str = "general") -> Dict[str, Any]:
        """Indexes a document or code snippet into the vector store."""
        for doc in self.documents:
            if doc.get("title") == title:
                doc["content"] = content
                doc["vector"] = self._compute_simple_embedding(f"{title} {content}")
                self._save_documents()
                return {"status": "updated", "id": doc["id"], "title": title}

        doc_id = f"doc_{int(time.time()*1000)}"
        doc_entry = {
            "id": doc_id,
            "title": title,
            "content": content,
            "category": category,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "vector": self._compute_simple_embedding(f"{title} {content}")
        }
        self.documents.append(doc_entry)
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

            for fpath in doc_files:
                p = Path(fpath)
                if p.exists() and p.is_file():
                    with open(p, "r", encoding="utf-8", errors="ignore") as f:
                        text = f.read(3000)
                    self.add_document(title=p.name, content=text, category="project_docs")
        except Exception as e:
            print("Auto-indexing workspace docs error:", e)

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

        # 2. Search past episodic turns
        for epi in self.episodic_memories[-50:]:  # Most recent 50 turns
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
