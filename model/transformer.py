"""Custom Decoder-Only Transformer Architecture.

Features:
- RMSNorm pre-normalization
- Rotary Positional Embeddings (RoPE)
- SwiGLU Feed-Forward Network
- Grouped-Query Attention (GQA)
- Efficient KV Caching for fast inference
- F.scaled_dot_product_attention (SDPA) for FlashAttention/Metal acceleration
"""

from typing import Optional, Tuple, List
import math
import torch
import torch.nn as nn
import torch.nn.functional as F

from .config import ModelConfig
from .rope import precompute_freqs_cis, apply_rotary_emb


class RMSNorm(nn.Module):
    """Root Mean Square Layer Normalization (Zhang & Sennrich, 2019)."""

    def __init__(self, dim: int, eps: float = 1e-5):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def _norm(self, x: torch.Tensor) -> torch.Tensor:
        return x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        output = self._norm(x.float()).type_as(x)
        return output * self.weight


class FeedForward(nn.Module):
    """SwiGLU Feed-Forward Network (Shazeer, 2020 / LLaMA)."""

    def __init__(self, config: ModelConfig):
        super().__init__()
        self.w1 = nn.Linear(config.dim, config.hidden_dim, bias=False)  # Gate projection
        self.w2 = nn.Linear(config.hidden_dim, config.dim, bias=False)  # Down projection
        self.w3 = nn.Linear(config.dim, config.hidden_dim, bias=False)  # Up projection
        self.dropout = nn.Dropout(config.dropout) if config.dropout > 0 else nn.Identity()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # SwiGLU(x) = (SiLU(x @ w1) * (x @ w3)) @ w2
        return self.dropout(self.w2(F.silu(self.w1(x)) * self.w3(x)))


class KVCache:
    """Key-Value cache for single layer during autoregressive inference."""

    def __init__(self, batch_size: int, max_seq_len: int, n_kv_heads: int, head_dim: int, device: torch.device, dtype: torch.dtype):
        self.k = torch.zeros(batch_size, n_kv_heads, max_seq_len, head_dim, device=device, dtype=dtype)
        self.v = torch.zeros(batch_size, n_kv_heads, max_seq_len, head_dim, device=device, dtype=dtype)
        self.current_length = 0

    def update(self, k: torch.Tensor, v: torch.Tensor, start_pos: int) -> Tuple[torch.Tensor, torch.Tensor]:
        seq_len = k.shape[2]
        self.k[:, :, start_pos : start_pos + seq_len] = k
        self.v[:, :, start_pos : start_pos + seq_len] = v
        self.current_length = start_pos + seq_len
        return (
            self.k[:, :, : self.current_length],
            self.v[:, :, : self.current_length],
        )


class Attention(nn.Module):
    """Multi-Head / Grouped-Query Attention with RoPE and KV-cache support."""

    def __init__(self, config: ModelConfig):
        super().__init__()
        self.n_heads = config.n_heads
        self.n_kv_heads = config.n_kv_heads if config.n_kv_heads is not None else config.n_heads
        self.head_dim = config.head_dim
        self.n_rep = self.n_heads // self.n_kv_heads

        self.wq = nn.Linear(config.dim, self.n_heads * self.head_dim, bias=False)
        self.wk = nn.Linear(config.dim, self.n_kv_heads * self.head_dim, bias=False)
        self.wv = nn.Linear(config.dim, self.n_kv_heads * self.head_dim, bias=False)
        self.wo = nn.Linear(self.n_heads * self.head_dim, config.dim, bias=False)
        self.dropout = config.dropout

    def forward(
        self,
        x: torch.Tensor,
        cos: torch.Tensor,
        sin: torch.Tensor,
        start_pos: int = 0,
        kv_cache: Optional[KVCache] = None,
    ) -> torch.Tensor:
        batch_size, seq_len, _ = x.shape

        # Linear projections
        xq = self.wq(x)
        xk = self.wk(x)
        xv = self.wv(x)

        # Reshape to (batch, heads, seq_len, head_dim)
        xq = xq.view(batch_size, seq_len, self.n_heads, self.head_dim).transpose(1, 2)
        xk = xk.view(batch_size, seq_len, self.n_kv_heads, self.head_dim).transpose(1, 2)
        xv = xv.view(batch_size, seq_len, self.n_kv_heads, self.head_dim).transpose(1, 2)

        # Apply Rotary Position Embeddings
        xq, xk = apply_rotary_emb(xq, xk, cos=cos, sin=sin, start_pos=start_pos)

        # Handle KV Cache for fast autoregressive generation
        if kv_cache is not None:
            xk, xv = kv_cache.update(xk, xv, start_pos=start_pos)
        
        # Repeat KV heads for Grouped-Query Attention (GQA) if n_heads > n_kv_heads
        if self.n_rep > 1:
            xk = torch.repeat_interleave(xk, self.n_rep, dim=1)
            xv = torch.repeat_interleave(xv, self.n_rep, dim=1)

        # Causal mask: only needed when seq_len > 1 (e.g. prefill or training)
        is_causal = (seq_len > 1) and (kv_cache is None or start_pos == 0)

        # Scaled Dot-Product Attention (SDPA leverages Apple MPS / cuDNN / FlashAttention)
        dropout_p = self.dropout if self.training else 0.0
        output = F.scaled_dot_product_attention(
            xq, xk, xv,
            attn_mask=None,
            dropout_p=dropout_p,
            is_causal=is_causal,
        )

        # Transpose and reshape back to (batch, seq_len, dim)
        output = output.transpose(1, 2).contiguous().view(batch_size, seq_len, -1)
        return self.wo(output)


class TransformerBlock(nn.Module):
    """Transformer decoder block with RMSNorm, RoPE Attention, and SwiGLU FFN."""

    def __init__(self, layer_id: int, config: ModelConfig):
        super().__init__()
        self.layer_id = layer_id
        self.attention_norm = RMSNorm(config.dim, eps=config.norm_eps)
        self.attention = Attention(config)
        self.ffn_norm = RMSNorm(config.dim, eps=config.norm_eps)
        self.feed_forward = FeedForward(config)

    def forward(
        self,
        x: torch.Tensor,
        cos: torch.Tensor,
        sin: torch.Tensor,
        start_pos: int = 0,
        kv_cache: Optional[KVCache] = None,
    ) -> torch.Tensor:
        # Pre-norm residual connection for attention
        h = x + self.attention(self.attention_norm(x), cos=cos, sin=sin, start_pos=start_pos, kv_cache=kv_cache)
        # Pre-norm residual connection for feed-forward
        out = h + self.feed_forward(self.ffn_norm(h))
        return out


class CustomLLM(nn.Module):
    """Full Custom Decoder-Only Transformer Language Model."""

    def __init__(self, config: ModelConfig):
        super().__init__()
        self.config = config

        self.tok_embeddings = nn.Embedding(config.vocab_size, config.dim)
        self.dropout = nn.Dropout(config.dropout) if config.dropout > 0 else nn.Identity()

        self.layers = nn.ModuleList([
            TransformerBlock(i, config) for i in range(config.n_layers)
        ])

        self.norm = RMSNorm(config.dim, eps=config.norm_eps)
        self.lm_head = nn.Linear(config.dim, config.vocab_size, bias=False)

        # Weight tying (presses memory usage down significantly)
        if config.tie_word_embeddings:
            self.lm_head.weight = self.tok_embeddings.weight

        # Precompute RoPE frequency tables
        cos, sin = precompute_freqs_cis(
            dim=config.head_dim,
            end=config.max_seq_len,
            theta=config.rope_theta,
        )
        self.register_buffer("rope_cos", cos, persistent=False)
        self.register_buffer("rope_sin", sin, persistent=False)

        # Initialize weights
        self.apply(self._init_weights)

    def _init_weights(self, module: nn.Module):
        if isinstance(module, nn.Linear):
            # Normal distribution scaled by layer depth
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)

    def get_num_params(self, non_embedding: bool = False) -> int:
        """Calculate total number of parameters."""
        n_params = sum(p.numel() for p in self.parameters())
        if non_embedding and not self.config.tie_word_embeddings:
            n_params -= self.tok_embeddings.weight.numel()
        return n_params

    def init_kv_caches(
        self,
        batch_size: int,
        device: Optional[torch.device] = None,
        dtype: Optional[torch.dtype] = None,
    ) -> List[KVCache]:
        """Initialize empty KV caches for all layers."""
        if device is None:
            device = self.tok_embeddings.weight.device
        if dtype is None:
            dtype = self.tok_embeddings.weight.dtype
        n_kv_heads = self.config.n_kv_heads if self.config.n_kv_heads is not None else self.config.n_heads
        return [
            KVCache(
                batch_size=batch_size,
                max_seq_len=self.config.max_seq_len,
                n_kv_heads=n_kv_heads,
                head_dim=self.config.head_dim,
                device=device,
                dtype=dtype,
            )
            for _ in range(self.config.n_layers)
        ]

    def forward(
        self,
        tokens: torch.Tensor,
        targets: Optional[torch.Tensor] = None,
        kv_caches: Optional[List[KVCache]] = None,
        start_pos: int = 0,
    ) -> Tuple[torch.Tensor, Optional[torch.Tensor]]:
        """
        Forward pass.
        
        Args:
            tokens: Tensor of shape (batch, seq_len) with token IDs.
            targets: Optional tensor of shape (batch, seq_len) with target token IDs.
            kv_caches: Optional list of KVCache objects per layer for generation.
            start_pos: Starting position index in sequence (used with kv_caches).
            
        Returns:
            logits: (batch, seq_len, vocab_size)
            loss: Cross-entropy scalar loss if targets provided, else None.
        """
        batch_size, seq_len = tokens.shape
        assert seq_len + start_pos <= self.config.max_seq_len, (
            f"Sequence length {seq_len + start_pos} exceeds max_seq_len {self.config.max_seq_len}"
        )

        # Token embedding
        h = self.dropout(self.tok_embeddings(tokens))

        # Forward through transformer layers
        for i, layer in enumerate(self.layers):
            layer_cache = kv_caches[i] if kv_caches is not None else None
            h = layer(
                h,
                cos=self.rope_cos,
                sin=self.rope_sin,
                start_pos=start_pos,
                kv_cache=layer_cache,
            )

        # Final RMSNorm
        h = self.norm(h)

        # Compute output logits
        logits = self.lm_head(h)

        # Calculate loss if targets are provided
        loss = None
        if targets is not None:
            # Flatten (batch * seq_len, vocab_size) and targets (batch * seq_len)
            loss = F.cross_entropy(logits.view(-1, self.config.vocab_size), targets.view(-1))

        return logits, loss
