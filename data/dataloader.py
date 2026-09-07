"""High-efficiency memory-mapped binary dataset and dataloaders.

Ref: Karpathy's nanoGPT & llm.c binary layout for zero-copy training.
"""

from typing import Tuple, Optional
import os
import numpy as np
import torch


class MemmapDataLoader:
    """
    Zero-copy memory-mapped dataloader for pre-tokenized uint16/uint32 binary dataset files.
    Eliminates Python GC overhead and handles datasets larger than available RAM.
    """

    def __init__(
        self,
        bin_path: str,
        batch_size: int,
        seq_len: int,
        device: torch.device,
        dtype: np.dtype = np.uint16,
    ):
        if not os.path.exists(bin_path):
            raise FileNotFoundError(f"Binary dataset not found at: {bin_path}")

        self.bin_path = bin_path
        self.batch_size = batch_size
        self.seq_len = seq_len
        self.device = device
        self.dtype = dtype

        # Memory-map binary file
        self.data = np.memmap(bin_path, dtype=self.dtype, mode="r")
        self.n_tokens = len(self.data)
        assert self.n_tokens > seq_len + 1, (
            f"Dataset has {self.n_tokens} tokens, but requires at least {seq_len + 2}"
        )

    def sample_batch(self) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Sample a random batch of (inputs, targets) of shape (batch_size, seq_len).
        """
        max_idx = self.n_tokens - self.seq_len - 1
        starts = np.random.randint(0, max_idx, size=self.batch_size)

        x_batch = np.stack([self.data[s : s + self.seq_len] for s in starts])
        y_batch = np.stack([self.data[s + 1 : s + self.seq_len + 1] for s in starts])

        x = torch.from_numpy(x_batch.astype(np.int64)).to(self.device)
        y = torch.from_numpy(y_batch.astype(np.int64)).to(self.device)
        return x, y

    def get_sequential_batches(self, max_batches: Optional[int] = None):
        """
        Yield sequential non-overlapping batches for deterministic evaluation.
        """
        step = self.batch_size * self.seq_len
        count = 0
        for start in range(0, self.n_tokens - step - 1, step):
            if max_batches is not None and count >= max_batches:
                break
            
            x_items = []
            y_items = []
            for b in range(self.batch_size):
                offset = start + b * self.seq_len
                x_items.append(self.data[offset : offset + self.seq_len])
                y_items.append(self.data[offset + 1 : offset + self.seq_len + 1])
                
            x = torch.from_numpy(np.stack(x_items).astype(np.int64)).to(self.device)
            y = torch.from_numpy(np.stack(y_items).astype(np.int64)).to(self.device)
            yield x, y
            count += 1


class ToyTextDataset:
    """In-memory dataset from a simple string or text file for quick smoke tests."""

    def __init__(self, text: str, tokenizer, seq_len: int, device: torch.device):
        self.tokens = np.array(tokenizer.encode(text), dtype=np.int64)
        self.seq_len = seq_len
        self.device = device

    def sample_batch(self, batch_size: int) -> Tuple[torch.Tensor, torch.Tensor]:
        max_idx = len(self.tokens) - self.seq_len - 1
        starts = np.random.randint(0, max_idx, size=batch_size)
        x = torch.tensor([self.tokens[s : s + self.seq_len] for s in starts], device=self.device)
        y = torch.tensor([self.tokens[s + 1 : s + self.seq_len + 1] for s in starts], device=self.device)
        return x, y
