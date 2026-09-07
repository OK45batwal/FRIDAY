"""Tokenizer implementation supporting BPE via tiktoken with special tokens."""

from typing import List, Union, Optional
import torch

try:
    import tiktoken
except ImportError:
    tiktoken = None


class Tokenizer:
    """
    Tokenizer wrapper around Byte-Pair Encoding (BPE).
    Defaults to GPT-2 standard BPE encoding (vocab_size=50257), which is fast, robust,
    and natively handles any raw UTF-8 byte sequence without unknown token crashes.
    """

    def __init__(self, encoding_name: str = "gpt2"):
        if tiktoken is None:
            raise ImportError(
                "tiktoken is required for Tokenizer. Install with: pip install tiktoken"
            )
        self.encoding_name = encoding_name
        self.enc = tiktoken.get_encoding(encoding_name)
        self.vocab_size = self.enc.n_vocab

        # Define standard special tokens
        self.eot_token = self.enc.eot_token  # End of text (50256 in gpt2)
        self.bos_token_id = self.eot_token
        self.eos_token_id = self.eot_token
        self.pad_token_id = self.eot_token

    def encode(
        self,
        text: str,
        add_bos: bool = False,
        add_eos: bool = False,
        return_tensors: Optional[str] = None,
    ) -> Union[List[int], torch.Tensor]:
        """
        Encode text into a list of token IDs or a PyTorch tensor.
        
        Args:
            text: Input string.
            add_bos: Prepend BOS token if True.
            add_eos: Append EOS token if True.
            return_tensors: If 'pt', returns a torch.LongTensor with shape (1, seq_len).
        """
        tokens = self.enc.encode(text, allowed_special="all")
        if add_bos and (not tokens or tokens[0] != self.bos_token_id):
            tokens = [self.bos_token_id] + tokens
        if add_eos and (not tokens or tokens[-1] != self.eos_token_id):
            tokens = tokens + [self.eos_token_id]

        if return_tensors == "pt":
            return torch.tensor([tokens], dtype=torch.long)
        return tokens

    def decode(self, tokens: Union[List[int], torch.Tensor]) -> str:
        """Decode a list or 1D/2D tensor of token IDs back into string."""
        if isinstance(tokens, torch.Tensor):
            if tokens.ndim == 2:
                tokens = tokens[0].tolist()
            else:
                tokens = tokens.tolist()
        return self.enc.decode(tokens)

    def __len__(self) -> int:
        return self.vocab_size
