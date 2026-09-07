"""Unit tests for Tokenizer."""

import torch
from tokenizer.tokenizer import Tokenizer


def test_tokenizer_roundtrip():
    tok = Tokenizer("gpt2")
    sample_text = "Building a custom transformer language model from scratch in PyTorch!"
    encoded = tok.encode(sample_text)
    assert isinstance(encoded, list)
    assert len(encoded) > 0

    decoded = tok.decode(encoded)
    assert decoded == sample_text


def test_tokenizer_tensor_return():
    tok = Tokenizer("gpt2")
    sample_text = "Testing tensor output."
    tensor = tok.encode(sample_text, return_tensors="pt")
    assert isinstance(tensor, torch.Tensor)
    assert tensor.ndim == 2
    assert tensor.shape[0] == 1
    decoded = tok.decode(tensor)
    assert decoded == sample_text
