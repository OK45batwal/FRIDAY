"""Checkpoint management for saving and resuming training runs."""

import os
from typing import Optional, Dict, Any, Tuple
import torch

from model.config import ModelConfig
from model.transformer import CustomLLM


def save_checkpoint(
    checkpoint_dir: str,
    step: int,
    model: CustomLLM,
    optimizer: torch.optim.Optimizer,
    val_loss: float,
    config: ModelConfig,
    is_best: bool = False,
    filename: Optional[str] = None,
) -> str:
    """Save model checkpoint dictionary."""
    os.makedirs(checkpoint_dir, exist_ok=True)
    if filename is None:
        filename = f"ckpt_step_{step}.pt"

    checkpoint_path = os.path.join(checkpoint_dir, filename)
    state = {
        "step": step,
        "model_state": model.state_dict(),
        "optimizer_state": optimizer.state_dict(),
        "val_loss": val_loss,
        "config": config.__dict__,
    }

    torch.save(state, checkpoint_path)

    if is_best:
        best_path = os.path.join(checkpoint_dir, "best_model.pt")
        torch.save(state, best_path)

    return checkpoint_path


def load_checkpoint(
    checkpoint_path: str,
    device: torch.device,
) -> Tuple[CustomLLM, Dict[str, Any]]:
    """Load model and metadata from a checkpoint file."""
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Checkpoint not found at: {checkpoint_path}")

    checkpoint = torch.load(checkpoint_path, map_location=device)
    config = ModelConfig(**checkpoint["config"])
    model = CustomLLM(config)
    model.load_state_dict(checkpoint["model_state"])
    model.to(device)
    return model, checkpoint
