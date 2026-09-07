"""Evaluation utilities for calculating validation loss and perplexity."""

import math
from typing import Optional
import torch

from model.transformer import CustomLLM
from data.dataloader import MemmapDataLoader


@torch.no_grad()
def evaluate_loss(
    model: CustomLLM,
    dataloader: MemmapDataLoader,
    eval_batches: int = 20,
) -> float:
    """
    Estimate model loss and perplexity across sequential or sample batches.
    
    Returns:
        mean_loss: Average cross-entropy loss across evaluated batches.
    """
    model.eval()
    losses = []

    for x, y in dataloader.get_sequential_batches(max_batches=eval_batches):
        _, loss = model(x, targets=y)
        losses.append(loss.item())

    model.train()
    if not losses:
        return 0.0

    mean_loss = sum(losses) / len(losses)
    return mean_loss


def calculate_perplexity(loss: float) -> float:
    """Compute perplexity from cross-entropy loss."""
    try:
        return math.exp(loss)
    except OverflowError:
        return float("inf")
