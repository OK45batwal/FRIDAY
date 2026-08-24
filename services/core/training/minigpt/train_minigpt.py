import os
import time
import torch
from dataclasses import asdict
from pathlib import Path
from services.core.training.minigpt.data_cleaner import DataCleaner
from services.core.training.minigpt.tokenizer import MiniTokenizer
from services.core.training.minigpt.minigpt_model import MiniGPT, MiniGPTConfig

CHECKPOINT_DIR = Path(__file__).resolve().parent / "checkpoints"
DATA_DIR = Path(__file__).resolve().parent / "data"
CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Sample rich dataset for initial training
DEFAULT_CORPUS = """
Namaste Omkar! I am FRIDAY, your personal AI Operating Assistant.
Artificial intelligence is a branch of computer science dedicated to building systems capable of intelligent reasoning.
Machine learning models learn patterns directly from data rather than following hardcoded rules.
A Transformer uses self-attention mechanisms to understand relationships between tokens across long sequences.
In Python, async functions allow non-blocking execution using asyncio event loops.
FastAPI provides high-performance asynchronous REST endpoints with Pydantic type validation.
React is a declarative library for building interactive user interfaces with components and hooks.
TypeScript adds static type safety to JavaScript, eliminating runtime errors during compilation.
Vector embeddings map words into multi-dimensional geometric spaces where semantically similar concepts cluster together.
Quantization compresses floating point weights into 4-bit integers to run large language models on Mac and Android.
"""

def train_minigpt_model(
    corpus_text: str = DEFAULT_CORPUS,
    epochs: int = 50,
    batch_size: int = 4,
    block_size: int = 64
) -> Path:
    print("=" * 60)
    print("🚀 Initializing MiniGPT v0.1 Training Pipeline")
    print("=" * 60)

    # 1. Clean and prepare datasets
    train_path, val_path = DataCleaner.prepare_dataset(corpus_text, DATA_DIR)

    with open(train_path, "r", encoding="utf-8") as f:
        text_data = f.read()

    # 2. Train Tokenizer
    tokenizer = MiniTokenizer()
    tokenizer.train_from_text(text_data)
    tokenizer.save(CHECKPOINT_DIR / "tokenizer.json")
    print(f"✓ Tokenizer trained. Vocabulary Size: {tokenizer.vocab_size} tokens")

    # 3. Prepare Encoded Tensors
    data = torch.tensor(tokenizer.encode(text_data), dtype=torch.long)
    n = int(0.9 * len(data))
    train_data = data[:n]
    val_data = data[n:]

    def get_batch(split='train'):
        d = train_data if split == 'train' else val_data
        if len(d) <= block_size:
            # Pad if small
            pad_len = block_size - len(d) + 1
            d = torch.cat([d, torch.zeros(pad_len, dtype=torch.long)])
        ix = torch.randint(len(d) - block_size, (batch_size,))
        x = torch.stack([d[i:i+block_size] for i in ix])
        y = torch.stack([d[i+1:i+block_size+1] for i in ix])
        return x, y

    # 4. Initialize MiniGPT
    config = MiniGPTConfig(
        vocab_size=tokenizer.vocab_size,
        block_size=block_size,
        n_layer=4,
        n_head=4,
        n_embd=128
    )
    model = MiniGPT(config)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)

    print(f"✓ MiniGPT initialized ({sum(p.numel() for p in model.parameters()):,} parameters)")
    print("Starting training loop...")

    model.train()
    start_time = time.time()
    for iter_step in range(1, epochs + 1):
        xb, yb = get_batch('train')
        logits, loss = model(xb, yb)

        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        optimizer.step()

        if iter_step % 10 == 0 or iter_step == epochs:
            # Report validation loss too. val_data was computed and then never
            # used, so there was no signal at all about overfitting — train loss
            # alone will fall happily while the model memorises the corpus.
            model.eval()
            with torch.no_grad():
                vxb, vyb = get_batch('val')
                _, val_loss = model(vxb, vyb)
            model.train()
            print(f"  Step {iter_step:03d}/{epochs} | train {loss.item():.4f} | val {val_loss.item():.4f}")

    # 5. Save Checkpoint
    checkpoint_path = CHECKPOINT_DIR / "minigpt_v0_1_model.pt"
    torch.save({
        "model_state_dict": model.state_dict(),
        # asdict, not the dataclass instance: the loader uses
        # torch.load(weights_only=True) so that a checkpoint file cannot execute
        # code, and that unpickler only accepts plain types.
        "config": asdict(config),
        "vocab_size": tokenizer.vocab_size
    }, checkpoint_path)

    elapsed = round(time.time() - start_time, 2)
    print(f"✓ Model saved to {checkpoint_path} in {elapsed}s")
    print("=" * 60)
    return checkpoint_path

if __name__ == "__main__":
    train_minigpt_model()
