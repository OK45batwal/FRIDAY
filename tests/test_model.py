"""Unit tests for Custom Transformer Architecture."""

import pytest
import torch
from model.config import ModelConfig
from model.transformer import CustomLLM, RMSNorm, Attention, FeedForward
from model.rope import precompute_freqs_cis, apply_rotary_emb


def test_rmsnorm():
    dim = 64
    norm = RMSNorm(dim)
    x = torch.randn(2, 10, dim) * 5.0
    out = norm(x)
    assert out.shape == (2, 10, dim)
    # Check mean square is close to 1
    rms = torch.sqrt(out.pow(2).mean(-1))
    assert torch.allclose(rms, torch.ones_like(rms), atol=1e-2)


def test_rope():
    head_dim = 32
    seq_len = 16
    cos, sin = precompute_freqs_cis(dim=head_dim, end=seq_len)
    assert cos.shape == (seq_len, head_dim // 2)
    assert sin.shape == (seq_len, head_dim // 2)

    xq = torch.randn(2, 4, seq_len, head_dim)
    xk = torch.randn(2, 4, seq_len, head_dim)
    rot_q, rot_k = apply_rotary_emb(xq, xk, cos, sin)
    assert rot_q.shape == xq.shape
    assert rot_k.shape == xk.shape


def test_transformer_forward():
    config = ModelConfig(
        dim=64,
        n_layers=2,
        n_heads=4,
        n_kv_heads=2,
        vocab_size=1000,
        max_seq_len=64,
        multiple_of=32,
    )
    model = CustomLLM(config)
    batch_size, seq_len = 2, 12
    tokens = torch.randint(0, config.vocab_size, (batch_size, seq_len))
    targets = torch.randint(0, config.vocab_size, (batch_size, seq_len))

    logits, loss = model(tokens, targets=targets)
    assert logits.shape == (batch_size, seq_len, config.vocab_size)
    assert loss is not None
    assert loss.item() > 0


def test_kv_cache_parity():
    """Verify that KV-cached incremental generation matches non-cached forward pass."""
    config = ModelConfig(
        dim=64,
        n_layers=2,
        n_heads=4,
        n_kv_heads=2,
        vocab_size=500,
        max_seq_len=32,
        multiple_of=32,
    )
    model = CustomLLM(config)
    model.eval()

    prompt = torch.randint(0, config.vocab_size, (1, 5))
    next_tok = torch.randint(0, config.vocab_size, (1, 1))
    full_seq = torch.cat([prompt, next_tok], dim=1)

    # 1. Full forward pass
    with torch.no_grad():
        full_logits, _ = model(full_seq)
        expected_next_logits = full_logits[:, -1, :]

    # 2. KV-cached forward pass
    with torch.no_grad():
        kv_caches = model.init_kv_caches(batch_size=1)
        # Prefill prompt
        model(prompt, kv_caches=kv_caches, start_pos=0)
        # Step with next token at pos=5
        cached_logits, _ = model(next_tok, kv_caches=kv_caches, start_pos=5)
        actual_next_logits = cached_logits[:, -1, :]

    # Check logits are numerically identical
    assert torch.allclose(expected_next_logits, actual_next_logits, atol=1e-4), (
        f"KV cache output deviated from full forward pass: max diff = {(expected_next_logits - actual_next_logits).abs().max()}"
    )
