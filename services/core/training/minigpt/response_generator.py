import logging
import threading
from pathlib import Path
from typing import Optional, Dict, Any, List

import torch

from services.core.training.minigpt.tokenizer import MiniTokenizer
from services.core.training.minigpt.minigpt_model import MiniGPT, MiniGPTConfig

logger = logging.getLogger(__name__)

CHECKPOINT_DIR = Path(__file__).resolve().parent / "checkpoints"
MODEL_PATH = CHECKPOINT_DIR / "minigpt_v0_1_model.pt"
TOKENIZER_PATH = CHECKPOINT_DIR / "tokenizer.json"

# Hard ceiling on generated tokens regardless of what a caller asks for.
MAX_NEW_TOKENS_CEILING = 512


class MiniGPTResponseGenerator:
    """
    Response Engine for MiniGPT v0.1.
    Performs context tokenization, autoregressive sampling, and detokenization.
    """

    def __init__(self):
        self.model: Optional[MiniGPT] = None
        self.tokenizer: Optional[MiniTokenizer] = None
        self._load_attempted = False
        # Serialises inference: a single nn.Module is not safe to run
        # concurrently, and two overlapping generate() calls would interleave.
        self._lock = threading.Lock()

    def _load(self):
        """
        Load the checkpoint on first use.

        This used to run at import time from a module-scope singleton, so simply
        importing this module paid the full torch load cost — and did it during
        application startup, before anything had asked for a response.
        """
        if self._load_attempted:
            return
        self._load_attempted = True

        if not (MODEL_PATH.exists() and TOKENIZER_PATH.exists()):
            logger.info("MiniGPT checkpoint not present; generator disabled.")
            return

        try:
            self.tokenizer = MiniTokenizer()
            self.tokenizer.load(TOKENIZER_PATH)

            # weights_only=True: torch.load unpickles, and unpickling executes
            # arbitrary code embedded in the file. The checkpoint lives in a
            # directory the app writes to and was previously loaded with
            # weights_only=False, which turns "drop a file in checkpoints/" into
            # code execution. weights_only=True restricts the unpickler to plain
            # tensors and primitives, so the config below is rebuilt from a dict
            # rather than restored as a pickled dataclass instance.
            checkpoint = torch.load(MODEL_PATH, map_location="cpu", weights_only=True)

            raw_config = checkpoint.get("config")
            if isinstance(raw_config, dict):
                config = MiniGPTConfig(**raw_config)
            else:
                config = MiniGPTConfig(vocab_size=self.tokenizer.vocab_size)

            self.model = MiniGPT(config)
            self.model.load_state_dict(checkpoint["model_state_dict"])
            self.model.eval()
            logger.info("MiniGPT checkpoint loaded.")
        except Exception:
            logger.warning("Could not load MiniGPT checkpoint", exc_info=True)
            self.model = None
            self.tokenizer = None

    def generate(
        self,
        prompt: str,
        max_new_tokens: int = 80,
        temperature: float = 0.7,
        top_k: int = 30
    ) -> str:
        """Processes input prompt and autoregressively generates text output."""
        self._load()
        if not self.model or not self.tokenizer:
            return ""

        input_ids = self.tokenizer.encode(prompt)
        if not input_ids:
            return ""

        # Clamp so a caller cannot request an unbounded generation.
        max_new_tokens = max(1, min(int(max_new_tokens), MAX_NEW_TOKENS_CEILING))
        block_size = getattr(self.model.config, "block_size", 256)
        input_ids = input_ids[-block_size:]

        x = torch.tensor([input_ids], dtype=torch.long)
        with self._lock, torch.no_grad():
            output_tokens = self.model.generate(
                x,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_k=top_k
            )[0].tolist()

        return self.tokenizer.decode(output_tokens)


# Constructing this is cheap; the checkpoint loads on first generate() call.
response_generator = MiniGPTResponseGenerator()
