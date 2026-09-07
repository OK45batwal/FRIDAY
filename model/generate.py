"""Autoregressive generation with KV-cache, temperature, top-k, and top-p sampling."""

from typing import Optional, List, Generator
import torch
import torch.nn.functional as F

from .transformer import CustomLLM


def sample_top_p_top_k(
    logits: torch.Tensor,
    temperature: float = 1.0,
    top_k: int = 50,
    top_p: float = 0.9,
) -> torch.Tensor:
    """
    Sample next token index from logits using temperature, top-k, and nucleus (top-p) filtering.
    """
    if temperature <= 0.0:
        # Greedy sampling
        return torch.argmax(logits, dim=-1, keepdim=True)

    logits = logits / max(temperature, 1e-5)

    # Top-K filtering
    if top_k > 0:
        top_k = min(top_k, logits.size(-1))
        indices_to_remove = logits < torch.topk(logits, top_k)[0][..., -1, None]
        logits[indices_to_remove] = -float("Inf")

    # Top-P (nucleus) filtering
    if 0.0 < top_p < 1.0:
        sorted_logits, sorted_indices = torch.sort(logits, descending=True)
        cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)

        # Remove tokens with cumulative probability above top_p threshold
        sorted_indices_to_remove = cumulative_probs > top_p
        # Shift indices to the right to keep the first token above threshold
        sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
        sorted_indices_to_remove[..., 0] = False

        # Scatter back to original indices
        indices_to_remove = sorted_indices_to_remove.scatter(1, sorted_indices, sorted_indices_to_remove)
        logits[indices_to_remove] = -float("Inf")

    probs = F.softmax(logits, dim=-1)
    next_token = torch.multinomial(probs, num_samples=1)
    return next_token


@torch.no_grad()
def generate(
    model: CustomLLM,
    prompt_tokens: torch.Tensor,
    max_new_tokens: int = 128,
    temperature: float = 0.8,
    top_k: int = 50,
    top_p: float = 0.9,
    eos_id: Optional[int] = None,
    use_kv_cache: bool = True,
) -> torch.Tensor:
    """
    Autoregressively generate tokens given an initial prompt tensor (batch_size, prompt_len).
    """
    model.eval()
    batch_size, prompt_len = prompt_tokens.shape
    device = prompt_tokens.device

    if use_kv_cache:
        kv_caches = model.init_kv_caches(
            batch_size=batch_size,
            device=device,
            dtype=model.tok_embeddings.weight.dtype,
        )
        # Prefill prompt tokens
        logits, _ = model(prompt_tokens, kv_caches=kv_caches, start_pos=0)
        next_token_logits = logits[:, -1, :]
        next_token = sample_top_p_top_k(next_token_logits, temperature, top_k, top_p)

        tokens = [prompt_tokens, next_token]
        cur_pos = prompt_len

        for _ in range(max_new_tokens - 1):
            if eos_id is not None and (next_token == eos_id).all():
                break
            logits, _ = model(next_token, kv_caches=kv_caches, start_pos=cur_pos)
            next_token = sample_top_p_top_k(logits[:, -1, :], temperature, top_k, top_p)
            tokens.append(next_token)
            cur_pos += 1

        return torch.cat(tokens, dim=1)
    else:
        # Non-cached forward pass (simpler, recomputes entire sequence)
        curr_tokens = prompt_tokens.clone()
        for _ in range(max_new_tokens):
            if curr_tokens.shape[1] >= model.config.max_seq_len:
                break
            logits, _ = model(curr_tokens)
            next_token = sample_top_p_top_k(logits[:, -1, :], temperature, top_k, top_p)
            curr_tokens = torch.cat([curr_tokens, next_token], dim=1)
            if eos_id is not None and (next_token == eos_id).all():
                break
        return curr_tokens


@torch.no_grad()
def generate_stream(
    model: CustomLLM,
    prompt_tokens: torch.Tensor,
    max_new_tokens: int = 128,
    temperature: float = 0.8,
    top_k: int = 50,
    top_p: float = 0.9,
    eos_id: Optional[int] = None,
) -> Generator[int, None, None]:
    """
    Yields single generated token IDs one-by-one for live interactive streaming.
    Only supports batch_size = 1.
    """
    model.eval()
    assert prompt_tokens.shape[0] == 1, "Streaming generator only supports batch size 1"
    prompt_len = prompt_tokens.shape[1]
    device = prompt_tokens.device

    kv_caches = model.init_kv_caches(
        batch_size=1,
        device=device,
        dtype=model.tok_embeddings.weight.dtype,
    )

    # Prefill
    logits, _ = model(prompt_tokens, kv_caches=kv_caches, start_pos=0)
    next_token = sample_top_p_top_k(logits[:, -1, :], temperature, top_k, top_p)
    token_id = int(next_token.item())
    yield token_id
    if eos_id is not None and token_id == eos_id:
        return

    cur_pos = prompt_len
    for _ in range(max_new_tokens - 1):
        if cur_pos >= model.config.max_seq_len:
            break
        logits, _ = model(next_token, kv_caches=kv_caches, start_pos=cur_pos)
        next_token = sample_top_p_top_k(logits[:, -1, :], temperature, top_k, top_p)
        token_id = int(next_token.item())
        yield token_id
        if eos_id is not None and token_id == eos_id:
            break
        cur_pos += 1
