"""Model configuration dataclass for custom Decoder-Only Transformer."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ModelConfig:
    # Architectural parameters
    dim: int = 512
    n_layers: int = 8
    n_heads: int = 8
    n_kv_heads: Optional[int] = None  # Grouped-Query Attention (GQA). Defaults to n_heads if None.
    vocab_size: int = 50257           # Default matches tiktoken GPT-2 BPE tokenizer
    multiple_of: int = 256            # SwiGLU hidden layer dimension multiple
    ffn_dim_multiplier: Optional[float] = None
    norm_eps: float = 1e-5
    rope_theta: float = 10000.0
    max_seq_len: int = 1024
    dropout: float = 0.0
    tie_word_embeddings: bool = True  # Tie input embedding and output lm_head weights

    def __post_init__(self):
        if self.n_kv_heads is None:
            self.n_kv_heads = self.n_heads
        assert self.n_heads % self.n_kv_heads == 0, (
            f"n_heads ({self.n_heads}) must be divisible by n_kv_heads ({self.n_kv_heads})"
        )
        assert self.dim % self.n_heads == 0, (
            f"dim ({self.dim}) must be divisible by n_heads ({self.n_heads})"
        )

    @property
    def head_dim(self) -> int:
        return self.dim // self.n_heads

    @property
    def hidden_dim(self) -> int:
        # Standard LLaMA / Mistral SwiGLU calculation:
        # 2/3 * 4 * dim = 8/3 * dim, rounded up to multiple_of
        hidden_dim = int(2 * (4 * self.dim) / 3)
        if self.ffn_dim_multiplier is not None:
            hidden_dim = int(self.ffn_dim_multiplier * hidden_dim)
        hidden_dim = self.multiple_of * ((hidden_dim + self.multiple_of - 1) // self.multiple_of)
        return hidden_dim

    @classmethod
    def tiny(cls) -> "ModelConfig":
        """Fast proof-of-concept configuration (~15M params). Ideal for quick training on laptops."""
        return cls(
            dim=256,
            n_layers=6,
            n_heads=8,
            n_kv_heads=4,
            vocab_size=50257,
            max_seq_len=512,
            multiple_of=128,
            tie_word_embeddings=True,
        )

    @classmethod
    def small(cls) -> "ModelConfig":
        """Small capable configuration (~65M params). Great for local fine-tuning."""
        return cls(
            dim=512,
            n_layers=8,
            n_heads=8,
            n_kv_heads=4,
            vocab_size=50257,
            max_seq_len=1024,
            multiple_of=256,
            tie_word_embeddings=True,
        )

    @classmethod
    def base(cls) -> "ModelConfig":
        """Base configuration (~150M params). Standard modern small LLM."""
        return cls(
            dim=768,
            n_layers=12,
            n_heads=12,
            n_kv_heads=4,
            vocab_size=50257,
            max_seq_len=2048,
            multiple_of=256,
            tie_word_embeddings=True,
        )
