import os
import json
import math
import time
import glob
from pathlib import Path
from typing import List, Dict, Any, Optional

MEMORY_DIR = Path(__file__).resolve().parent.parent.parent / "memory_data"
MEMORY_DIR.mkdir(parents=True, exist_ok=True)
DOCS_STORE = MEMORY_DIR / "documents.json"
USER_FACTS_STORE = MEMORY_DIR / "user_memory.json"
WORKSPACE_DIR = Path("/Users/omkar/FRIDAY").resolve()

class SimpleVectorMemory:
    """
    Lightweight, on-device Vector Memory & RAG Engine for FRIDAY 1.0.
    Stores and semantically retrieves user context, facts, and documents without external cloud dependencies.
    """

    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.user_facts: Dict[str, Any] = {}
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
                    "persona": "Lead Developer & System Architect",
                    "preferred_voice": "Tara (Indian English)",
                    "active_model": "FRIDAY 1.0 (Qwen 2.5 + LoRA Neural Engine)",
                    "hardware": "Apple Silicon Mac (Metal GPU) & Android Phone"
                }
                self._save_user_facts()

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
        # Normalize
        norm = math.sqrt(sum(v**2 for v in counts.values()))
        return {k: v / norm for k, v in counts.items()} if norm > 0 else {}

    def add_document(self, title: str, content: str, category: str = "general") -> Dict[str, Any]:
        """Indexes a document or code snippet into the vector store."""
        # Avoid duplicate documents
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
        """Pillar 4: Automatically indexes key project documentation and specs for RAG grounding."""
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
                        text = f.read(3000)  # Index first 3000 chars per doc
                    self.add_document(title=p.name, content=text, category="project_docs")
        except Exception as e:
            print("Auto-indexing workspace docs error:", e)

    def search_relevant_context(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Finds top-k most semantically relevant documents using cosine similarity."""
        query_vec = self._compute_simple_embedding(query)
        if not query_vec or not self.documents:
            return []

        scored_docs = []
        for doc in self.documents:
            doc_vec = doc.get("vector", {})
            score = sum(query_vec.get(w, 0.0) * doc_vec.get(w, 0.0) for w in query_vec)
            if score > 0.12:
                scored_docs.append((score, doc))

        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [
            {
                "id": d["id"],
                "title": d["title"],
                "content": d["content"],
                "similarity_score": round(score, 3)
            }
            for score, d in scored_docs[:top_k]
        ]

    def get_user_context(self) -> Dict[str, Any]:
        return self.user_facts

    def update_user_fact(self, key: str, value: Any):
        self.user_facts[key] = value
        self._save_user_facts()

def re_tokenize(text: str) -> List[str]:
    import re
    return re.findall(r'\b[a-zA-Z0-9_-]{2,}\b', text)

rag_memory = SimpleVectorMemory()
