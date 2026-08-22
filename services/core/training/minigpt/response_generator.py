import torch
from pathlib import Path
from typing import Optional, Dict, Any, List
from services.core.training.minigpt.tokenizer import MiniTokenizer
from services.core.training.minigpt.minigpt_model import MiniGPT, MiniGPTConfig

CHECKPOINT_DIR = Path(__file__).resolve().parent / "checkpoints"
MODEL_PATH = CHECKPOINT_DIR / "minigpt_v0_1_model.pt"
TOKENIZER_PATH = CHECKPOINT_DIR / "tokenizer.json"

class MiniGPTResponseGenerator:
    """
    Response Engine for MiniGPT v0.1.
    Performs context tokenization, autoregressive sampling, and detokenization.
    """

    def __init__(self):
        self.model: Optional[MiniGPT] = None
        self.tokenizer: Optional[MiniTokenizer] = None
        self._load()

    def _load(self):
        if MODEL_PATH.exists() and TOKENIZER_PATH.exists():
            try:
                self.tokenizer = MiniTokenizer()
                self.tokenizer.load(TOKENIZER_PATH)

                checkpoint = torch.load(MODEL_PATH, map_location="cpu", weights_only=False)
                config = checkpoint.get("config", MiniGPTConfig(vocab_size=self.tokenizer.vocab_size))
                self.model = MiniGPT(config)
                self.model.load_state_dict(checkpoint["model_state_dict"])
                self.model.eval()
            except Exception as e:
                print("Could not load MiniGPT checkpoint:", e)
                self.model = None

    def generate(
        self,
        prompt: str,
        max_new_tokens: int = 80,
        temperature: float = 0.7,
        top_k: int = 30
    ) -> str:
        """Processes input prompt and autoregressively generates text output."""
        if not self.model or not self.tokenizer:
            return ""

        input_ids = self.tokenizer.encode(prompt)
        if not input_ids:
            return ""

        x = torch.tensor([input_ids], dtype=torch.long)
        with torch.no_grad():
            output_tokens = self.model.generate(
                x,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_k=top_k
            )[0].tolist()

        return self.tokenizer.decode(output_tokens)

response_generator = MiniGPTResponseGenerator()
