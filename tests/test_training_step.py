"""Unit tests for training step and gradient propagation."""

import torch
from model.config import ModelConfig
from model.transformer import CustomLLM
from train.train import configure_optimizers


def test_backward_pass_gradients():
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
    optimizer = configure_optimizers(model, weight_decay=0.1, lr=1e-3, betas=(0.9, 0.95))

    tokens = torch.randint(0, config.vocab_size, (2, 8))
    targets = torch.randint(0, config.vocab_size, (2, 8))

    # Initial forward and backward
    model.train()
    optimizer.zero_grad()
    _, initial_loss = model(tokens, targets=targets)
    initial_loss.backward()

    # Verify all non-tied trainable parameters have gradients
    has_grads = [p.grad is not None and torch.isfinite(p.grad).all() for p in model.parameters() if p.requires_grad]
    assert all(has_grads), "Every trainable parameter must receive finite gradients"

    # Step optimizer
    optimizer.step()

    # Step again and check loss computation continues cleanly
    optimizer.zero_grad()
    _, next_loss = model(tokens, targets=targets)
    assert torch.isfinite(next_loss), "Loss must remain finite after optimization step"
