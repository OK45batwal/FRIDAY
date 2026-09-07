"""Rotary Position Embeddings (RoPE) implementation.

RoPE encodes relative position by rotating queries and keys in the 2D complex plane.
Ref: Su et al., 'RoFormer: Enhanced Transformer with Rotary Position Embedding' (2021).
"""

from typing import Tuple
import torch


def precompute_freqs_cis(dim: int, end: int, theta: float = 10000.0) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    Precompute cosine and sine frequency tables for RoPE up to length `end`.
    
    Args:
        dim: Dimension of each attention head (must be even).
        end: Maximum sequence length.
        theta: Frequency base (default: 10000.0).
        
    Returns:
        cos: Tensor of shape (end, dim // 2)
        sin: Tensor of shape (end, dim // 2)
    """
    assert dim % 2 == 0, f"Head dim must be even, got {dim}"
    # theta_i = 1 / (theta ** (2i / dim)) for i in 0 .. dim/2 - 1
    freqs = 1.0 / (theta ** (torch.arange(0, dim, 2)[: (dim // 2)].float() / dim))
    t = torch.arange(end, dtype=torch.float32)
    # Outer product: (end, dim // 2)
    freqs = torch.outer(t, freqs)
    
    cos = torch.cos(freqs)
    sin = torch.sin(freqs)
    return cos, sin


def apply_rotary_emb(
    xq: torch.Tensor,
    xk: torch.Tensor,
    cos: torch.Tensor,
    sin: torch.Tensor,
    start_pos: int = 0,
) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    Apply rotary embeddings to query and key tensors.
    
    Args:
        xq: Query tensor of shape (batch, n_heads, seq_len, head_dim)
        xk: Key tensor of shape (batch, n_kv_heads, seq_len, head_dim)
        cos: Precomputed cos table (max_seq_len, head_dim // 2)
        sin: Precomputed sin table (max_seq_len, head_dim // 2)
        start_pos: Starting position index for KV-cached inference.
        
    Returns:
        xq_out, xk_out: Rotated query and key tensors matching original shapes.
    """
    seq_len = xq.shape[2]
    
    # Slice frequencies for the current token range [start_pos, start_pos + seq_len]
    cur_cos = cos[start_pos : start_pos + seq_len].to(xq.device, dtype=xq.dtype)  # (seq_len, head_dim // 2)
    cur_sin = sin[start_pos : start_pos + seq_len].to(xk.device, dtype=xk.dtype)  # (seq_len, head_dim // 2)
    
    # Reshape for broadcasting: (1, 1, seq_len, head_dim // 2)
    cur_cos = cur_cos.unsqueeze(0).unsqueeze(1)
    cur_sin = cur_sin.unsqueeze(0).unsqueeze(1)
    
    def _rotate_half(x: torch.Tensor) -> torch.Tensor:
        # Split last dimension into pairs: (..., head_dim // 2, 2)
        # x1, x2 -> (-x2, x1)
        x1 = x[..., 0::2]
        x2 = x[..., 1::2]
        out = torch.stack([x1 * cur_cos - x2 * cur_sin, x1 * cur_sin + x2 * cur_cos], dim=-1)
        return out.flatten(-2)
    
    xq_out = _rotate_half(xq)
    xk_out = _rotate_half(xk)
    return xq_out, xk_out
