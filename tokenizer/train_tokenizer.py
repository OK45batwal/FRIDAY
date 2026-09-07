"""Standalone custom BPE Tokenizer trainer from raw text.

Implements byte-level Byte-Pair Encoding (BPE) algorithm from scratch in pure Python.
"""

from typing import Dict, Tuple, List
import json
import os


def get_stats(ids: List[int], counts: Dict[Tuple[int, int], int] = None) -> Dict[Tuple[int, int], int]:
    """Count consecutive pairs in integer list."""
    if counts is None:
        counts = {}
    for pair in zip(ids, ids[1:]):
        counts[pair] = counts.get(pair, 0) + 1
    return counts


def merge(ids: List[int], pair: Tuple[int, int], idx: int) -> List[int]:
    """Replace occurrences of `pair` with new token `idx`."""
    newids = []
    i = 0
    while i < len(ids):
        if i < len(ids) - 1 and ids[i] == pair[0] and ids[i + 1] == pair[1]:
            newids.append(idx)
            i += 2
        else:
            newids.append(ids[i])
            i += 1
    return newids


class CustomBPETokenizer:
    """Byte-level BPE Tokenizer trainable from scratch on arbitrary UTF-8 text."""

    def __init__(self):
        self.merges: Dict[Tuple[int, int], int] = {}
        self.vocab: Dict[int, bytes] = {idx: bytes([idx]) for idx in range(256)}

    def train(self, text: str, vocab_size: int = 1000, verbose: bool = True):
        assert vocab_size >= 256, "Vocab size must be at least 256 for initial bytes"
        num_merges = vocab_size - 256
        tokens = list(text.encode("utf-8"))
        ids = list(tokens)

        for i in range(num_merges):
            stats = get_stats(ids)
            if not stats:
                break
            pair = max(stats, key=stats.get)
            idx = 256 + i
            ids = merge(ids, pair, idx)
            self.merges[pair] = idx
            self.vocab[idx] = self.vocab[pair[0]] + self.vocab[pair[1]]
            if verbose and (i + 1) % 50 == 0:
                print(f"Merge {i + 1}/{num_merges}: {pair} -> {idx}")

    def save(self, file_path: str):
        """Save vocabulary and merge rules."""
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        data = {
            "merges": [f"{p[0]},{p[1]}:{idx}" for p, idx in self.merges.items()],
        }
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load(self, file_path: str):
        """Load vocabulary and merge rules."""
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.merges = {}
        self.vocab = {idx: bytes([idx]) for idx in range(256)}
        for entry in data["merges"]:
            pair_str, idx_str = entry.split(":")
            p0, p1 = pair_str.split(",")
            pair = (int(p0), int(p1))
            idx = int(idx_str)
            self.merges[pair] = idx
            self.vocab[idx] = self.vocab[pair[0]] + self.vocab[pair[1]]
