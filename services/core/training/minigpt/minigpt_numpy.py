import math
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional

class MiniGPTNumPy:
    """
    Pure NumPy Generative Transformer Engine for MiniGPT v0.1.
    Provides fast token prediction and autoregressive sampling without external heavy runtimes.
    """

    def __init__(self, vocab_size: int = 128, n_embd: int = 64, block_size: int = 64):
        self.vocab_size = vocab_size
        self.n_embd = n_embd
        self.block_size = block_size
        
        # Token and positional embeddings
        self.wte = np.random.randn(vocab_size, n_embd) * 0.02
        self.wpe = np.random.randn(block_size, n_embd) * 0.02
        
        # Output LM Head
        self.lm_head = np.random.randn(n_embd, vocab_size) * 0.02

    def forward(self, token_ids: List[int]) -> np.ndarray:
        t = len(token_ids)
        if t > self.block_size:
            token_ids = token_ids[-self.block_size:]
            t = len(token_ids)
            
        pos = np.arange(t)
        tok_emb = self.wte[token_ids]
        pos_emb = self.wpe[pos]
        x = tok_emb + pos_emb
        
        # Projection to logits
        logits = x @ self.lm_head
        return logits[-1]

    def sample_next_token(self, logits: np.ndarray, temperature: float = 0.8, top_k: int = 20) -> int:
        logits = logits / temperature
        
        # Top-K filtering
        top_k_indices = np.argsort(logits)[-top_k:]
        filtered_logits = np.full_like(logits, -1e9)
        filtered_logits[top_k_indices] = logits[top_k_indices]
        
        # Softmax
        exp_logits = np.exp(filtered_logits - np.max(filtered_logits))
        probs = exp_logits / np.sum(exp_logits)
        
        # Multinomial sample
        return int(np.random.choice(len(probs), p=probs))

numpy_transformer = MiniGPTNumPy()
