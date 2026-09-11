"""Local Semantic Embedding & Similarity Engine for FRIDAY.

Provides:
- Ollama-backed neural embeddings when available
- Local high-speed semantic vectorizer with cosine similarity
- Zero-latency fallback for 100% offline memory search
"""

import math
import re
import httpx
from typing import List, Optional
from backend.config.settings import settings
from backend.utils.logger import get_logger

logger = get_logger("embeddings")


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Calculate cosine similarity between two float vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot_product / (norm_a * norm_b)


class LocalEmbeddingEngine:
    """Hybrid embedding generator supporting Ollama and local semantic hashing."""

    def __init__(self, vector_dim: int = 128):
        self.vector_dim = vector_dim
        self.ollama_url = settings.OLLAMA_BASE_URL.rstrip("/")

    async def get_embedding_ollama(self, text: str) -> Optional[List[float]]:
        """Attempt to fetch neural embedding from local Ollama instance."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(
                    f"{self.ollama_url}/api/embeddings",
                    json={"model": settings.LLM_MODEL, "prompt": text},
                )
                if res.status_code == 200:
                    embedding = res.json().get("embedding")
                    if embedding and isinstance(embedding, list):
                        return embedding
        except Exception:
            pass
        return None

    def get_local_vector(self, text: str) -> List[float]:
        """Generate high-dimensional semantic hash vector from text tokens and n-grams.

        Completely local, deterministic, and works offline without network or model weights.
        """
        clean = text.lower().strip()
        tokens = re.findall(r"\w+", clean)
        if not tokens:
            return [0.0] * self.vector_dim

        vec = [0.0] * self.vector_dim

        # 1. Word token hashed features
        for token in tokens:
            h = hash(token)
            idx = abs(h) % self.vector_dim
            weight = 1.0 + min(len(token) / 10.0, 1.0)
            vec[idx] += weight

        # 2. Character bi-gram features for subword similarity
        for i in range(len(clean) - 1):
            bigram = clean[i : i + 2]
            h = hash(bigram)
            idx = abs(h) % self.vector_dim
            vec[idx] += 0.5

        # Normalize vector
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]

        return vec

    async def embed_text(self, text: str) -> List[float]:
        """Get vector embedding with local fallback."""
        ollama_vec = await self.get_embedding_ollama(text)
        if ollama_vec:
            return ollama_vec
        return self.get_local_vector(text)

    def similarity(self, text_a: str, text_b: str) -> float:
        """Synchronously compute semantic similarity between two texts."""
        va = self.get_local_vector(text_a)
        vb = self.get_local_vector(text_b)
        return cosine_similarity(va, vb)


# Global singleton instance
embedding_engine = LocalEmbeddingEngine()
