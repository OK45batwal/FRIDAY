import json
from pathlib import Path
from typing import List, Dict

class MiniTokenizer:
    """
    Subword / Character Tokenizer for MiniGPT v0.1.
    Handles vocabulary generation, token ID encoding, and text decoding.
    """

    def __init__(self):
        self.stoi: Dict[str, int] = {}
        self.itos: Dict[int, str] = {}
        self.pad_token = "<PAD>"
        self.eos_token = "<EOS>"
        self.unk_token = "<UNK>"

    @property
    def vocab_size(self) -> int:
        return len(self.stoi)

    def train_from_text(self, text: str):
        """Builds vocabulary mapping from input corpus."""
        unique_chars = sorted(list(set(text)))
        special_tokens = [self.pad_token, self.eos_token, self.unk_token]
        all_tokens = special_tokens + unique_chars

        self.stoi = {ch: i for i, ch in enumerate(all_tokens)}
        self.itos = {i: ch for i, ch in enumerate(all_tokens)}

    def encode(self, text: str) -> List[int]:
        """Converts raw string into a list of integer token IDs."""
        unk_id = self.stoi.get(self.unk_token, 2)
        return [self.stoi.get(c, unk_id) for c in text]

    def decode(self, token_ids: List[int]) -> str:
        """Reconstructs text from token IDs, omitting special padding."""
        chars = []
        for idx in token_ids:
            if idx in self.itos:
                ch = self.itos[idx]
                if ch not in [self.pad_token, self.eos_token, self.unk_token]:
                    chars.append(ch)
        return "".join(chars)

    def save(self, filepath: Path):
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump({
                "stoi": self.stoi,
                "itos": {str(k): v for k, v in self.itos.items()}
            }, f, indent=2)

    def load(self, filepath: Path):
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.stoi = data["stoi"]
            self.itos = {int(k): v for k, v in data["itos"].items()}
